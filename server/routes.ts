import type { Express } from "express";
import { storage } from "./storage";
import Airtable from "airtable";

/** Normalize time strings to HH:MM 24-hour format. Handles "1:30 PM", "14:30", "2:00 pm", etc. */
function normalizeTime(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;

  // Match "H:MM AM/PM" or "HH:MM AM/PM"
  const ampm = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = parseInt(ampm[2], 10);
    const period = ampm[3].toUpperCase();
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }

  // Match "H:MM" or "HH:MM" (already 24-hour)
  const mil = s.match(/^(\d{1,2}):(\d{2})$/);
  if (mil) {
    const h = parseInt(mil[1], 10);
    const m = parseInt(mil[2], 10);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }

  return null;
}

export function registerRoutes(app: Express): void {
  // Auth verification endpoint (exempt from auth middleware)
  app.post("/api/auth/verify", (req, res) => {
    const sitePassword = process.env.SITE_PASSWORD;
    if (!sitePassword) {
      return res.json({ authenticated: true });
    }
    const { password } = req.body || {};
    if (password === sitePassword) {
      return res.json({ authenticated: true });
    }
    return res.status(401).json({ error: "Invalid password" });
  });

  // Auth middleware for all other /api/* routes
  app.use("/api", (req, res, next) => {
    const sitePassword = process.env.SITE_PASSWORD;
    if (!sitePassword) {
      return next();
    }
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader === `Bearer ${sitePassword}`) {
      return next();
    }
    return res.status(401).json({ error: "Unauthorized" });
  });

  app.get("/api/panels", async (_req, res) => {
    try {
      const panels = await storage.getPanels();
      res.json(panels);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch panels" });
    }
  });

  app.get("/api/rooms", async (_req, res) => {
    try {
      const rooms = await storage.getRooms();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rooms" });
    }
  });

  app.get("/api/events", async (req, res) => {
    try {
      const { date, roomId } = req.query;

      if (roomId && typeof roomId === "string") {
        const events = await storage.getEventsByRoom(roomId);
        return res.json(events);
      }

      if (date && typeof date === "string") {
        const events = await storage.getEventsByDate(date);
        return res.json(events);
      }

      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/volunteers", async (_req, res) => {
    try {
      const volunteers = await storage.getVolunteers();
      res.json(volunteers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch volunteers" });
    }
  });

  app.get("/api/volunteer-panels", async (_req, res) => {
    try {
      const vp = await storage.getVolunteerPanels();
      res.json(vp);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch volunteer-panels" });
    }
  });

  app.post("/api/sync/airtable", async (_req, res) => {
    try {
      const apiKey = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
      const baseId = process.env.AIRTABLE_BASE_ID;

      if (!apiKey || !baseId) {
        return res.status(500).json({ error: "Airtable credentials not configured" });
      }

      const base = new Airtable({ apiKey }).base(baseId);

      // Step 1: Clear all data
      await storage.clearAll();

      // Step 2: Fetch and insert Rooms (must come before Panels due to FK)
      const roomRecords: { airtableId: string; roomName: string; district: string | null; roomType: string | null }[] = [];
      const skipped: { table: string; reason: string }[] = [];
      await base("Rooms")
        .select({ view: "Grid view" })
        .eachPage((records, fetchNextPage) => {
          for (const record of records) {
            const roomName = ((record.get("Room Name") as string) || "").trim();
            if (!roomName) {
              skipped.push({ table: "Rooms", reason: `Empty row (record ${record.id})` });
              continue;
            }
            roomRecords.push({
              airtableId: record.id,
              roomName,
              district: ((record.get("District") as string) || "").trim() || null,
              roomType: ((record.get("Room Type") as string) || "").trim() || null,
            });
          }
          fetchNextPage();
        });

      const insertedRooms = await storage.insertRooms(
        roomRecords.map((r) => ({ roomName: r.roomName, district: r.district, roomType: r.roomType }))
      );

      const roomsMap: Record<string, string> = {};
      roomRecords.forEach((rec, i) => {
        roomsMap[rec.airtableId] = insertedRooms[i].id;
      });

      // Step 3: Fetch and insert Panels (with schedule fields)
      const panelRecords: {
        airtableId: string;
        panelName: string;
        date: string | null;
        startTime: string | null;
        endTime: string | null;
        airtableRoomId: string | null;
      }[] = [];
      await base("Panels")
        .select({ view: "Grid view" })
        .eachPage((records, fetchNextPage) => {
          for (const record of records) {
            const panelName = ((record.get("Panel Name") as string) || "").trim();
            if (!panelName) {
              skipped.push({ table: "Panels", reason: `Empty row (record ${record.id})` });
              continue;
            }
            const roomLink = record.get("Room") as string[] | undefined;
            panelRecords.push({
              airtableId: record.id,
              panelName,
              date: ((record.get("Date") as string) || "").trim() || null,
              startTime: normalizeTime((record.get("Start Time") as string) || ""),
              endTime: normalizeTime((record.get("End Time") as string) || ""),
              airtableRoomId: roomLink?.[0] || null,
            });
          }
          fetchNextPage();
        });

      const insertedPanels = await storage.insertPanels(
        panelRecords.map((p) => ({
          panelName: p.panelName,
          date: p.date,
          startTime: p.startTime,
          endTime: p.endTime,
          roomId: p.airtableRoomId ? roomsMap[p.airtableRoomId] || null : null,
        }))
      );

      // Build Airtable ID → Postgres UUID map
      const panelsMap: Record<string, string> = {};
      panelRecords.forEach((rec, i) => {
        panelsMap[rec.airtableId] = insertedPanels[i].id;
      });

      // Step 4: Fetch and insert Events
      const eventData: {
        title: string;
        eventType: string | null;
        date: string;
        startTime: string;
        endTime: string;
        panelId: string | null;
        roomId: string | null;
      }[] = [];

      await base("Events")
        .select({ view: "Grid view" })
        .eachPage((records, fetchNextPage) => {
          for (const record of records) {
            const panelLink = record.get("Panel") as string[] | undefined;
            const roomLink = record.get("Room") as string[] | undefined;
            const airtablePanelId = panelLink?.[0] || null;
            const airtableRoomId = roomLink?.[0] || null;

            const title = ((record.get("Title") as string) || "Untitled Event").trim();
            const eventType = ((record.get("Event Type") as string) || "").trim() || null;
            const date = ((record.get("Date") as string) || "").trim();
            const startTime = normalizeTime((record.get("Start Time") as string) || "");
            const endTime = normalizeTime((record.get("End Time") as string) || "");

            if (!date || !startTime || !endTime) {
              skipped.push({ table: "Events", reason: `"${title}" missing date/start/end` });
              continue;
            }

            eventData.push({
              title,
              eventType,
              date,
              startTime,
              endTime,
              panelId: airtablePanelId ? panelsMap[airtablePanelId] || null : null,
              roomId: airtableRoomId ? roomsMap[airtableRoomId] || null : null,
            });
          }
          fetchNextPage();
        });

      const insertedEvents = await storage.insertEvents(eventData);

      // Step 5: Fetch and insert Volunteers + join table
      const volunteerRecords: {
        airtableId: string;
        name: string;
        airtablePanelIds: string[];
      }[] = [];

      await base("Volunteers")
        .select({ view: "Grid view" })
        .eachPage((records, fetchNextPage) => {
          for (const record of records) {
            const panelLinks = (record.get("Panel") as string[] | undefined) || [];

            const name = ((record.get("Name") as string) || "").trim();
            if (!name) {
              skipped.push({ table: "Volunteers", reason: `Empty row (record ${record.id})` });
              continue;
            }

            volunteerRecords.push({
              airtableId: record.id,
              name,
              airtablePanelIds: panelLinks,
            });
          }
          fetchNextPage();
        });

      const insertedVolunteers = await storage.insertVolunteers(
        volunteerRecords.map((v) => ({ name: v.name }))
      );

      // Build join table entries
      const vpData: { volunteerId: string; panelId: string }[] = [];
      volunteerRecords.forEach((rec, i) => {
        const volunteerId = insertedVolunteers[i].id;
        for (const airtablePanelId of rec.airtablePanelIds) {
          const panelId = panelsMap[airtablePanelId];
          if (panelId) {
            vpData.push({ volunteerId, panelId });
          }
        }
      });

      const insertedVP = await storage.insertVolunteerPanels(vpData);

      res.json({
        panels: insertedPanels.length,
        rooms: insertedRooms.length,
        events: insertedEvents.length,
        volunteers: insertedVolunteers.length,
        volunteerPanels: insertedVP.length,
        skipped: skipped.length > 0 ? skipped : undefined,
      });
    } catch (error) {
      console.error("Airtable sync error:", error);
      res.status(500).json({ error: "Failed to sync from Airtable", details: String(error) });
    }
  });

}

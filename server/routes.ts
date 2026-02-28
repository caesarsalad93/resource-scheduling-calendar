import type { Express } from "express";
import { storage } from "./storage";
import Airtable from "airtable";

export function registerRoutes(app: Express): void {
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

      // Step 2: Fetch and insert Panels
      const panelRecords: { airtableId: string; panelName: string }[] = [];
      await base("Panels")
        .select({ view: "Grid view" })
        .eachPage((records, fetchNextPage) => {
          for (const record of records) {
            panelRecords.push({
              airtableId: record.id,
              panelName: (record.get("Panel Name") as string) || "Unnamed Panel",
            });
          }
          fetchNextPage();
        });

      const insertedPanels = await storage.insertPanels(
        panelRecords.map((p) => ({ panelName: p.panelName }))
      );

      // Build Airtable ID → Postgres UUID map
      const panelsMap: Record<string, string> = {};
      panelRecords.forEach((rec, i) => {
        panelsMap[rec.airtableId] = insertedPanels[i].id;
      });

      // Step 3: Fetch and insert Rooms
      const roomRecords: { airtableId: string; roomName: string; district: string | null }[] = [];
      await base("Rooms")
        .select({ view: "Grid view" })
        .eachPage((records, fetchNextPage) => {
          for (const record of records) {
            roomRecords.push({
              airtableId: record.id,
              roomName: (record.get("Room Name") as string) || "Unnamed Room",
              district: (record.get("District") as string) || null,
            });
          }
          fetchNextPage();
        });

      const insertedRooms = await storage.insertRooms(
        roomRecords.map((r) => ({ roomName: r.roomName, district: r.district }))
      );

      const roomsMap: Record<string, string> = {};
      roomRecords.forEach((rec, i) => {
        roomsMap[rec.airtableId] = insertedRooms[i].id;
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

            const title = (record.get("Title") as string) || "Untitled Event";
            const eventType = (record.get("Event Type") as string) || null;
            const date = (record.get("Date") as string) || "";
            const startTime = (record.get("Start Time") as string) || "";
            const endTime = (record.get("End Time") as string) || "";

            if (!date || !startTime || !endTime) {
              console.warn(`Skipping event "${title}" - missing date/start/end`);
              return;
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

      res.json({
        panels: insertedPanels.length,
        rooms: insertedRooms.length,
        events: insertedEvents.length,
      });
    } catch (error) {
      console.error("Airtable sync error:", error);
      res.status(500).json({ error: "Failed to sync from Airtable", details: String(error) });
    }
  });

}

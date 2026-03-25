var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/api-entry.ts
import express from "express";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  events: () => events,
  insertEventSchema: () => insertEventSchema,
  insertPanelSchema: () => insertPanelSchema,
  insertRoomSchema: () => insertRoomSchema,
  insertVolunteerPanelSchema: () => insertVolunteerPanelSchema,
  insertVolunteerSchema: () => insertVolunteerSchema,
  panels: () => panels,
  rooms: () => rooms,
  volunteerPanels: () => volunteerPanels,
  volunteers: () => volunteers
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var rooms = pgTable("rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomName: text("room_name").notNull(),
  district: text("district"),
  roomType: text("room_type")
});
var panels = pgTable("panels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  panelName: text("panel_name").notNull(),
  date: text("date"),
  startTime: text("start_time"),
  endTime: text("end_time"),
  roomId: varchar("room_id").references(() => rooms.id, { onDelete: "cascade" })
});
var events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  eventType: text("event_type"),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  panelId: varchar("panel_id").references(() => panels.id, { onDelete: "cascade" }),
  roomId: varchar("room_id").references(() => rooms.id, { onDelete: "cascade" })
});
var volunteers = pgTable("volunteers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull()
});
var volunteerPanels = pgTable("volunteer_panels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  volunteerId: varchar("volunteer_id").references(() => volunteers.id, { onDelete: "cascade" }).notNull(),
  panelId: varchar("panel_id").references(() => panels.id, { onDelete: "cascade" }).notNull()
});
var insertRoomSchema = createInsertSchema(rooms).omit({ id: true });
var insertPanelSchema = createInsertSchema(panels).omit({ id: true });
var insertEventSchema = createInsertSchema(events).omit({ id: true });
var insertVolunteerSchema = createInsertSchema(volunteers).omit({ id: true });
var insertVolunteerPanelSchema = createInsertSchema(volunteerPanels).omit({ id: true });

// server/db.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}
var sql2 = neon(process.env.DATABASE_URL);
var db = drizzle(sql2, { schema: schema_exports });

// server/storage.ts
import { eq } from "drizzle-orm";
var DbStorage = class {
  async getPanels() {
    return await db.select().from(panels);
  }
  async getRooms() {
    return await db.select().from(rooms);
  }
  async getEvents() {
    return await db.select().from(events);
  }
  async getEventsByDate(date) {
    return await db.select().from(events).where(eq(events.date, date));
  }
  async getEventsByRoom(roomId) {
    return await db.select().from(events).where(eq(events.roomId, roomId));
  }
  async getVolunteers() {
    return await db.select().from(volunteers);
  }
  async getVolunteerPanels() {
    return await db.select().from(volunteerPanels);
  }
  async insertPanels(data) {
    if (data.length === 0) return [];
    return await db.insert(panels).values(data).returning();
  }
  async insertRooms(data) {
    if (data.length === 0) return [];
    return await db.insert(rooms).values(data).returning();
  }
  async insertEvents(data) {
    if (data.length === 0) return [];
    return await db.insert(events).values(data).returning();
  }
  async insertVolunteers(data) {
    if (data.length === 0) return [];
    return await db.insert(volunteers).values(data).returning();
  }
  async insertVolunteerPanels(data) {
    if (data.length === 0) return [];
    return await db.insert(volunteerPanels).values(data).returning();
  }
  async clearAll() {
    await db.delete(volunteerPanels);
    await db.delete(volunteers);
    await db.delete(events);
    await db.delete(panels);
    await db.delete(rooms);
  }
};
var storage = new DbStorage();

// server/routes.ts
import Airtable from "airtable";
function normalizeTime(raw) {
  const s = raw.trim();
  if (!s) return null;
  const ampm = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = parseInt(ampm[2], 10);
    const period = ampm[3].toUpperCase();
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }
  const mil = s.match(/^(\d{1,2}):(\d{2})$/);
  if (mil) {
    const h = parseInt(mil[1], 10);
    const m = parseInt(mil[2], 10);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }
  return null;
}
function registerRoutes(app2) {
  app2.post("/api/auth/verify", (req, res) => {
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
  app2.use("/api", (req, res, next) => {
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
  app2.get("/api/panels", async (_req, res) => {
    try {
      const panels2 = await storage.getPanels();
      res.json(panels2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch panels" });
    }
  });
  app2.get("/api/rooms", async (_req, res) => {
    try {
      const rooms2 = await storage.getRooms();
      res.json(rooms2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rooms" });
    }
  });
  app2.get("/api/events", async (req, res) => {
    try {
      const { date, roomId } = req.query;
      if (roomId && typeof roomId === "string") {
        const events3 = await storage.getEventsByRoom(roomId);
        return res.json(events3);
      }
      if (date && typeof date === "string") {
        const events3 = await storage.getEventsByDate(date);
        return res.json(events3);
      }
      const events2 = await storage.getEvents();
      res.json(events2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });
  app2.get("/api/volunteers", async (_req, res) => {
    try {
      const volunteers2 = await storage.getVolunteers();
      res.json(volunteers2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch volunteers" });
    }
  });
  app2.get("/api/volunteer-panels", async (_req, res) => {
    try {
      const vp = await storage.getVolunteerPanels();
      res.json(vp);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch volunteer-panels" });
    }
  });
  app2.post("/api/sync/airtable", async (_req, res) => {
    try {
      const apiKey = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
      const baseId = process.env.AIRTABLE_BASE_ID;
      if (!apiKey || !baseId) {
        return res.status(500).json({ error: "Airtable credentials not configured" });
      }
      const base = new Airtable({ apiKey }).base(baseId);
      await storage.clearAll();
      const roomRecords = [];
      const skipped = [];
      await base("Rooms").select({ view: "Grid view" }).eachPage((records, fetchNextPage) => {
        for (const record of records) {
          const roomName = (record.get("Room Name") || "").trim();
          if (!roomName) {
            skipped.push({ table: "Rooms", reason: `Empty row (record ${record.id})` });
            continue;
          }
          roomRecords.push({
            airtableId: record.id,
            roomName,
            district: (record.get("District") || "").trim() || null,
            roomType: (record.get("Room Type") || "").trim() || null
          });
        }
        fetchNextPage();
      });
      const insertedRooms = await storage.insertRooms(
        roomRecords.map((r) => ({ roomName: r.roomName, district: r.district, roomType: r.roomType }))
      );
      const roomsMap = {};
      roomRecords.forEach((rec, i) => {
        roomsMap[rec.airtableId] = insertedRooms[i].id;
      });
      const panelRecords = [];
      await base("Panels").select({ view: "Grid view" }).eachPage((records, fetchNextPage) => {
        for (const record of records) {
          const panelName = (record.get("Panel Name") || "").trim();
          if (!panelName) {
            skipped.push({ table: "Panels", reason: `Empty row (record ${record.id})` });
            continue;
          }
          const roomLink = record.get("Room");
          panelRecords.push({
            airtableId: record.id,
            panelName,
            date: (record.get("Date") || "").trim() || null,
            startTime: normalizeTime(record.get("Start Time") || ""),
            endTime: normalizeTime(record.get("End Time") || ""),
            airtableRoomId: roomLink?.[0] || null
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
          roomId: p.airtableRoomId ? roomsMap[p.airtableRoomId] || null : null
        }))
      );
      const panelsMap = {};
      panelRecords.forEach((rec, i) => {
        panelsMap[rec.airtableId] = insertedPanels[i].id;
      });
      const eventData = [];
      await base("Events").select({ view: "Grid view" }).eachPage((records, fetchNextPage) => {
        for (const record of records) {
          const panelLink = record.get("Panel");
          const roomLink = record.get("Room");
          const airtablePanelId = panelLink?.[0] || null;
          const airtableRoomId = roomLink?.[0] || null;
          const title = (record.get("Title") || "Untitled Event").trim();
          const eventType = (record.get("Event Type") || "").trim() || null;
          const date = (record.get("Date") || "").trim();
          const startTime = normalizeTime(record.get("Start Time") || "");
          const endTime = normalizeTime(record.get("End Time") || "");
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
            roomId: airtableRoomId ? roomsMap[airtableRoomId] || null : null
          });
        }
        fetchNextPage();
      });
      const insertedEvents = await storage.insertEvents(eventData);
      const volunteerRecords = [];
      await base("Volunteers").select({ view: "Grid view" }).eachPage((records, fetchNextPage) => {
        for (const record of records) {
          const panelLinks = record.get("Panel") || [];
          const name = (record.get("Name") || "").trim();
          if (!name) {
            skipped.push({ table: "Volunteers", reason: `Empty row (record ${record.id})` });
            continue;
          }
          volunteerRecords.push({
            airtableId: record.id,
            name,
            airtablePanelIds: panelLinks
          });
        }
        fetchNextPage();
      });
      const insertedVolunteers = await storage.insertVolunteers(
        volunteerRecords.map((v) => ({ name: v.name }))
      );
      const vpData = [];
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
        skipped: skipped.length > 0 ? skipped : void 0
      });
    } catch (error) {
      console.error("Airtable sync error:", error);
      res.status(500).json({ error: "Failed to sync from Airtable", details: String(error) });
    }
  });
}

// server/api-entry.ts
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
registerRoutes(app);
var api_entry_default = app;
export {
  api_entry_default as default
};

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
  panels: () => panels,
  rooms: () => rooms
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var panels = pgTable("panels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  panelName: text("panel_name").notNull()
});
var rooms = pgTable("rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomName: text("room_name").notNull(),
  district: text("district")
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
var insertPanelSchema = createInsertSchema(panels).omit({ id: true });
var insertRoomSchema = createInsertSchema(rooms).omit({ id: true });
var insertEventSchema = createInsertSchema(events).omit({ id: true });

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
  async clearAll() {
    await db.delete(events);
    await db.delete(rooms);
    await db.delete(panels);
  }
};
var storage = new DbStorage();

// server/routes.ts
import Airtable from "airtable";
function registerRoutes(app2) {
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
  app2.post("/api/sync/airtable", async (_req, res) => {
    try {
      const apiKey = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
      const baseId = process.env.AIRTABLE_BASE_ID;
      if (!apiKey || !baseId) {
        return res.status(500).json({ error: "Airtable credentials not configured" });
      }
      const base = new Airtable({ apiKey }).base(baseId);
      await storage.clearAll();
      const panelRecords = [];
      await base("Panels").select({ view: "Grid view" }).eachPage((records, fetchNextPage) => {
        for (const record of records) {
          panelRecords.push({
            airtableId: record.id,
            panelName: record.get("Panel Name") || "Unnamed Panel"
          });
        }
        fetchNextPage();
      });
      const insertedPanels = await storage.insertPanels(
        panelRecords.map((p) => ({ panelName: p.panelName }))
      );
      const panelsMap = {};
      panelRecords.forEach((rec, i) => {
        panelsMap[rec.airtableId] = insertedPanels[i].id;
      });
      const roomRecords = [];
      await base("Rooms").select({ view: "Grid view" }).eachPage((records, fetchNextPage) => {
        for (const record of records) {
          roomRecords.push({
            airtableId: record.id,
            roomName: record.get("Room Name") || "Unnamed Room",
            district: record.get("District") || null
          });
        }
        fetchNextPage();
      });
      const insertedRooms = await storage.insertRooms(
        roomRecords.map((r) => ({ roomName: r.roomName, district: r.district }))
      );
      const roomsMap = {};
      roomRecords.forEach((rec, i) => {
        roomsMap[rec.airtableId] = insertedRooms[i].id;
      });
      const eventData = [];
      await base("Events").select({ view: "Grid view" }).eachPage((records, fetchNextPage) => {
        for (const record of records) {
          const panelLink = record.get("Panel");
          const roomLink = record.get("Room");
          const airtablePanelId = panelLink?.[0] || null;
          const airtableRoomId = roomLink?.[0] || null;
          const title = record.get("Title") || "Untitled Event";
          const eventType = record.get("Event Type") || null;
          const date = record.get("Date") || "";
          const startTime = record.get("Start Time") || "";
          const endTime = record.get("End Time") || "";
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
            roomId: airtableRoomId ? roomsMap[airtableRoomId] || null : null
          });
        }
        fetchNextPage();
      });
      const insertedEvents = await storage.insertEvents(eventData);
      res.json({
        panels: insertedPanels.length,
        rooms: insertedRooms.length,
        events: insertedEvents.length
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

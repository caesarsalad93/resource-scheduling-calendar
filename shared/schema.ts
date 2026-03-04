import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomName: text("room_name").notNull(),
  district: text("district"),
});

export const panels = pgTable("panels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  panelName: text("panel_name").notNull(),
  date: text("date"),
  startTime: text("start_time"),
  endTime: text("end_time"),
  roomId: varchar("room_id").references(() => rooms.id, { onDelete: "cascade" }),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  eventType: text("event_type"),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  panelId: varchar("panel_id").references(() => panels.id, { onDelete: "cascade" }),
  roomId: varchar("room_id").references(() => rooms.id, { onDelete: "cascade" }),
});

export const insertRoomSchema = createInsertSchema(rooms).omit({ id: true });
export const insertPanelSchema = createInsertSchema(panels).omit({ id: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true });

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Panel = typeof panels.$inferSelect;
export type InsertPanel = z.infer<typeof insertPanelSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

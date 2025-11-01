import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Panels table - the primary resource being scheduled
export const panels = pgTable("panels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  color: text("color").notNull(),
  location: text("location"),
});

// Events table - activities/bookings tied to panels
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  panelId: varchar("panel_id").notNull().references(() => panels.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  description: text("description"),
  color: text("color"),
  category: text("category"), // autograph, exclusive, panel, cart, media, misc
  location: text("location"),
});

export const insertPanelSchema = createInsertSchema(panels).omit({
  id: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
});

export type InsertPanel = z.infer<typeof insertPanelSchema>;
export type Panel = typeof panels.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Backward compatibility types (deprecated - use Panel instead)
export type Resource = Panel;
export type InsertResource = InsertPanel;

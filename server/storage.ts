import { type Panel, type InsertPanel, type Event, type InsertEvent, panels, events } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Panel operations
  getPanels(): Promise<Panel[]>;
  getPanel(id: string): Promise<Panel | undefined>;
  createPanel(panel: InsertPanel): Promise<Panel>;
  
  // Event operations
  getEvents(): Promise<Event[]>;
  getEventsByDate(date: Date): Promise<Event[]>;
  getEventsByPanel(panelId: string): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;
}

export class DbStorage implements IStorage {
  // Panel operations
  async getPanels(): Promise<Panel[]> {
    return await db.select().from(panels);
  }

  async getPanel(id: string): Promise<Panel | undefined> {
    const results = await db.select().from(panels).where(eq(panels.id, id));
    return results[0];
  }

  async createPanel(panel: InsertPanel): Promise<Panel> {
    const results = await db.insert(panels).values(panel).returning();
    return results[0];
  }

  // Event operations
  async getEvents(): Promise<Event[]> {
    return await db.select().from(events);
  }

  async getEventsByDate(date: Date): Promise<Event[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db.select().from(events).where(
      and(
        gte(events.startTime, startOfDay),
        lte(events.startTime, endOfDay)
      )
    );
  }

  async getEventsByPanel(panelId: string): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.panelId, panelId));
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const results = await db.select().from(events).where(eq(events.id, id));
    return results[0];
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const results = await db.insert(events).values(event).returning();
    return results[0];
  }

  async updateEvent(id: string, updates: Partial<InsertEvent>): Promise<Event | undefined> {
    const results = await db.update(events)
      .set(updates)
      .where(eq(events.id, id))
      .returning();
    return results[0];
  }

  async deleteEvent(id: string): Promise<boolean> {
    const results = await db.delete(events).where(eq(events.id, id)).returning();
    return results.length > 0;
  }
}

export const storage = new DbStorage();

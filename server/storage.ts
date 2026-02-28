import {
  type Panel, type InsertPanel,
  type Room, type InsertRoom,
  type Event, type InsertEvent,
  panels, rooms, events,
} from "../shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getPanels(): Promise<Panel[]>;
  getRooms(): Promise<Room[]>;
  getEvents(): Promise<Event[]>;
  getEventsByDate(date: string): Promise<Event[]>;
  getEventsByRoom(roomId: string): Promise<Event[]>;
  insertPanels(data: InsertPanel[]): Promise<Panel[]>;
  insertRooms(data: InsertRoom[]): Promise<Room[]>;
  insertEvents(data: InsertEvent[]): Promise<Event[]>;
  clearAll(): Promise<void>;
}

export class DbStorage implements IStorage {
  async getPanels(): Promise<Panel[]> {
    return await db.select().from(panels);
  }

  async getRooms(): Promise<Room[]> {
    return await db.select().from(rooms);
  }

  async getEvents(): Promise<Event[]> {
    return await db.select().from(events);
  }

  async getEventsByDate(date: string): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.date, date));
  }

  async getEventsByRoom(roomId: string): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.roomId, roomId));
  }

  async insertPanels(data: InsertPanel[]): Promise<Panel[]> {
    if (data.length === 0) return [];
    return await db.insert(panels).values(data).returning();
  }

  async insertRooms(data: InsertRoom[]): Promise<Room[]> {
    if (data.length === 0) return [];
    return await db.insert(rooms).values(data).returning();
  }

  async insertEvents(data: InsertEvent[]): Promise<Event[]> {
    if (data.length === 0) return [];
    return await db.insert(events).values(data).returning();
  }

  async clearAll(): Promise<void> {
    await db.delete(events);
    await db.delete(rooms);
    await db.delete(panels);
  }
}

export const storage = new DbStorage();

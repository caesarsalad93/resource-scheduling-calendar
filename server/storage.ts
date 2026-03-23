import {
  type Panel, type InsertPanel,
  type Room, type InsertRoom,
  type Event, type InsertEvent,
  type Volunteer, type InsertVolunteer,
  type VolunteerPanel, type InsertVolunteerPanel,
  panels, rooms, events, volunteers, volunteerPanels,
} from "../shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getPanels(): Promise<Panel[]>;
  getRooms(): Promise<Room[]>;
  getEvents(): Promise<Event[]>;
  getEventsByDate(date: string): Promise<Event[]>;
  getEventsByRoom(roomId: string): Promise<Event[]>;
  getVolunteers(): Promise<Volunteer[]>;
  getVolunteerPanels(): Promise<VolunteerPanel[]>;
  insertPanels(data: InsertPanel[]): Promise<Panel[]>;
  insertRooms(data: InsertRoom[]): Promise<Room[]>;
  insertEvents(data: InsertEvent[]): Promise<Event[]>;
  insertVolunteers(data: InsertVolunteer[]): Promise<Volunteer[]>;
  insertVolunteerPanels(data: InsertVolunteerPanel[]): Promise<VolunteerPanel[]>;
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

  async getVolunteers(): Promise<Volunteer[]> {
    return await db.select().from(volunteers);
  }

  async getVolunteerPanels(): Promise<VolunteerPanel[]> {
    return await db.select().from(volunteerPanels);
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

  async insertVolunteers(data: InsertVolunteer[]): Promise<Volunteer[]> {
    if (data.length === 0) return [];
    return await db.insert(volunteers).values(data).returning();
  }

  async insertVolunteerPanels(data: InsertVolunteerPanel[]): Promise<VolunteerPanel[]> {
    if (data.length === 0) return [];
    return await db.insert(volunteerPanels).values(data).returning();
  }

  async clearAll(): Promise<void> {
    await db.delete(volunteerPanels);
    await db.delete(volunteers);
    await db.delete(events);
    await db.delete(panels);
    await db.delete(rooms);
  }
}

export const storage = new DbStorage();

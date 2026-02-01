import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPanelSchema, insertEventSchema } from "@shared/schema";
import { db } from "./db";
import { panels, events } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed endpoint for development
  app.post("/api/seed", async (req, res) => {
    try {
      // Create sample panels
      const samplePanels = [
        { name: "Main Stage", type: "Panel", color: "#3b82f6" },
        { name: "Autograph Hall A", type: "Autograph", color: "#8b5cf6" },
        { name: "Autograph Hall B", type: "Autograph", color: "#a855f7" },
        { name: "Media Room 1", type: "Media", color: "#ec4899" },
        { name: "Exhibit Floor", type: "Cart", color: "#f59e0b" },
        { name: "VIP Lounge", type: "Exclusive", color: "#10b981" },
      ];

      const insertedPanels = await db.insert(panels).values(samplePanels).returning();

      // Create sample events for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sampleEvents = [
        {
          title: "Opening Ceremony",
          panelId: insertedPanels[0].id,
          startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000),
          endTime: new Date(today.getTime() + 10 * 60 * 60 * 1000),
          category: "panel",
          color: "#3b82f6",
        },
        {
          title: "Celebrity Q&A",
          panelId: insertedPanels[0].id,
          startTime: new Date(today.getTime() + 11 * 60 * 60 * 1000),
          endTime: new Date(today.getTime() + 12 * 60 * 60 * 1000),
          category: "panel",
          color: "#3b82f6",
        },
        {
          title: "Actor Signing Session",
          panelId: insertedPanels[1].id,
          startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000),
          endTime: new Date(today.getTime() + 12 * 60 * 60 * 1000),
          category: "autograph",
          color: "#8b5cf6",
        },
        {
          title: "Artist Meet & Greet",
          panelId: insertedPanels[2].id,
          startTime: new Date(today.getTime() + 13 * 60 * 60 * 1000),
          endTime: new Date(today.getTime() + 15 * 60 * 60 * 1000),
          category: "autograph",
          color: "#a855f7",
        },
        {
          title: "Press Interview",
          panelId: insertedPanels[3].id,
          startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000),
          endTime: new Date(today.getTime() + 10 * 60 * 60 * 1000),
          category: "media",
          color: "#ec4899",
        },
        {
          title: "Photo Op Session",
          panelId: insertedPanels[3].id,
          startTime: new Date(today.getTime() + 14 * 60 * 60 * 1000),
          endTime: new Date(today.getTime() + 16 * 60 * 60 * 1000),
          category: "media",
          color: "#ec4899",
        },
        {
          title: "Merchandise Showcase",
          panelId: insertedPanels[4].id,
          startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000),
          endTime: new Date(today.getTime() + 18 * 60 * 60 * 1000),
          category: "cart",
          color: "#f59e0b",
        },
        {
          title: "VIP Reception",
          panelId: insertedPanels[5].id,
          startTime: new Date(today.getTime() + 17 * 60 * 60 * 1000),
          endTime: new Date(today.getTime() + 19 * 60 * 60 * 1000),
          category: "exclusive",
          color: "#10b981",
        },
      ];

      const insertedEvents = await db.insert(events).values(sampleEvents).returning();

      res.json({
        message: "Database seeded successfully",
        panels: insertedPanels.length,
        events: insertedEvents.length,
      });
    } catch (error) {
      console.error("Seed error:", error);
      res.status(500).json({ error: "Failed to seed database" });
    }
  });
  // Panel routes
  app.get("/api/panels", async (req, res) => {
    try {
      const panels = await storage.getPanels();
      res.json(panels);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch panels" });
    }
  });

  app.get("/api/panels/:id", async (req, res) => {
    try {
      const panel = await storage.getPanel(req.params.id);
      if (!panel) {
        return res.status(404).json({ error: "Panel not found" });
      }
      res.json(panel);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch panel" });
    }
  });

  app.post("/api/panels", async (req, res) => {
    try {
      const validated = insertPanelSchema.parse(req.body);
      const panel = await storage.createPanel(validated);
      res.status(201).json(panel);
    } catch (error) {
      res.status(400).json({ error: "Invalid panel data" });
    }
  });

  // Event routes
  app.get("/api/events", async (req, res) => {
    try {
      const { date } = req.query;
      
      if (date && typeof date === "string") {
        const events = await storage.getEventsByDate(new Date(date));
        return res.json(events);
      }
      
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/panel/:panelId", async (req, res) => {
    try {
      const events = await storage.getEventsByPanel(req.params.panelId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch panel events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const validated = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(validated);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid event data" });
    }
  });

  app.patch("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.updateEvent(req.params.id, req.body);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      const success = await storage.deleteEvent(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

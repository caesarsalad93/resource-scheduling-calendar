import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPanelSchema, insertEventSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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

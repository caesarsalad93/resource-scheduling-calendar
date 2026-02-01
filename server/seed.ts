import { db } from "./db";
import { panels, events } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

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
  console.log(`Inserted ${insertedPanels.length} panels`);

  // Create sample events for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sampleEvents = [
    {
      title: "Opening Ceremony",
      panelId: insertedPanels[0].id,
      startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9 AM
      endTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10 AM
      category: "panel",
      color: "#3b82f6",
    },
    {
      title: "Celebrity Q&A",
      panelId: insertedPanels[0].id,
      startTime: new Date(today.getTime() + 11 * 60 * 60 * 1000), // 11 AM
      endTime: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12 PM
      category: "panel",
      color: "#3b82f6",
    },
    {
      title: "Actor Signing Session",
      panelId: insertedPanels[1].id,
      startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10 AM
      endTime: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12 PM
      category: "autograph",
      color: "#8b5cf6",
    },
    {
      title: "Artist Meet & Greet",
      panelId: insertedPanels[2].id,
      startTime: new Date(today.getTime() + 13 * 60 * 60 * 1000), // 1 PM
      endTime: new Date(today.getTime() + 15 * 60 * 60 * 1000), // 3 PM
      category: "autograph",
      color: "#a855f7",
    },
    {
      title: "Press Interview",
      panelId: insertedPanels[3].id,
      startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9 AM
      endTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10 AM
      category: "media",
      color: "#ec4899",
    },
    {
      title: "Photo Op Session",
      panelId: insertedPanels[3].id,
      startTime: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 2 PM
      endTime: new Date(today.getTime() + 16 * 60 * 60 * 1000), // 4 PM
      category: "media",
      color: "#ec4899",
    },
    {
      title: "Merchandise Showcase",
      panelId: insertedPanels[4].id,
      startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10 AM
      endTime: new Date(today.getTime() + 18 * 60 * 60 * 1000), // 6 PM
      category: "cart",
      color: "#f59e0b",
    },
    {
      title: "VIP Reception",
      panelId: insertedPanels[5].id,
      startTime: new Date(today.getTime() + 17 * 60 * 60 * 1000), // 5 PM
      endTime: new Date(today.getTime() + 19 * 60 * 60 * 1000), // 7 PM
      category: "exclusive",
      color: "#10b981",
    },
  ];

  const insertedEvents = await db.insert(events).values(sampleEvents).returning();
  console.log(`Inserted ${insertedEvents.length} events`);

  console.log("Database seeded successfully!");
}

seed().catch(console.error);

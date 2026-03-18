import { db } from "../server/db";
import { users, questions } from "../shared/schema.js";
import { hashSync } from "crypto";

async function seed() {
  console.log("Seeding database...");
  
  // Insert admin user
  const [admin] = await db.insert(users).values({
    username: "admin",
    email: "admin@example.com",
    password: "password123", // In a real app this should be hashed, but our auth uses plain text for now based on the setup
    isAdmin: true,
  }).returning();
  
  console.log("Admin user created:", admin.username);

  // Insert some questions
  const today = new Date();
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }

  const qData = [
    { date: dates[0], questionText: "City of 2012 Olympic athletics", answer: "LONDON", category: "athletics" },
    { date: dates[1], questionText: "100m world record holder", answer: "BOLT", category: "athletics" },
    { date: dates[2], questionText: "2008 Olympic host city", answer: "BEIJING", category: "athletics" },
    { date: dates[3], questionText: "Long jump GOAT", answer: "POWELL", category: "athletics" },
    { date: dates[4], questionText: "Pole vault legend", answer: "BUBKA", category: "athletics" },
  ];

  for (const q of qData) {
    try {
      await db.insert(questions).values(q);
      console.log(`Inserted question for ${q.date}`);
    } catch (e) {
      console.log(`Question for ${q.date} already exists or failed`);
    }
  }

  console.log("Seeding complete.");
  process.exit(0);
}

seed().catch(console.error);
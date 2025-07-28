import { Database } from "bun:sqlite";
import { User, StepEntry } from "../types/index.js";

export class StepBattleDatabase {
  private db: Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
  }

  async initialize(): Promise<void> {
    // Create users table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        steps INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create step_entries table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS step_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        week1 INTEGER,
        week2 INTEGER,
        steps INTEGER,
        entry_type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    this.db.run("PRAGMA foreign_keys = ON");
  }

  async createUser(id: string, name: string): Promise<void> {
    this.db.run("INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)", [
      id,
      name,
    ]);
  }

  async getUser(id: string): Promise<User | null> {
    const userRow = this.db
      .query("SELECT * FROM users WHERE id = ?")
      .get(id) as any;

    if (!userRow) {
      return null;
    }

    const history = await this.getUserHistory(id);
    return {
      id: userRow.id,
      name: userRow.name,
      steps: userRow.steps,
      history,
    };
  }

  async getAllUsers(): Promise<User[]> {
    const rows = this.db
      .query("SELECT * FROM users ORDER BY steps DESC")
      .all() as any[];

    const users: User[] = [];
    for (const row of rows) {
      const history = await this.getUserHistory(row.id);
      users.push({
        id: row.id,
        name: row.name,
        steps: row.steps,
        history,
      });
    }
    return users;
  }

  async addStepEntry(
    userId: string,
    entry: Omit<StepEntry, "entryType">,
    entryType: "manual" | "webhook"
  ): Promise<void> {
    const entryId = `${userId}_${entry.date}_${Date.now()}`;
    let steps = 0;

    if (entryType === "manual" && entry.week1 && entry.week2) {
      // Calculate steps: ((week1 + week2) / 2) * 14
      steps = Math.round(((entry.week1 + entry.week2) / 2) * 14);
    } else if (entryType === "webhook" && entry.steps) {
      steps = entry.steps;
    }

    this.db.run(
      `INSERT INTO step_entries 
       (id, user_id, date, week1, week2, steps, entry_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        entryId,
        userId,
        entry.date,
        entry.week1 || null,
        entry.week2 || null,
        steps,
        entryType,
      ]
    );

    // Update user's total steps
    this.db.run(
      "UPDATE users SET steps = steps + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [steps, userId]
    );
  }

  private async getUserHistory(userId: string): Promise<StepEntry[]> {
    const rows = this.db
      .query("SELECT * FROM step_entries WHERE user_id = ? ORDER BY date DESC")
      .all(userId) as any[];

    return rows.map((row) => ({
      date: row.date,
      week1: row.week1,
      week2: row.week2,
      steps: row.steps,
      entryType: row.entry_type,
    }));
  }

  async close(): Promise<void> {
    this.db.close();
  }
}

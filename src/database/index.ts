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
        steps INTEGER,
        entry_type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Create discord_links table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS discord_links (
        discord_id TEXT PRIMARY KEY,
        apple_device_name TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (apple_device_name) REFERENCES users (id)
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
    entryType: "webhook"
  ): Promise<void> {
    const entryId = `${userId}_${entry.date}_${Date.now()}`;
    let steps = 0;

    if (entry.steps) {
      steps = entry.steps;
    }

    this.db.run(
      `INSERT INTO step_entries 
       (id, user_id, date, steps, entry_type) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        entryId,
        userId,
        entry.date,
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
      steps: row.steps,
      entryType: row.entry_type,
    }));
  }

  async createDiscordLink(discordId: string, appleDeviceName: string): Promise<void> {
    this.db.run(
      "INSERT INTO discord_links (discord_id, apple_device_name) VALUES (?, ?)",
      [discordId, appleDeviceName]
    );
  }

  async getDiscordLink(discordId: string): Promise<string | null> {
    const row = this.db
      .query("SELECT apple_device_name FROM discord_links WHERE discord_id = ?")
      .get(discordId) as any;

    return row ? row.apple_device_name : null;
  }

  async getAppleHealthLink(appleDeviceName: string): Promise<string | null> {
    const row = this.db
      .query("SELECT discord_id FROM discord_links WHERE apple_device_name = ?")
      .get(appleDeviceName) as any;

    return row ? row.discord_id : null;
  }

  async getDiscordUsernameForAppleHealthName(appleDeviceName: string): Promise<string | null> {
    const row = this.db
      .query("SELECT discord_id FROM discord_links WHERE apple_device_name = ?")
      .get(appleDeviceName) as any;

    return row ? row.discord_id : null;
  }

  async getGapChangePercentage(userId: string): Promise<number | null> {
    // Get the last two days of step entries for this user
    const userEntries = this.db
      .query("SELECT date, steps FROM step_entries WHERE user_id = ? ORDER BY date DESC LIMIT 2")
      .all(userId) as any[];

    if (userEntries.length < 2) {
      return null; // Not enough data
    }

    // Get the last two days of step entries for the leader
    const leaderEntries = this.db
      .query(`
        SELECT date, SUM(steps) as total_steps 
        FROM step_entries 
        WHERE date IN (?, ?) 
        GROUP BY date 
        ORDER BY date DESC 
        LIMIT 2
      `)
      .all(userEntries[0].date, userEntries[1].date) as any[];

    if (leaderEntries.length < 2) {
      return null; // Not enough leader data
    }

    // Calculate gaps
    const todayGap = leaderEntries[0].total_steps - userEntries[0].steps;
    const yesterdayGap = leaderEntries[1].total_steps - userEntries[1].steps;

    if (yesterdayGap === 0) {
      return null; // Avoid division by zero
    }

    // Calculate percentage change (positive = catching up, negative = falling behind)
    const percentageChange = ((yesterdayGap - todayGap) / yesterdayGap) * 100;
    return Math.round(percentageChange * 10) / 10; // Round to 1 decimal place
  }

  async close(): Promise<void> {
    this.db.close();
  }
}

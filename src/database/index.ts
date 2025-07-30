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
        guild_id TEXT NOT NULL,
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
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        steps INTEGER,
        entry_type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id, guild_id) REFERENCES users (id, guild_id)
      )
    `);

    // Create discord_links table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS discord_links (
        discord_id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        apple_device_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (apple_device_name, guild_id) REFERENCES users (id, guild_id)
      )
    `);

    this.db.run("PRAGMA foreign_keys = ON");
  }

  async createUser(id: string, name: string, guildId: string): Promise<void> {
    this.db.run("INSERT OR IGNORE INTO users (id, guild_id, name) VALUES (?, ?, ?)", [
      id,
      guildId,
      name,
    ]);
  }

  async getUser(id: string, guildId: string): Promise<User | null> {
    const userRow = this.db
      .query("SELECT * FROM users WHERE id = ? AND guild_id = ?")
      .get(id, guildId) as any;

    if (!userRow) {
      return null;
    }

    const history = await this.getUserHistory(id, guildId);
    return {
      id: userRow.id,
      name: userRow.name,
      steps: userRow.steps,
      history,
    };
  }

  async getAllUsers(guildId: string): Promise<User[]> {
    const rows = this.db
      .query("SELECT * FROM users WHERE guild_id = ? ORDER BY steps DESC")
      .all(guildId) as any[];

    const users: User[] = [];
    for (const row of rows) {
      const history = await this.getUserHistory(row.id, guildId);
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
    entryType: "webhook",
    guildId: string
  ): Promise<void> {
    const entryId = `${userId}_${entry.date}_${Date.now()}`;
    let steps = 0;

    if (entry.steps) {
      steps = entry.steps;
    }

    this.db.run(
      `INSERT INTO step_entries 
       (id, guild_id, user_id, date, steps, entry_type) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        entryId,
        guildId,
        userId,
        entry.date,
        steps,
        entryType,
      ]
    );

    // Update user's total steps
    this.db.run(
      "UPDATE users SET steps = steps + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND guild_id = ?",
      [steps, userId, guildId]
    );
  }

  private async getUserHistory(userId: string, guildId: string): Promise<StepEntry[]> {
    const rows = this.db
      .query("SELECT * FROM step_entries WHERE user_id = ? AND guild_id = ? ORDER BY date DESC")
      .all(userId, guildId) as any[];

    return rows.map((row) => ({
      date: row.date,
      steps: row.steps,
      entryType: row.entry_type,
    }));
  }

  async createDiscordLink(discordId: string, appleDeviceName: string, guildId: string): Promise<void> {
    this.db.run(
      "INSERT INTO discord_links (discord_id, guild_id, apple_device_name) VALUES (?, ?, ?)",
      [discordId, guildId, appleDeviceName]
    );
  }

  async getDiscordLink(discordId: string, guildId: string): Promise<string | null> {
    const row = this.db
      .query("SELECT apple_device_name FROM discord_links WHERE discord_id = ? AND guild_id = ?")
      .get(discordId, guildId) as any;

    return row ? row.apple_device_name : null;
  }

  async getAppleHealthLink(appleDeviceName: string, guildId: string): Promise<string | null> {
    const row = this.db
      .query("SELECT discord_id FROM discord_links WHERE apple_device_name = ? AND guild_id = ?")
      .get(appleDeviceName, guildId) as any;

    return row ? row.discord_id : null;
  }

  async getDiscordUsernameForAppleHealthName(appleDeviceName: string, guildId: string): Promise<string | null> {
    const row = this.db
      .query("SELECT discord_id FROM discord_links WHERE apple_device_name = ? AND guild_id = ?")
      .get(appleDeviceName, guildId) as any;

    return row ? row.discord_id : null;
  }

  async getGapChangePercentage(userId: string, guildId: string): Promise<number | null> {
    // Get the last two days of step entries for this user
    const userEntries = this.db
      .query("SELECT date, steps FROM step_entries WHERE user_id = ? AND guild_id = ? ORDER BY date DESC LIMIT 2")
      .all(userId, guildId) as any[];

    if (userEntries.length < 2) {
      return null; // Not enough data
    }

    // Get the last two days of step entries for the leader
    const leaderEntries = this.db
      .query(`
        SELECT date, SUM(steps) as total_steps 
        FROM step_entries 
        WHERE date IN (?, ?) AND guild_id = ?
        GROUP BY date 
        ORDER BY date DESC 
        LIMIT 2
      `)
      .all(userEntries[0].date, userEntries[1].date, guildId) as any[];

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

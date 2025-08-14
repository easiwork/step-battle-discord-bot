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

    // Create server_config table for channel configuration
    this.db.run(`
      CREATE TABLE IF NOT EXISTS server_config (
        guild_id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    steps: number,
    entryType: "webhook"
  ): Promise<void> {
    const entryId = `${userId}_${Date.now()}`;
    const stepCount = steps || 0;

    this.db.run(
      `INSERT INTO step_entries 
       (id, user_id, steps, entry_type) 
       VALUES (?, ?, ?, ?)`,
      [entryId, userId, stepCount, entryType]
    );

    // Update user's total steps
    this.db.run(
      "UPDATE users SET steps = steps + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [stepCount, userId]
    );
  }

  private async getUserHistory(userId: string): Promise<StepEntry[]> {
    const rows = this.db
      .query(
        "SELECT * FROM step_entries WHERE user_id = ? ORDER BY created_at DESC"
      )
      .all(userId) as any[];

    return rows.map((row) => ({
      timestamp: row.created_at, // Full timestamp from created_at
      steps: row.steps,
      entryType: row.entry_type,
    }));
  }

  async createDiscordLink(
    discordId: string,
    appleDeviceName: string
  ): Promise<void> {
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

  async getDiscordUsernameForAppleHealthName(
    appleDeviceName: string
  ): Promise<string | null> {
    const row = this.db
      .query("SELECT discord_id FROM discord_links WHERE apple_device_name = ?")
      .get(appleDeviceName) as any;

    return row ? row.discord_id : null;
  }

  async getGapChangePercentage(userId: string): Promise<number | null> {
    // Get the last two days of step entries for this user
    const userEntries = this.db
      .query(
        "SELECT DATE(created_at) as date, steps FROM step_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 2"
      )
      .all(userId) as any[];

    if (userEntries.length < 2) {
      return null; // Not enough data
    }

    // Get the last two days of step entries for the leader
    const leaderEntries = this.db
      .query(
        `
        SELECT DATE(created_at) as date, SUM(steps) as total_steps 
        FROM step_entries 
        WHERE DATE(created_at) IN (?, ?) 
        GROUP BY DATE(created_at) 
        ORDER BY date DESC 
        LIMIT 2
      `
      )
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

  // Server configuration methods
  async setServerChannel(guildId: string, channelId: string): Promise<void> {
    this.db.run(
      `INSERT OR REPLACE INTO server_config (guild_id, channel_id, updated_at) 
       VALUES (?, ?, CURRENT_TIMESTAMP)`,
      [guildId, channelId]
    );
  }

  async getServerChannel(guildId: string): Promise<string | null> {
    const row = this.db
      .query("SELECT channel_id FROM server_config WHERE guild_id = ?")
      .get(guildId) as any;

    return row ? row.channel_id : null;
  }

  async getAllServerConfigs(): Promise<
    { guildId: string; channelId: string }[]
  > {
    const rows = this.db
      .query("SELECT guild_id, channel_id FROM server_config")
      .all() as any[];

    return rows.map((row) => ({
      guildId: row.guild_id,
      channelId: row.channel_id,
    }));
  }

  async getLatestStepEntryForWindow(
    userId: string,
    windowDate: string
  ): Promise<{ id: string; steps: number | null } | null> {
    const row = this.db
      .query(
        "SELECT id, steps FROM step_entries WHERE user_id = ? AND DATE(created_at) = ? ORDER BY created_at DESC LIMIT 1"
      )
      .get(userId, windowDate) as any;

    return row ? { id: row.id, steps: row.steps } : null;
  }

  async updateStepEntry(entryId: string, newSteps: number): Promise<void> {
    this.db.run(
      "UPDATE step_entries SET steps = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?",
      [newSteps, entryId]
    );
  }

  async close(): Promise<void> {
    this.db.close();
  }
}

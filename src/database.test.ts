import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { StepBattleDatabase } from "./database/index.js";

describe("StepBattleDatabase", () => {
  let db: StepBattleDatabase;

  beforeEach(() => {
    db = new StepBattleDatabase(":memory:");
    db.initialize();
  });

  afterEach(() => {
    db.close();
  });

  it("should create and retrieve a user", async () => {
    await db.createUser("user1", "Test User");
    const user = await db.getUser("user1");
    expect(user).toBeDefined();
    expect(user?.name).toBe("Test User");
  });

  it("should add API step entry", async () => {
    await db.createUser("user1", "Test User");
    await db.addStepEntry("user1", 5000, "api");
    const user = await db.getUser("user1");
    expect(user?.steps).toBe(5000);
  });

  it("should add another API step entry", async () => {
    await db.createUser("user1", "Test User");
    await db.addStepEntry("user1", 5000, "api");
    await db.addStepEntry("user1", 3000, "api");
    const user = await db.getUser("user1");
    expect(user?.steps).toBe(8000);
  });

  it("should get all users sorted by steps", async () => {
    await db.createUser("user1", "User 1");
    await db.createUser("user2", "User 2");
    await db.addStepEntry("user1", 5000, "api");
    await db.addStepEntry("user2", 7000, "api");
    const users = await db.getAllUsers();
    expect(users[0].name).toBe("User 2");
    expect(users[1].name).toBe("User 1");
  });

  // Bi-weekly period tests
  describe("Bi-weekly period system", () => {
    it("should set and get server start date", async () => {
      const startDate = "2024-01-17T23:59:00.000Z";
      await db.setServerChannel("guild1", "channel1", startDate);
      const retrievedDate = await db.getServerStartDate("guild1");
      expect(retrievedDate).toBe(startDate);
    });

    it("should get latest step entry for a period", async () => {
      await db.createUser("user1", "Test User");

      // Add an entry that should be found in the period
      await db.addStepEntry("user1", 5000, "api");

      // Get the current time and create a period that includes it
      const now = new Date();
      const periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
      const periodEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day from now

      const entry = await db.getLatestStepEntryForPeriod(
        "user1",
        periodStart.toISOString(),
        periodEnd.toISOString()
      );
      expect(entry).toBeDefined();
      expect(entry?.steps).toBe(5000);
    });

    it("should fallback to regular totals when no start date", async () => {
      await db.createUser("user1", "User 1");
      await db.addStepEntry("user1", 5000, "api");
      await db.addStepEntry("user1", 3000, "api");

      // No start date set
      const users = await db.getAllUsersWithBiWeeklyTotals("guild1");
      expect(users[0].steps).toBe(8000); // Regular cumulative total
    });

    it("should handle empty periods correctly", async () => {
      await db.createUser("user1", "User 1");

      const startDate = "2024-01-17T23:59:00.000Z";
      await db.setServerChannel("guild1", "channel1", startDate);

      // No entries in any period
      const users = await db.getAllUsersWithBiWeeklyTotals("guild1");
      expect(users[0].steps).toBe(0);
    });

    it("should calculate bi-weekly totals with start date", async () => {
      await db.createUser("user1", "User 1");
      await db.createUser("user2", "User 2");

      // Set start date to 7 days ago
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      await db.setServerChannel("guild1", "channel1", startDate.toISOString());

      // Add entries that should be counted
      await db.addStepEntry("user1", 5000, "api");
      await db.addStepEntry("user1", 6000, "api");
      await db.addStepEntry("user2", 3000, "api");

      const users = await db.getAllUsersWithBiWeeklyTotals("guild1");

      // Should be sorted by total steps (highest first)
      expect(users[0].name).toBe("User 1");
      expect(users[0].steps).toBeGreaterThan(0); // Should have some steps
      expect(users[1].name).toBe("User 2");
      expect(users[1].steps).toBeGreaterThan(0); // Should have some steps
    });

    it("should handle multiple users with bi-weekly totals", async () => {
      await db.createUser("user1", "User 1");
      await db.createUser("user2", "User 2");
      await db.createUser("user3", "User 3");

      // Set start date to 7 days ago
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      await db.setServerChannel("guild1", "channel1", startDate.toISOString());

      // Add entries for different users
      await db.addStepEntry("user1", 5000, "api");
      await db.addStepEntry("user1", 6000, "api");
      await db.addStepEntry("user2", 3000, "api");
      await db.addStepEntry("user2", 4000, "api");
      await db.addStepEntry("user3", 7000, "api");

      const users = await db.getAllUsersWithBiWeeklyTotals("guild1");

      // Should have 3 users with steps
      expect(users.length).toBe(3);
      expect(users[0].steps).toBeGreaterThan(0);
      expect(users[1].steps).toBeGreaterThan(0);
      expect(users[2].steps).toBeGreaterThan(0);

      // Should be sorted by steps (highest first)
      expect(users[0].steps).toBeGreaterThanOrEqual(users[1].steps);
      expect(users[1].steps).toBeGreaterThanOrEqual(users[2].steps);
    });
  });
});

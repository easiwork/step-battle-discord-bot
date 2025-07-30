import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { StepBattleDatabase } from "./database/index.js";

describe("StepBattleDatabase", () => {
  let db: StepBattleDatabase;

  beforeAll(async () => {
    db = new StepBattleDatabase(":memory:");
    await db.initialize();
  });

  afterAll(async () => {
    await db.close();
  });

  test("should create and retrieve a user", async () => {
    const userId = "123456789";
    const userName = "TestUser";
    const guildId = "test-guild-123";

    await db.createUser(userId, userName, guildId);
    const user = await db.getUser(userId, guildId);

    expect(user).not.toBeNull();
    expect(user?.id).toBe(userId);
    expect(user?.name).toBe(userName);
    expect(user?.steps).toBe(0);
  });

  test("should add webhook step entry", async () => {
    const userId = "987654321";
    const userName = "TestUser2";
    const guildId = "test-guild-123";

    await db.createUser(userId, userName, guildId);

    // Add webhook entry: 50,000 steps
    await db.addStepEntry(
      userId,
      {
        date: "2025-01-01",
        steps: 50000,
      },
      "webhook",
      guildId
    );

    const user = await db.getUser(userId, guildId);
    expect(user?.steps).toBe(50000);
    expect(user?.history).toHaveLength(1);
    expect(user?.history[0].entryType).toBe("webhook");
  });

  test("should add another webhook step entry", async () => {
    const userId = "111222333";
    const userName = "TestUser3";
    const guildId = "test-guild-123";

    await db.createUser(userId, userName, guildId);

    // Add webhook entry: 100,000 steps
    await db.addStepEntry(
      userId,
      {
        date: "2025-01-02",
        steps: 100000,
      },
      "webhook",
      guildId
    );

    const user = await db.getUser(userId, guildId);
    expect(user?.steps).toBe(100000);
    expect(user?.history).toHaveLength(1);
    expect(user?.history[0].entryType).toBe("webhook");
  });

  test("should get all users sorted by steps", async () => {
    const guildId = "test-guild-123";
    const users = await db.getAllUsers(guildId);

    // Should have at least 3 users from previous tests
    expect(users.length).toBeGreaterThanOrEqual(3);

    // Should be sorted by steps (highest first)
    for (let i = 1; i < users.length; i++) {
      expect(users[i - 1].steps).toBeGreaterThanOrEqual(users[i].steps);
    }
  });
});

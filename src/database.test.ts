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

    await db.createUser(userId, userName);
    const user = await db.getUser(userId);

    expect(user).not.toBeNull();
    expect(user?.id).toBe(userId);
    expect(user?.name).toBe(userName);
    expect(user?.steps).toBe(0);
  });

  test("should add manual step entry and calculate correctly", async () => {
    const userId = "987654321";
    const userName = "TestUser2";

    await db.createUser(userId, userName);

    // Add manual entry: week1=8000, week2=9000
    // Expected: ((8000 + 9000) / 2) * 14 = 119,000 steps
    await db.addStepEntry(
      userId,
      {
        date: "2025-01-01",
        week1: 8000,
        week2: 9000,
      },
      "manual"
    );

    const user = await db.getUser(userId);
    expect(user?.steps).toBe(119000);
    expect(user?.history).toHaveLength(1);
    expect(user?.history[0].entryType).toBe("manual");
  });

  test("should add webhook step entry", async () => {
    const userId = "111222333";
    const userName = "TestUser3";

    await db.createUser(userId, userName);

    // Add webhook entry: 100,000 steps
    await db.addStepEntry(
      userId,
      {
        date: "2025-01-02",
        steps: 100000,
      },
      "webhook"
    );

    const user = await db.getUser(userId);
    expect(user?.steps).toBe(100000);
    expect(user?.history).toHaveLength(1);
    expect(user?.history[0].entryType).toBe("webhook");
  });

  test("should get all users sorted by steps", async () => {
    const users = await db.getAllUsers();

    // Should have at least 3 users from previous tests
    expect(users.length).toBeGreaterThanOrEqual(3);

    // Should be sorted by steps (highest first)
    for (let i = 1; i < users.length; i++) {
      expect(users[i - 1].steps).toBeGreaterThanOrEqual(users[i].steps);
    }
  });
});

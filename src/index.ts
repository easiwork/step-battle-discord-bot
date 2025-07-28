import { StepBattleDatabase } from "./database/index.js";
import { StepBattleBot } from "./bot.js";
import { WebhookServer } from "./webhook/server.js";

// Configuration - Replace with your actual values
const config = {
  token: process.env.DISCORD_TOKEN || "",
  clientId: process.env.DISCORD_CLIENT_ID || "",
  webhookSecret: process.env.WEBHOOK_SECRET || "your-secret-key-here",
  authorizedUsers: (process.env.AUTHORIZED_USERS || "")
    .split(",")
    .filter(Boolean),
  databasePath: process.env.DATABASE_PATH || "./step-battle.db",
  webhookPort: parseInt(process.env.WEBHOOK_PORT || "3001"),
  // Map Apple Health user names to Discord user IDs
  userMapping: {
    alice: process.env.ALICE_DISCORD_ID || "",
    bob: process.env.BOB_DISCORD_ID || "",
  },
};

async function main() {
  console.log("🚀 Starting Step Battle Discord Bot...");

  // Validate configuration
  if (!config.token) {
    console.error("❌ DISCORD_TOKEN environment variable is required");
    process.exit(1);
  }

  if (!config.clientId) {
    console.error("❌ DISCORD_CLIENT_ID environment variable is required");
    process.exit(1);
  }

  if (config.authorizedUsers.length === 0) {
    console.error("❌ AUTHORIZED_USERS environment variable is required");
    process.exit(1);
  }

  // Initialize database
  const db = new StepBattleDatabase(config.databasePath);
  await db.initialize();
  console.log("✅ Database initialized");

  // Initialize bot
  const bot = new StepBattleBot(config.token, db, config.authorizedUsers);

  // Register commands
  await bot.registerCommands(config.clientId, config.token);
  console.log("✅ Commands registered");

  // Start bot
  await bot.start(config.token);
  console.log("✅ Bot started");

  // Initialize webhook server
  const webhookServer = new WebhookServer(
    config.webhookPort,
    db,
    config.webhookSecret,
    config.userMapping
  );
  console.log("✅ Webhook server started");

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n🛑 Shutting down...");
    webhookServer.stop();
    await bot.stop();
    await db.close();
    console.log("✅ Shutdown complete");
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\n🛑 Shutting down...");
    webhookServer.stop();
    await bot.stop();
    await db.close();
    console.log("✅ Shutdown complete");
    process.exit(0);
  });

  console.log("🎉 Step Battle Bot is ready!");
  console.log(`📊 Webhook URL: http://localhost:${config.webhookPort}/webhook`);
  console.log(
    "💡 Use /log to submit steps and /leaderboard to view the battle status"
  );
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

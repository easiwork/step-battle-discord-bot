#!/usr/bin/env bun

// Debug script to fetch and display database entries used in leaderboard generation
import { StepBattleDatabase } from "./src/database/index.js";

async function debugLeaderboard() {
  console.log("🔍 Leaderboard Database Debug");
  console.log("=============================");
  console.log("");

  // Load environment variables
  const envPath = "./.env";
  let dbPath = "./step-battle.db"; // Default fallback

  try {
    const envContent = await Bun.file(envPath).text();
    const dbMatch = envContent.match(/DATABASE_PATH\s*=\s*(.+)/);
    if (dbMatch) {
      dbPath = dbMatch[1].trim();
      console.log(`📁 Using database from .env: ${dbPath}`);
    } else {
      console.log(`📁 Using default database path: ${dbPath}`);
    }
  } catch (error) {
    console.log(
      `📁 .env file not found, using default database path: ${dbPath}`
    );
  }

  // Initialize database
  const db = new StepBattleDatabase(dbPath);
  await db.initialize();
  console.log("✅ Database initialized");
  console.log("");

  try {
    // 1. Get all server configurations
    console.log("📋 SERVER CONFIGURATIONS");
    console.log("========================");
    const serverConfigs = await db.getAllServerConfigs();
    if (serverConfigs.length === 0) {
      console.log("❌ No servers configured");
      console.log("   Use /startstepping to configure a channel first");
    } else {
      serverConfigs.forEach((config, index) => {
        console.log(`${index + 1}. Guild ID: ${config.guildId}`);
        console.log(`   Channel ID: ${config.channelId}`);
        console.log("");
      });
    }
    console.log("");

    // 2. Get all users
    console.log("👥 ALL USERS");
    console.log("============");
    const allUsers = await db.getAllUsers();
    if (allUsers.length === 0) {
      console.log("❌ No users in database");
    } else {
      console.log(`Total users: ${allUsers.length}`);
      console.log("");
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (ID: ${user.id})`);
        console.log(`   Total steps: ${user.steps?.toLocaleString() || 0}`);
        console.log(`   History entries: ${user.history.length}`);
        if (user.history.length > 0) {
          console.log("   Recent entries:");
          user.history.slice(0, 3).forEach((entry) => {
            console.log(
              `     - ${entry.timestamp}: ${
                entry.steps?.toLocaleString() || 0
              } steps (${entry.entryType})`
            );
          });
          if (user.history.length > 3) {
            console.log(`     ... and ${user.history.length - 3} more entries`);
          }
        }
        console.log("");
      });
    }
    console.log("");

    // 3. Get Discord links
    console.log("🔗 DISCORD LINKS");
    console.log("================");
    const discordLinks = [];
    for (const user of allUsers) {
      const discordId = await db.getDiscordUsernameForAppleHealthName(
        user.name
      );
      if (discordId) {
        discordLinks.push({ appleName: user.name, discordId });
      }
    }

    if (discordLinks.length === 0) {
      console.log("❌ No Discord links found");
      console.log(
        "   Use /link to connect Discord accounts to Apple device names"
      );
    } else {
      console.log(`Total Discord links: ${discordLinks.length}`);
      console.log("");
      discordLinks.forEach((link, index) => {
        console.log(
          `${index + 1}. Apple: ${link.appleName} → Discord: ${link.discordId}`
        );
      });
    }
    console.log("");

    // 4. Simulate leaderboard generation for each server
    console.log("🏆 LEADERBOARD SIMULATION");
    console.log("=========================");

    let allLinkedUsers = [];

    if (serverConfigs.length === 0) {
      console.log("❌ No servers configured - cannot simulate leaderboard");
    } else {
      for (const config of serverConfigs) {
        console.log(`\n📊 Server: ${config.guildId}`);
        console.log(`Channel: ${config.channelId}`);
        console.log("---");

        // Filter users to only include those who are linked
        const linkedUsers = [];
        for (const user of allUsers) {
          const discordId = await db.getDiscordUsernameForAppleHealthName(
            user.name
          );
          if (discordId) {
            const linkedUser = {
              ...user,
              discordId,
            };
            linkedUsers.push(linkedUser);
            allLinkedUsers.push(linkedUser);
          }
        }

        if (linkedUsers.length === 0) {
          console.log("❌ No linked participants in this server");
          console.log("   Use /link to connect Discord accounts");
        } else {
          // Sort by steps (highest first)
          const sortedUsers = linkedUsers.sort((a, b) => b.steps - a.steps);

          console.log(`Linked participants: ${sortedUsers.length}`);
          console.log("");

          sortedUsers.forEach((user, index) => {
            const position = index + 1;
            let emoji = "🥉";
            if (position === 1) emoji = "🥇";
            else if (position === 2) emoji = "🥈";

            console.log(
              `${emoji} ${position}. ${user.discordId} (${user.name})`
            );
            console.log(`   Steps: ${user.steps?.toLocaleString() || 0}`);
            console.log(`   Recent activity: ${user.history.length} entries`);
          });
        }
      }
    }
    console.log("");

    // 5. Database statistics
    console.log("📈 DATABASE STATISTICS");
    console.log("=====================");
    console.log(`Total users: ${allUsers.length}`);
    console.log(`Total Discord links: ${discordLinks.length}`);
    console.log(`Total servers configured: ${serverConfigs.length}`);

    const totalSteps = allUsers.reduce(
      (sum, user) => sum + (user.steps || 0),
      0
    );
    console.log(`Total steps across all users: ${totalSteps.toLocaleString()}`);

    const totalEntries = allUsers.reduce(
      (sum, user) => sum + user.history.length,
      0
    );
    console.log(`Total step entries: ${totalEntries}`);

    if (allUsers.length > 0) {
      const avgSteps = Math.round(totalSteps / allUsers.length);
      console.log(`Average steps per user: ${avgSteps.toLocaleString()}`);
    }

    if (allLinkedUsers.length > 0) {
      const linkedSteps = allLinkedUsers.reduce(
        (sum, user) => sum + (user.steps || 0),
        0
      );
      console.log(
        `Total steps from linked users: ${linkedSteps.toLocaleString()}`
      );
    }
  } catch (error) {
    console.error("❌ Error during debug:", error);
  } finally {
    await db.close();
    console.log("\n✅ Database connection closed");
  }
}

// Run the debug script
debugLeaderboard().catch(console.error);

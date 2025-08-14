#!/usr/bin/env bun

// Detailed debug script to show exact database queries and raw data
import { StepBattleDatabase } from "./src/database/index.js";

async function debugLeaderboardDetailed() {
  console.log("🔍 Detailed Leaderboard Database Debug");
  console.log("=====================================");
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
    // 1. Raw database queries
    console.log("🗄️ RAW DATABASE QUERIES");
    console.log("=======================");

    // Get all server configs
    console.log("📋 Server Configurations Query:");
    console.log("SELECT guild_id, channel_id FROM server_config");
    const serverConfigs = await db.getAllServerConfigs();
    console.log(`Result: ${serverConfigs.length} rows`);
    if (serverConfigs.length > 0) {
      serverConfigs.forEach((config, index) => {
        console.log(
          `  ${index + 1}. guild_id: ${config.guildId}, channel_id: ${
            config.channelId
          }`
        );
      });
    }
    console.log("");

    // Get all users
    console.log("👥 Users Query:");
    console.log("SELECT * FROM users ORDER BY steps DESC");
    const allUsers = await db.getAllUsers();
    console.log(`Result: ${allUsers.length} rows`);
    if (allUsers.length > 0) {
      allUsers.forEach((user, index) => {
        console.log(
          `  ${index + 1}. id: ${user.id}, name: ${user.name}, steps: ${
            user.steps
          }`
        );
      });
    }
    console.log("");

    // Get step entries for each user
    console.log("📊 Step Entries Query:");
    console.log(
      "SELECT * FROM step_entries WHERE user_id = ? ORDER BY created_at DESC"
    );
    for (const user of allUsers) {
      console.log(`\nUser: ${user.name} (${user.id})`);
      console.log(`  History entries: ${user.history.length}`);
      if (user.history.length > 0) {
        user.history.slice(0, 3).forEach((entry) => {
          console.log(
            `    - ${entry.timestamp}: ${entry.steps} steps (${entry.entryType})`
          );
        });
        if (user.history.length > 3) {
          console.log(`    ... and ${user.history.length - 3} more entries`);
        }
      }
    }
    console.log("");

    // Get Discord links
    console.log("🔗 Discord Links Query:");
    console.log("SELECT discord_id, apple_device_name FROM discord_links");
    const discordLinks = [];
    for (const user of allUsers) {
      const discordId = await db.getDiscordUsernameForAppleHealthName(
        user.name
      );
      if (discordId) {
        discordLinks.push({ appleName: user.name, discordId });
        console.log(`  ${user.name} → ${discordId}`);
      }
    }
    console.log(`Result: ${discordLinks.length} links found`);
    console.log("");

    // 2. Leaderboard generation process
    console.log("🏆 LEADERBOARD GENERATION PROCESS");
    console.log("=================================");

    if (serverConfigs.length === 0) {
      console.log("❌ No servers configured");
      console.log("Step 1: Use /startstepping to configure a channel");
    } else {
      console.log("Step 1: ✅ Servers configured");
      serverConfigs.forEach((config, index) => {
        console.log(
          `  Server ${index + 1}: ${config.guildId} → ${config.channelId}`
        );
      });
    }
    console.log("");

    if (allUsers.length === 0) {
      console.log("Step 2: ❌ No users in database");
      console.log("  Action: Submit steps via webhook or manual entry");
    } else {
      console.log("Step 2: ✅ Users found in database");
      console.log(`  Total users: ${allUsers.length}`);
      allUsers.forEach((user, index) => {
        console.log(
          `    ${index + 1}. ${user.name}: ${
            user.steps?.toLocaleString() || 0
          } steps`
        );
      });
    }
    console.log("");

    if (discordLinks.length === 0) {
      console.log("Step 3: ❌ No Discord links found");
      console.log(
        "  Action: Use /link to connect Discord accounts to Apple device names"
      );
    } else {
      console.log("Step 3: ✅ Discord links found");
      console.log(`  Total links: ${discordLinks.length}`);
      discordLinks.forEach((link, index) => {
        console.log(`    ${index + 1}. ${link.appleName} → ${link.discordId}`);
      });
    }
    console.log("");

    // 3. Simulate exact leaderboard logic
    console.log("🎯 EXACT LEADERBOARD LOGIC SIMULATION");
    console.log("=====================================");

    if (serverConfigs.length === 0) {
      console.log("❌ Cannot generate leaderboard - no servers configured");
    } else {
      for (const config of serverConfigs) {
        console.log(`\n📊 Processing Server: ${config.guildId}`);
        console.log(`Channel: ${config.channelId}`);
        console.log("---");

        // Step 1: Get all users (already done above)
        console.log("1. All users in database:");
        allUsers.forEach((user, index) => {
          console.log(
            `   ${index + 1}. ${user.name}: ${
              user.steps?.toLocaleString() || 0
            } steps`
          );
        });

        // Step 2: Filter to linked users only
        console.log("\n2. Filtering to linked users only:");
        const linkedUsers = [];
        for (const user of allUsers) {
          const discordId = await db.getDiscordUsernameForAppleHealthName(
            user.name
          );
          if (discordId) {
            linkedUsers.push({
              ...user,
              discordId,
            });
            console.log(
              `   ✅ ${user.name} → ${discordId} (${
                user.steps?.toLocaleString() || 0
              } steps)`
            );
          } else {
            console.log(`   ❌ ${user.name} → No Discord link`);
          }
        }

        // Step 3: Sort by steps (highest first)
        console.log("\n3. Sorting by steps (highest first):");
        const sortedUsers = linkedUsers.sort((a, b) => b.steps - a.steps);

        if (sortedUsers.length === 0) {
          console.log(
            "   ❌ No linked participants - leaderboard will show 'no participants' message"
          );
        } else {
          console.log(`   ✅ ${sortedUsers.length} linked participants found`);
          sortedUsers.forEach((user, index) => {
            const position = index + 1;
            let emoji = "🥉";
            if (position === 1) emoji = "🥇";
            else if (position === 2) emoji = "🥈";

            console.log(
              `   ${emoji} ${position}. ${user.discordId} (${user.name}): ${
                user.steps?.toLocaleString() || 0
              } steps`
            );
          });

          console.log("\n4. Final leaderboard would display:");
          const leaderboardEntries = sortedUsers.map((user, index) => {
            const position = index + 1;
            let emoji = "🥉";
            if (position === 1) emoji = "🥇";
            else if (position === 2) emoji = "🥈";

            let entryText = `${emoji} **${user.discordId}**`;
            if (position === 1) {
              entryText += " 🏆 **LEADER**";
            }
            return entryText;
          });

          leaderboardEntries.forEach((entry) => {
            console.log(`   ${entry}`);
          });
        }
      }
    }
    console.log("");

    // 4. Data integrity check
    console.log("🔍 DATA INTEGRITY CHECK");
    console.log("=======================");

    // Check for orphaned step entries
    console.log("Checking for orphaned step entries...");
    let orphanedEntries = 0;
    for (const user of allUsers) {
      if (user.history.length > 0 && !user.steps) {
        console.log(
          `  ⚠️  User ${user.name} has ${user.history.length} entries but 0 total steps`
        );
        orphanedEntries++;
      }
    }
    if (orphanedEntries === 0) {
      console.log("  ✅ No orphaned entries found");
    }

    // Check for users with steps but no entries
    console.log("\nChecking for users with steps but no history...");
    let usersWithStepsNoHistory = 0;
    for (const user of allUsers) {
      if (user.steps && user.steps > 0 && user.history.length === 0) {
        console.log(
          `  ⚠️  User ${user.name} has ${user.steps} steps but no history entries`
        );
        usersWithStepsNoHistory++;
      }
    }
    if (usersWithStepsNoHistory === 0) {
      console.log("  ✅ All users with steps have history entries");
    }

    // Check for unlinked users with steps
    console.log("\nChecking for unlinked users with steps...");
    let unlinkedUsersWithSteps = 0;
    for (const user of allUsers) {
      if (user.steps && user.steps > 0) {
        const discordId = await db.getDiscordUsernameForAppleHealthName(
          user.name
        );
        if (!discordId) {
          console.log(
            `  ⚠️  User ${user.name} has ${user.steps} steps but no Discord link`
          );
          unlinkedUsersWithSteps++;
        }
      }
    }
    if (unlinkedUsersWithSteps === 0) {
      console.log("  ✅ All users with steps are linked to Discord");
    }
  } catch (error) {
    console.error("❌ Error during detailed debug:", error);
  } finally {
    await db.close();
    console.log("\n✅ Database connection closed");
  }
}

// Run the detailed debug script
debugLeaderboardDetailed().catch(console.error);

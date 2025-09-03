#!/usr/bin/env bun

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { 
  getNextLeaderboardTimes, 
  getCurrentWeekInfo, 
  getReminderSchedule 
} from "../src/utils/scheduleUtils.js";

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnvFile() {
  try {
    const envPath = join(__dirname, "..", ".env");
    const envContent = readFileSync(envPath, "utf8");
    
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
  } catch (error) {
    console.log("📝 No .env file found, using default values");
  }
}

// Load environment variables
loadEnvFile();

function checkLeaderboardSchedule() {
  console.log("📅 Checking Leaderboard Schedule Configuration\n");

  // Read environment variables with defaults
  const enabled = process.env.LEADERBOARD_SCHEDULE_ENABLED !== "false";
  const dayOfWeek = parseInt(process.env.LEADERBOARD_DAY_OF_WEEK || "0");
  const hour = parseInt(process.env.LEADERBOARD_HOUR || "23");
  const minute = parseInt(process.env.LEADERBOARD_MINUTE || "59");
  const intervalWeeks = parseInt(process.env.LEADERBOARD_INTERVAL_WEEKS || "2");

  // Display current configuration
  console.log("🔧 Current Configuration:");
  console.log(`   Enabled: ${enabled ? "✅ Yes" : "❌ No"}`);
  console.log(`   Day of Week: ${dayOfWeek} (${getDayName(dayOfWeek)})`);
  console.log(`   Time: ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} UTC`);
  console.log(`   Interval: Every ${intervalWeeks} week(s)`);
  console.log();

  if (!enabled) {
    console.log("⏰ Leaderboard scheduling is disabled");
    return;
  }

  // Create cron expression
  const cronExpression = `${minute} ${hour} * * ${dayOfWeek}`;
  console.log(`⏰ Cron Expression: ${cronExpression}`);

  // Get next 5 run times using shared utility
  console.log("\n📅 Next 5 Leaderboard Posting Times:");
  console.log("   (All times are in UTC)");
  console.log();

  const schedule = { enabled, dayOfWeek, hour, minute, intervalWeeks };
  const nextTimes = getNextLeaderboardTimes(schedule, 5);

  nextTimes.forEach((scheduledTime, index) => {
    const timeString = scheduledTime.timestamp.toISOString().replace("T", " ").replace("Z", " UTC");
    console.log(`   ${index + 1}. ${timeString} (${scheduledTime.timeUntil})`);
  });

  // Check if it's the right week interval using shared utility
  console.log("\n📊 Week Interval Check:");
  const weekInfo = getCurrentWeekInfo(schedule);
  
  console.log(`   Current week of month: ${weekInfo.currentWeek}`);
  console.log(`   Should post this week: ${weekInfo.shouldPost ? "✅ Yes" : "❌ No"}`);
  
  if (weekInfo.shouldPost) {
    console.log(`   ✅ This week matches the ${intervalWeeks}-week interval`);
  } else {
    console.log(`   ⏰ Next posting week: ${weekInfo.weeksUntilNext} week(s) from now`);
  }

  // Show reminder schedule using shared utility
  console.log("\n⏰ Reminder Schedule:");
  const reminderSchedule = getReminderSchedule(schedule);
  console.log(`   Reminder time: ${reminderSchedule.hour.toString().padStart(2, "0")}:${reminderSchedule.minute.toString().padStart(2, "0")} UTC`);
  console.log(`   Reminder cron: ${reminderSchedule.cronExpression}`);
  console.log(`   (Posts 1 hour before leaderboard)`);

  console.log("\n" + "=".repeat(60));
  console.log("💡 Note: Times are calculated based on UTC timezone");
  console.log("   Adjust your local time accordingly");
}

function getDayName(dayOfWeek) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayOfWeek] || "Unknown";
}

// Run the check
try {
  checkLeaderboardSchedule();
} catch (error) {
  console.error("❌ Error checking leaderboard schedule:", error.message);
  process.exit(1);
}

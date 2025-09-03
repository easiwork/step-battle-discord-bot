# Scripts Directory

This directory contains utility scripts for the Step Battle Discord Bot.

## check-leaderboard-schedule.js

A utility script that reads the leaderboard schedule configuration from your `.env` file and displays the next 5 scheduled leaderboard posting times.

### Usage

```bash
# Using npm script (recommended)
npm run check-schedule

# Using bun directly
bun run scripts/check-leaderboard-schedule.js

# Make executable and run directly
chmod +x scripts/check-leaderboard-schedule.js
./scripts/check-leaderboard-schedule.js
```

### What it shows

- 🔧 **Current Configuration**: Displays all leaderboard schedule settings
- 📅 **Next 5 Posting Times**: Shows when the next 5 leaderboards will be posted
- 📊 **Week Interval Check**: Indicates if this week should have a leaderboard
- ⏰ **Reminder Schedule**: Shows when reminders are posted (1 hour before leaderboard)
- 💡 **Timezone Info**: All times are in UTC

### Environment Variables Required

The script reads these variables from your `.env` file:

```bash
LEADERBOARD_SCHEDULE_ENABLED=true
LEADERBOARD_DAY_OF_WEEK=0
LEADERBOARD_HOUR=23
LEADERBOARD_MINUTE=59
LEADERBOARD_INTERVAL_WEEKS=2
```

### Example Output

```
📅 Checking Leaderboard Schedule Configuration

🔧 Current Configuration:
   Enabled: ✅ Yes
   Day of Week: 0 (Sunday)
   Time: 23:59 UTC
   Interval: Every 2 week(s)

⏰ Cron Expression: 59 23 * * 0

📅 Next 5 Leaderboard Posting Times:
   (All times are in UTC)

   1. 2024-01-14 23:59:00 UTC (in 2d 5h 30m)
   2. 2024-01-28 23:59:00 UTC (in 16d 5h 30m)
   3. 2024-02-11 23:59:00 UTC (in 30d 5h 30m)
   4. 2024-02-25 23:59:00 UTC (in 44d 5h 30m)
   5. 2024-03-10 23:59:00 UTC (in 57d 5h 30m)

📊 Week Interval Check:
   Current week of month: 2
   Should post this week: ❌ No
   ⏰ Next posting week: 1 week(s) from now

⏰ Reminder Schedule:
   Reminder time: 22:59 UTC
   Reminder cron: 59 22 * * 0
   (Posts 1 hour before leaderboard)

============================================================
💡 Note: Times are calculated based on UTC timezone
   Adjust your local time accordingly
```

### Use Cases

- **Debugging**: Check if your schedule configuration is working correctly
- **Planning**: See when the next leaderboards will be posted
- **Verification**: Confirm that the bot will post at the expected times
- **Monitoring**: Check if the current week should have a leaderboard

### Troubleshooting

If you get an error about missing dependencies, make sure you have installed the project dependencies:

```bash
bun install
```

The script requires the `croner` package which should already be installed as a dependency of the main project. It will automatically read from a `.env` file if one exists, or use default values if no `.env` file is found.

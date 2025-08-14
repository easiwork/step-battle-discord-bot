# 🛠️ Technical Details

This document contains detailed technical information about the Step Battle Discord Bot implementation.

## 📋 Configuration

### Environment Variables

| Variable                       | Description                                          | Required |
| ------------------------------ | ---------------------------------------------------- | -------- |
| `DISCORD_TOKEN`                | Your Discord bot token                               | ✅       |
| `DISCORD_CLIENT_ID`            | Your Discord application client ID                   | ✅       |
| `WEBHOOK_SECRET`               | Secret key for webhook authentication                | ✅       |
| `WEBHOOK_PORT`                 | Port for webhook server (default: 8080)              | ❌       |
| `DATABASE_PATH`                | SQLite database file path                            | ❌       |
| `LEADERBOARD_SCHEDULE_ENABLED` | Enable automatic leaderboard posting (default: true) | ❌       |
| `LEADERBOARD_DAY_OF_WEEK`      | Day of week for posting (0=Sunday, default: 0)       | ❌       |
| `LEADERBOARD_HOUR`             | Hour for posting (0-23, default: 23)                 | ❌       |
| `LEADERBOARD_MINUTE`           | Minute for posting (0-59, default: 59)               | ❌       |
| `LEADERBOARD_INTERVAL_WEEKS`   | Post every X weeks (default: 2)                      | ❌       |

### Discord Bot Permissions

Your bot needs the following permissions:

- Send Messages
- Use Slash Commands
- Read Message History
- Embed Links
- View Channels

## 🔧 Channel Configuration

### Setup Process

1. **Server Administrator** goes to the desired channel and uses `/startstepping` to configure the bot
2. **Bot validates** permissions and saves the configuration
3. **Bot sends confirmation** to the configured channel
4. **All future commands** only work in the configured channel

### Benefits

- **Organized**: Keeps bot activity contained to specific channels
- **Flexible**: Each Discord server can have its own configured channel
- **Secure**: Only administrators can change the configuration
- **User-Friendly**: Clear error messages when used in wrong channels

### Error Messages

- **Wrong Channel**: "❌ Wrong channel! This command can only be used in #configured-channel"
- **No Setup**: "⚠️ No channel configured! A server administrator needs to set up a channel using `/startstepping`"

## 🎯 Leaderboard Features

### Simple Rankings

The leaderboard shows a clean ranking of participants:

- **🥇 1st Place**: "LEADER" - The current step champion
- **🥈 2nd Place**: Runner-up position
- **🥉 3rd Place**: Third place position

This creates a simple, competitive display that focuses on rankings rather than detailed progress tracking.

## ⏰ Leaderboard Scheduling

The bot uses [Croner](https://github.com/Hexagon/croner) for reliable scheduling of leaderboard posts. Croner provides robust cron expression parsing, timezone support, and built-in error handling.

### Configuration Options

You can customize the leaderboard posting schedule using these environment variables:

- `LEADERBOARD_SCHEDULE_ENABLED`: Set to "false" to disable automatic posting
- `LEADERBOARD_DAY_OF_WEEK`: Day of week (0=Sunday, 1=Monday, etc.)
- `LEADERBOARD_HOUR`: Hour in 24-hour format (0-23)
- `LEADERBOARD_MINUTE`: Minute (0-59)
- `LEADERBOARD_INTERVAL_WEEKS`: Post every X weeks (1=weekly, 2=bi-weekly, etc.)

### Cron Expression

The bot automatically generates a cron expression from your configuration:

- Format: `minute hour * * day-of-week`
- Example: `59 23 * * 0` (Sunday at 11:59 PM UTC)
- Timezone: UTC (fixed)

### Testing Examples

For testing purposes, you can set these values:

```bash
# Post every week (for testing)
LEADERBOARD_INTERVAL_WEEKS=1

# Post every hour on the hour
LEADERBOARD_HOUR=0
LEADERBOARD_MINUTE=0

# Disable automatic posting (use /testleaderboard only)
LEADERBOARD_SCHEDULE_ENABLED=false


```

## 🔗 Apple Device Integration

### Webhook Endpoint

The bot provides a webhook endpoint for automatic step submission:

```
POST http://your-server:8080/webhook
```

### Request Format

```json
{
  "user": "alice",
  "steps": 113400
}
```

### Authentication

Use the Authorization header:

- Authorization header: `Authorization: Bearer your-secret-key`

### Apple Shortcuts Setup

1. Create a new Shortcut in the Shortcuts app
2. Add "Get Health Sample" action for steps (last 14 days)
3. Add "Get Numbers from Input" to sum the steps
4. Add "Get Contents of URL" action:
   - URL: `http://your-server:8080/webhook`
   - Method: POST
   - Headers: `Authorization: Bearer your-secret-key`
   - Request Body: JSON
   - Content: `{"user": "alice", "steps": [sum of steps]}`

**Note**: The shortcut will work anytime, but only the latest submission before the Sunday 11:59 PM deadline will count for that week.

## 🗄️ Database Schema

### Users Table

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  steps INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Step Entries Table

```sql
CREATE TABLE step_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  steps INTEGER,
  entry_type TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

### Discord Links Table

```sql
CREATE TABLE discord_links (
  discord_id TEXT PRIMARY KEY,
  apple_device_name TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (apple_device_name) REFERENCES users (id)
);
```

### Server Configuration Table

```sql
CREATE TABLE server_config (
  guild_id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🏗️ Project Structure

```
src/
├── bot.ts              # Main Discord bot
├── commands/           # Slash commands
│   ├── leaderboard.ts # Leaderboard display
│   ├── link.ts        # Account linking
│   ├── startstepping.ts  # Channel configuration
│   └── testleaderboard.ts # Test leaderboard posting
├── database/          # Database operations
│   └── index.ts       # SQLite database wrapper
├── utils/             # Utility functions
│   └── channelValidation.ts # Channel access validation
├── webhook/           # Apple device integration
│   └── server.ts      # HTTP server for Apple device
└── types/             # TypeScript type definitions
    └── index.ts       # Shared types
```

For development setup, testing, and contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

# 🏃‍♂️ Step Battle Discord Bot

A Discord bot for tracking daily step competitions between friends! Participants compete to see who can accumulate more steps, with a daily leaderboard that shows progress without revealing exact totals.

## ✨ Features

- **Daily Leaderboard**: `/leaderboard` command showing progress with percentage-based gap tracking
- **Account Linking**: `/link` command to connect Discord accounts to Apple device names
- **Apple Device Integration**: Webhook endpoint for automatic step submission
- **Motivational Feedback**: Dynamic encouragement based on performance trends
- **Secure**: Webhook authentication with Bearer token
- **SQLite Database**: Persistent storage with step history

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) runtime
- Discord Bot Token
- Discord Application Client ID

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd step-battle-discord-bot
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Configure environment variables**

   ```bash
   cp env.example .env
   # Edit .env with your actual values
   ```

4. **Set up Discord Bot**

   - Create a Discord application at [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a bot and get your token
   - Add the bot to your server with appropriate permissions
   - Get your Client ID

5. **Configure webhook secret**

   - Set `WEBHOOK_SECRET` in `.env` for secure webhook authentication

6. **Run the bot**
   ```bash
   bun run dev
   ```

## 📋 Configuration

### Environment Variables

| Variable            | Description                              | Required |
| ------------------- | ---------------------------------------- | -------- |
| `DISCORD_TOKEN`     | Your Discord bot token                   | ✅       |
| `DISCORD_CLIENT_ID` | Your Discord application client ID       | ✅       |
| `WEBHOOK_SECRET`    | Secret key for webhook authentication    | ✅       |
| `WEBHOOK_PORT`      | Port for webhook server (default: 8080)  | ❌       |
| `DATABASE_PATH`     | SQLite database file path                | ❌       |

### Discord Bot Permissions

Your bot needs the following permissions:

- Send Messages
- Use Slash Commands
- Read Message History
- Embed Links

## 🎮 Commands

### `/leaderboard`

View the current step competition status with percentage-based progress tracking.

**Example Output:**

```
🥇 Alice 🏆 LEADER
🥈 Bob 🔥 +15% closer - You're gaining ground!
🥉 Charlie 📉 -8% gap - Don't fall behind!
```

### `/link <name>`

Link your Discord account to an existing Apple device name. This allows you to use Discord commands without specifying your name each time.

- `name`: The Apple device name to link to (must already exist in the database)

**Example:**

```
/link alice
```

**Note:** 
- You can only link to one Apple device name
- Apple device names can only be linked to one Discord account
- The Apple device name must already have steps logged (via webhook)

## 🎯 Leaderboard Features

### Percentage-Based Progress Tracking

The leaderboard shows how much each participant is gaining or losing ground relative to the leader:

- **🚀 +10%+ closer**: "Amazing progress!" - Significant gains
- **🔥 +5-9% closer**: "You're gaining ground!" - Good progress  
- **💪 +1-4% closer**: "Keep it up!" - Steady improvement
- **📉 -10%+ gap**: "Time to step it up!" - Need to catch up
- **⚠️ -5-9% gap**: "Don't fall behind!" - Gentle warning
- **🚶‍♂️ -1-4% gap**: "Stay focused!" - Minor setback
- **➡️ Same gap**: "Maintain the pace!" - Holding steady
- **📊 New participant**: "Welcome to the challenge!" - First time

This system encourages continued participation by showing progress trends without revealing exact step counts.

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
  date TEXT NOT NULL,
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

## 🛠️ Development

### Project Structure

```
src/
├── bot.ts              # Main Discord bot
├── commands/           # Slash commands
│   ├── leaderboard.ts # Leaderboard display
│   └── link.ts        # Account linking
├── database/          # Database operations
│   └── index.ts       # SQLite database wrapper
├── webhook/           # Apple device integration
│   └── server.ts      # HTTP server for Apple device
└── types/             # TypeScript type definitions
    └── index.ts       # Shared types
```

### Available Scripts

- `bun run src/index.ts` - Start the bot
- `bun test` - Run tests
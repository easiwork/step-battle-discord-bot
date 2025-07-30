# 🏃‍♂️ Step Battle Discord Bot

A Discord bot for tracking step battles between friends! Every 2 weeks, participants log their steps and compete to see who can accumulate more steps over the course of a year.

## ✨ Features

- **Manual Step Entry**: `/log` command to submit weekly averages
- **Leaderboard**: `/leaderboard` command that shows who's ahead without revealing totals
- **Apple Health Integration**: Webhook endpoint for automatic step submission
- **Secure**: User authorization and webhook authentication
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

5. **Configure authorized users**

   - Add Discord user IDs to `AUTHORIZED_USERS` in `.env`
   - Map Apple Health user names to Discord IDs

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
| `AUTHORIZED_USERS`  | Comma-separated Discord user IDs         | ✅       |
| `WEBHOOK_SECRET`    | Secret key for webhook authentication    | ✅       |
| `WEBHOOK_PORT`      | Port for webhook server (default: 3001)  | ❌       |
| `DATABASE_PATH`     | SQLite database file path                | ❌       |
| `ALICE_DISCORD_ID`  | Discord ID for Apple Health user "alice" | ❌       |
| `BOB_DISCORD_ID`    | Discord ID for Apple Health user "bob"   | ❌       |

### Discord Bot Permissions

Your bot needs the following permissions:

- Send Messages
- Use Slash Commands
- Read Message History
- Embed Links

## 🎮 Commands

### `/leaderboard`

View the current step battle status without revealing step totals.

**Example Output:**

```
🥇 Alice is currently ahead!
🥈 Bob, keep pushing!
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

## 🔗 Apple Device Integration

### Webhook Endpoint

The bot provides a webhook endpoint for automatic step submission:

```
POST http://your-server:3001/webhook
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
   - URL: `http://your-server:3001/webhook`
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
│   ├── log.ts         # Step logging command
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

- `bun run dev`
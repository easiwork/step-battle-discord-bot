# 🏃‍♂️ Step Battle Discord Bot

A Discord bot for tracking daily step competitions between friends! Participants compete to see who can accumulate more steps, with a daily leaderboard that shows progress without revealing exact totals.

## ✨ Features

- **Channel-Specific Access**: Bot only responds in configured channels per server
- **Bi-Weekly Leaderboard**: Automatic leaderboard posts every two weeks on Sunday at 11:59 PM, showing only server members
- **Account Linking**: `/link` command to connect Discord accounts to Apple device names
- **Channel Configuration**: `/setchannel` command for server administrators
- **Apple Device Integration**: Webhook endpoint for automatic step submission with weekly submission windows
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

7. **Configure the bot channel**
   - Go to the channel where you want the bot to be active
   - Use `/setchannel` in that channel to configure it as the bot's channel

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
- View Channels

## 🎮 Commands

### `/setchannel`

**Administrator Only** - Configure the current channel as the bot's active channel for commands and leaderboard posts.

**Example:**

```
/setchannel
```

**Features:**
- Only server administrators can use this command
- Automatically uses the channel where the command is executed
- Validates bot permissions in the current channel
- Sends a confirmation message to the configured channel
- The bot will only respond to commands in this channel after configuration

### `/leaderboard`

View the current step competition status with percentage-based progress tracking. Only shows participants who have linked their Discord accounts and are members of the current server. The bot also automatically posts leaderboards every two weeks on Sunday at 11:59 PM to all configured channels, with each server seeing only its own members.

**Example Output:**

```
🥇 Alice 🏆 LEADER
🥈 Bob
🥉 Charlie
```

**Channel Restrictions:**
- Only works in the configured channel (set by `/setchannel`)
- Shows setup message if no channel is configured
- Shows error if used in wrong channel

### `/link <name>`

Link your Discord account to an existing Apple device name. This allows you to use Discord commands without specifying your name each time.

- `name`: The Apple device name to link to (must already exist in the database)

**Example:**

```
/link alice
```

**Channel Restrictions:**
- Only works in the configured channel (set by `/setchannel`)
- Shows setup message if no channel is configured
- Shows error if used in wrong channel

**Note:** 
- You can only link to one Apple device name
- Apple device names can only be linked to one Discord account
- The Apple device name must already have steps logged (via webhook)

## 🔧 Channel Configuration

### Setup Process

1. **Server Administrator** goes to the desired channel and uses `/setchannel` to configure the bot
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
- **No Setup**: "⚠️ No channel configured! A server administrator needs to set up a channel using `/setchannel`"

## 🎯 Leaderboard Features

### Simple Rankings

The leaderboard shows a clean ranking of participants:

- **🥇 1st Place**: "LEADER" - The current step champion
- **🥈 2nd Place**: Runner-up position
- **🥉 3rd Place**: Third place position

This creates a simple, competitive display that focuses on rankings rather than detailed progress tracking.

## 🔗 Apple Device Integration

### Submission Windows

Step submissions are only allowed during specific time windows:
- **When**: Every odd-numbered Sunday (1st, 3rd, 5th, etc. Sunday of each month)
- **Time**: 10:00 PM to 11:55 PM
- **Frequency**: Once per window per user
- **Leaderboard**: Posted at 11:59 PM on the same Sunday

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

**Note**: The shortcut will only work during submission windows. Outside of these windows, you'll receive an error message with the next submission window time.

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

### Server Configuration Table

```sql
CREATE TABLE server_config (
  guild_id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Submission Windows Table

```sql
CREATE TABLE submission_windows (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  window_date TEXT NOT NULL,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id),
  UNIQUE(user_id, window_date)
);
```

## 🛠️ Development

### Project Structure

```
src/
├── bot.ts              # Main Discord bot
├── commands/           # Slash commands
│   ├── leaderboard.ts # Leaderboard display
│   ├── link.ts        # Account linking
│   └── setchannel.ts  # Channel configuration
├── database/          # Database operations
│   └── index.ts       # SQLite database wrapper
├── utils/             # Utility functions
│   ├── channelValidation.ts # Channel access validation
│   └── submissionWindow.ts  # Submission window validation
├── webhook/           # Apple device integration
│   └── server.ts      # HTTP server for Apple device
└── types/             # TypeScript type definitions
    └── index.ts       # Shared types
```

### Available Scripts

- `bun run src/index.ts` - Start the bot
- `bun test` - Run tests
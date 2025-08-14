# 🏃‍♂️ Step Battle Discord Bot - Project Summary

## What Was Built

A complete Discord bot for tracking step battles between friends, built with **Bun.js** and **Discord.js**. The bot allows two authorized users to compete by logging their steps every 2 weeks and provides a leaderboard without revealing step totals.

## 🎯 Key Features Implemented

### ✅ Core Functionality

- **Webhook Integration**: Automatic step submission via HTTP endpoint
- **Leaderboard**: `/leaderboard` command showing who's ahead (no totals revealed)
- **User Authorization**: Only pre-registered Discord users can submit steps
- **Step Calculation**: Automatic calculation: `((week1 + week2) / 2) × 14`

### ✅ Apple Health Integration

- **Webhook Server**: HTTP endpoint for automatic step submission
- **Authentication**: Secure API key validation
- **Payload Validation**: Input sanitization and limits
- **User Mapping**: Maps Apple Health usernames to Discord IDs
- **Deduplication**: Only latest submission before deadline counts

### ✅ Technical Features

- **SQLite Database**: Persistent storage with step history
- **TypeScript**: Full type safety throughout the codebase
- **Error Handling**: Comprehensive error handling and logging
- **Graceful Shutdown**: Proper cleanup on exit
- **Testing**: Unit tests for database functionality

## 🏗️ Architecture

```
src/
├── index.ts           # Main entry point & configuration
├── bot.ts            # Discord bot class & command handling
├── commands/         # Slash command implementations
│   ├── log.ts       # /log command
│   └── leaderboard.ts # /leaderboard command
├── database/         # Database layer
│   └── index.ts     # SQLite operations
├── types/           # TypeScript definitions
│   └── index.ts     # Shared interfaces
├── webhook/         # Apple Health integration
│   └── server.ts    # HTTP webhook server
└── database.test.ts # Unit tests
```

## 🚀 Getting Started

### 1. Prerequisites

- [Bun](https://bun.sh/) runtime installed
- Discord Bot Token and Client ID
- Two Discord user IDs for participants

### 2. Setup

```bash
# Clone and install
git clone <repository>
cd step-battle-discord-bot
bun install

# Configure environment
cp env.example .env
# Edit .env with your Discord credentials

# Run the bot
bun run dev
```

### 3. Discord Bot Setup

1. Create Discord application at [Discord Developer Portal](https://discord.com/developers/applications)
2. Create bot and get token
3. Add bot to server with permissions:
   - Send Messages
   - Use Slash Commands
   - Read Message History
   - Embed Links

## 📋 Commands

### `/leaderboard`

View current battle status without revealing totals.

**Output:**

```
🥇 Alice is currently ahead!
🥈 Bob, keep pushing!
```

## 🔗 Apple Health Integration

### Webhook Endpoint

```
POST http://your-server:3001/webhook?key=your-secret-key
```

### Request Format

```json
{
  "user": "alice",
  "steps": 113400
}
```

### Apple Shortcuts Setup

1. Create Shortcut in Shortcuts app
2. Add "Get Health Sample" for steps (last 14 days)
3. Sum the steps
4. Add "Get Contents of URL" action:
   - URL: `http://your-server:3001/webhook?key=your-secret-key`
   - Method: POST
   - Body: `{"user": "alice", "steps": [sum]}`

## 🗄️ Database Schema

### Users Table

- `id`: Discord user ID (primary key)
- `name`: Display name
- `steps`: Cumulative step total
- `created_at`, `updated_at`: Timestamps

### Step Entries Table

- `id`: Unique entry ID
- `user_id`: Foreign key to users
- `date`: Entry date
- `steps`: Direct step count (webhook)
- `entry_type`: 'webhook'
- `created_at`: Timestamp

## 🚀 Deployment

### Render

- Connect GitHub repository
- Set environment variables
- Build: `bun run build`
- Start: `bun run start`

### Railway

- Connect GitHub repository
- Set environment variables
- Auto-deploy on push

### Vercel

- Connect GitHub repository
- Set environment variables
- Deploy with serverless functions

## 🔒 Security Features

- **User Authorization**: Only authorized Discord users can submit
- **Webhook Authentication**: API key required for webhook access
- **Input Validation**: Step count limits (0-1,000,000)
- **Payload Validation**: JSON structure validation
- **HTTPS Only**: Production deployments use HTTPS

## 🧪 Testing

Run the test suite:

```bash
bun test
```

Tests cover:

- User creation and retrieval
- Webhook step entry processing
- Webhook step entry
- Leaderboard sorting

## 📊 Environment Variables

| Variable            | Description                | Required |
| ------------------- | -------------------------- | -------- |
| `DISCORD_TOKEN`     | Bot token                  | ✅       |
| `DISCORD_CLIENT_ID` | Application client ID      | ✅       |
| `AUTHORIZED_USERS`  | Comma-separated user IDs   | ✅       |
| `WEBHOOK_SECRET`    | Webhook authentication key | ✅       |
| `WEBHOOK_PORT`      | Webhook server port        | ❌       |
| `DATABASE_PATH`     | SQLite database path       | ❌       |
| `ALICE_DISCORD_ID`  | Discord ID for "alice"     | ❌       |
| `BOB_DISCORD_ID`    | Discord ID for "bob"       | ❌       |

## 🎉 What's Working

✅ **Complete Discord Bot**: Full slash command implementation  
✅ **Database Layer**: SQLite with proper schema and operations  
✅ **Webhook Server**: HTTP endpoint for Apple Health integration  
✅ **Type Safety**: Full TypeScript implementation  
✅ **Error Handling**: Comprehensive error management  
✅ **Testing**: Unit tests for core functionality  
✅ **Documentation**: Complete README and setup guides  
✅ **Deployment**: Configuration for popular platforms  
✅ **Security**: Authentication and validation throughout

## 🔮 Future Enhancements

- **Biweekly Reminders**: DM notifications for step submission
- **Leaderboard Changes**: Fun messages when positions change
- **Year-end Summary**: Statistics and graphs
- **One-time Tokens**: Enhanced webhook security
- **Multiple Battles**: Support for multiple step competitions
- **Mobile App**: Native mobile interface

## 🛠️ Tech Stack

- **Runtime**: Bun.js
- **Discord API**: discord.js v14
- **Database**: SQLite (via Bun's built-in SQLite)
- **Language**: TypeScript
- **Testing**: Bun's built-in test runner
- **Deployment**: Render, Railway, Vercel ready

---

**The Step Battle Discord Bot is ready for deployment and use! 🏃‍♂️💨**

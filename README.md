# 🏃‍♂️ Step Battle Discord Bot

A Discord bot for tracking step competitions between friends! Participants compete to see who can accumulate more steps, with automatic leaderboards and Apple Health integration.

## ✨ Features

- **Automatic Leaderboards**: Posts every 2 weeks on Sunday at 11:59 PM
- **Apple Health Integration**: API endpoint for automatic step submission
- **Account Linking**: Connect Discord accounts to Apple device names
- **Channel Management**: Configure which channels the bot uses
- **Deduplication**: Only the latest submission before deadline counts

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) runtime
- Discord Bot Token & Client ID

### Setup

1. **Clone and install**

   ```bash
   git clone <repository-url>
   cd step-battle-discord-bot
   bun install
   ```

2. **Configure environment**

   ```bash
   cp env.example .env
   # Edit .env with your Discord credentials
   ```

3. **Set up Discord Bot**

   - Create Discord application at [Discord Developer Portal](https://discord.com/developers/applications)
   - Create bot and get token
   - Add bot to server with permissions: Send Messages, Use Slash Commands, Read Message History, Embed Links, View Channels

4. **Run the bot**

   ```bash
   bun run dev
   ```

5. **Configure channel**
   - Go to desired channel and use `/startstepping`

## 🎮 Commands

| Command          | Description                  | Who            |
| ---------------- | ---------------------------- | -------------- |
| `/startstepping` | Start step battle in channel | Administrators |
| `/leaderboard`   | View current rankings        | Everyone       |
| `/link <name>`   | Link Discord to Apple device | Everyone       |
| `/submitsteps`   | Manually submit steps        | Everyone       |

## 🔗 Apple Health Setup

1. Create Apple Shortcut
2. Get Health Sample (steps, last 14 days)
3. Sum the steps
4. Send to API: `POST http://your-server:8080/api`
5. Headers: `Authorization: Bearer your-secret-key`
6. Body: `{"user": "your-name", "steps": [sum]}`

## 📚 Documentation

- **[Technical Details](TECHNICAL_DETAILS.md)** - Configuration and environment variables
- **[Project Summary](PROJECT_SUMMARY.md)** - Architecture and implementation details
- **[Railway Deployment](RAILWAY_DEPLOYMENT.md)** - Deployment guide
- **[Permission Troubleshooting](PERMISSION_TROUBLESHOOTING.md)** - Common issues
- **[Contributing](CONTRIBUTING.md)** - Development setup and guidelines

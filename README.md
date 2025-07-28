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

### `/log <week1> <week2>`

Log your steps for the past two weeks.

- `week1`: Average steps for the past week
- `week2`: Average steps for the week before that

**Example:**

```
/log 8200 7900
```

The bot calculates: `((8200 + 7900) / 2) × 14 = 113,400 steps`

### `/leaderboard`

View the current step battle status without revealing step totals.

**Example Output:**

```
🥇 Alice is currently ahead!
🥈 Bob, keep pushing!
```

## 🔗 Apple Health Integration

### Webhook Endpoint

The bot provides a webhook endpoint for automatic step submission:

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

### Authentication

Use either:

- Query parameter: `?key=your-secret-key`
- Authorization header: `Authorization: Bearer your-secret-key`

### Apple Shortcuts Setup

1. Create a new Shortcut in the Shortcuts app
2. Add "Get Health Sample" action for steps (last 14 days)
3. Add "Get Numbers from Input" to sum the steps
4. Add "Get Contents of URL" action:
   - URL: `http://your-server:3001/webhook?key=your-secret-key`
   - Method: POST
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
  week1 INTEGER,
  week2 INTEGER,
  steps INTEGER,
  entry_type TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## 🛠️ Development

### Project Structure

```
src/
├── bot.ts              # Main Discord bot class
├── commands/           # Slash command handlers
│   ├── log.ts         # /log command
│   └── leaderboard.ts # /leaderboard command
├── database/          # Database operations
│   └── index.ts       # SQLite database class
├── types/             # TypeScript type definitions
│   └── index.ts       # Shared types
├── webhook/           # Webhook server
│   └── server.ts      # HTTP server for Apple Health
└── index.ts           # Main entry point
```

### Available Scripts

- `bun run dev` - Start in development mode with hot reload
- `bun run start` - Start in production mode
- `bun run build` - Build for production
- `bun run test` - Run tests

## 🔒 Security

- Only authorized Discord users can submit steps
- Webhook endpoint requires authentication
- Input validation for all step entries
- Reasonable limits on step counts (0-1,000,000)

## 🚀 Deployment

### Render

1. Connect your GitHub repository
2. Set environment variables
3. Build command: `bun run build`
4. Start command: `bun run start`

### Railway

1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

### Vercel

1. Connect your GitHub repository
2. Set environment variables
3. Deploy with serverless functions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check the logs for error messages
2. Verify your environment variables
3. Ensure your Discord bot has proper permissions
4. Open an issue on GitHub

---

**Happy stepping! 🏃‍♂️💨**

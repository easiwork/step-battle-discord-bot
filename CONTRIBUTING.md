# 🤝 Contributing to Step Battle Discord Bot

Thank you for your interest in contributing to the Step Battle Discord Bot! This guide will help you get started with development.

## 🚀 Development Setup

### Prerequisites

- [Bun](https://bun.sh/) runtime (latest version)
- Discord Bot Token & Client ID
- Git

### Local Development Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd step-battle-discord-bot
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Configure environment**

   ```bash
   cp env.example .env
   # Edit .env with your Discord credentials
   ```

4. **Set up Discord Bot**
   - Create Discord application at [Discord Developer Portal](https://discord.com/developers/applications)
   - Create bot and get token
   - Add bot to server with permissions: Send Messages, Use Slash Commands, Read Message History, Embed Links, View Channels

## 🛠️ Development Scripts

| Script          | Description                                       |
| --------------- | ------------------------------------------------- |
| `bun run dev`   | Start the bot in development mode with hot reload |
| `bun run build` | Build the project for production                  |
| `bun run start` | Start the bot in production mode                  |
| `bun test`      | Run the test suite                                |

## 🧪 Testing

### Running Tests

```bash
# Run all tests
bun test

# Run tests with coverage (if available)
bun test --coverage
```

### Test Coverage

Tests cover:

- User creation and retrieval
- Webhook step entry processing
- Step entry deduplication
- Leaderboard sorting
- Database operations

### Test Configuration

Tests use an in-memory SQLite database and mock environment variables. See `src/test-setup.ts` for configuration details.

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
├── types/             # TypeScript type definitions
│   └── index.ts       # Shared types
├── test-setup.ts      # Test configuration
└── database.test.ts   # Database tests
```

## 🔧 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Follow the existing code style
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run tests
bun test

# Build the project
bun run build

# Test locally
bun run dev
```

### 4. Submit a Pull Request

- Provide a clear description of your changes
- Include any relevant issue numbers
- Ensure all tests pass

## 📝 Code Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Follow existing naming conventions
- Add proper type annotations
- Use interfaces for complex data structures

### Error Handling

- Use try-catch blocks for async operations
- Log errors with context
- Provide user-friendly error messages

### Database Operations

- Use parameterized queries to prevent SQL injection
- Handle database errors gracefully
- Use transactions for multi-step operations

## 🧪 Testing Guidelines

### Writing Tests

- Test both success and failure cases
- Mock external dependencies
- Use descriptive test names
- Group related tests together

### Example Test Structure

```typescript
describe("Feature", () => {
  test("should do something when condition is met", async () => {
    // Arrange
    const input = "test";

    // Act
    const result = await someFunction(input);

    // Assert
    expect(result).toBe("expected");
  });
});
```

## 🔍 Debugging

### Environment Variables

For testing and debugging, you can set these environment variables:

```bash
# Development database
DATABASE_PATH=./dev-database.db

# Test leaderboard scheduling
LEADERBOARD_INTERVAL_WEEKS=1

# Disable automatic posting for testing
LEADERBOARD_SCHEDULE_ENABLED=false
```

### Logging

The bot uses console logging for debugging. Key log messages include:

- Bot startup and configuration
- Command execution
- Webhook requests
- Database operations
- Scheduled task execution

## 🚀 Deployment Testing

### Local Testing

1. **Test commands locally**

   ```bash
   bun run dev
   # Use Discord commands in your test server
   ```

2. **Test webhook endpoint**

   ```bash
   curl -X POST http://localhost:8080/webhook \
     -H "Authorization: Bearer your-secret-key" \
     -H "Content-Type: application/json" \
     -d '{"user": "test", "steps": 1000}'
   ```

3. **Test leaderboard posting**
   ```bash
   # Use /testleaderboard command
   # Or trigger scheduled posting with test configuration
   ```

### Railway Deployment

See [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) for deployment instructions.

## 🐛 Common Issues

### Bot Not Responding

- Check bot permissions in Discord server
- Verify channel configuration with `/startstepping`
- Check bot token and client ID in environment

### Webhook Not Working

- Verify webhook secret in request headers
- Check webhook server is running on correct port
- Ensure user exists in database before linking

### Database Issues

- Check database file permissions
- Verify database path in environment
- Use in-memory database for testing: `DATABASE_PATH=:memory:`

## 📚 Additional Resources

- **[Technical Details](TECHNICAL_DETAILS.md)** - Configuration and database schema
- **[Project Summary](PROJECT_SUMMARY.md)** - Architecture overview
- **[Railway Deployment](RAILWAY_DEPLOYMENT.md)** - Deployment guide
- **[Permission Troubleshooting](PERMISSION_TROUBLESHOOTING.md)** - Common Discord issues

## 🤝 Getting Help

If you encounter issues or have questions:

1. Check the existing documentation
2. Look at existing issues and pull requests
3. Create a new issue with detailed information
4. Join our Discord server (if available)

Thank you for contributing! 🎉

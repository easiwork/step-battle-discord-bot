// Test setup file for Bun
// This file is loaded before tests run

// Mock environment variables for testing
process.env.DISCORD_TOKEN = "test-token";
process.env.DISCORD_CLIENT_ID = "test-client-id";
process.env.AUTHORIZED_USERS = "123456789,987654321";
process.env.API_SECRET = "test-secret";
process.env.DATABASE_PATH = ":memory:"; // Use in-memory database for tests

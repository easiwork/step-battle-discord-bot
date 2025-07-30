import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  TextChannel,
  EmbedBuilder,
} from "discord.js";
import { StepBattleDatabase } from "./database/index.js";
import * as leaderboardCommand from "./commands/leaderboard.js";
import * as linkCommand from "./commands/link.js";

export class StepBattleBot {
  private client: Client;
  private db: StepBattleDatabase;
  private commands: Collection<string, any>;
  private channelId: string | null = null;
  private scheduler: NodeJS.Timeout | null = null;

  constructor(
    token: string,
    db: StepBattleDatabase
  ) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.db = db;
    this.commands = new Collection();

    this.setupCommands();
    this.setupEventHandlers();
  }

  private setupCommands(): void {
    // Register commands (removed log command)
    this.commands.set(leaderboardCommand.data.name, leaderboardCommand);
    this.commands.set(linkCommand.data.name, linkCommand);
  }

  private setupEventHandlers(): void {
    this.client.on(Events.ClientReady, () => {
      console.log(`🤖 Bot logged in as ${this.client.user?.tag}`);
      this.startScheduler();
    });

    this.client.on(Events.InteractionCreate, async (interaction) => {
      // Handle autocomplete interactions
      if (interaction.isAutocomplete()) {
        const command = this.commands.get(interaction.commandName);
        if (command && command.autocomplete) {
          try {
            await command.autocomplete(interaction, this.db);
          } catch (error) {
            console.error(`Error in autocomplete for ${interaction.commandName}:`, error);
          }
        }
        return;
      }

      // Handle chat input commands
      if (!interaction.isChatInputCommand()) return;

      const command = this.commands.get(interaction.commandName);
      if (!command) {
        console.error(
          `No command matching ${interaction.commandName} was found.`
        );
        return;
      }

      try {
        // All commands now use the same signature without authorizedUsers
        await command.execute(interaction, this.db);

        // Store channel ID for scheduled posts
        if (!this.channelId) {
          this.channelId = interaction.channelId;
        }
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);

        const errorMessage = "There was an error while executing this command!";
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: errorMessage,
            ephemeral: true,
          });
        } else {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        }
      }
    });
  }

  private startScheduler(): void {
    // Check every minute for scheduled tasks
    this.scheduler = setInterval(() => {
      this.checkScheduledTasks();
    }, 60000); // 1 minute

    console.log("⏰ Scheduler started - checking for scheduled tasks every minute");
  }

  private checkScheduledTasks(): void {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    // Daily at 12 AM (00:00) - Post leaderboard
    if (hour === 0 && minute === 0) {
      this.postLeaderboard();
    }
  }

  private async postLeaderboard(): Promise<void> {
    if (!this.channelId) {
      console.log("⚠️ No channel ID stored, skipping leaderboard post");
      return;
    }

    try {
      const channel = await this.client.channels.fetch(this.channelId) as TextChannel;
      if (!channel) {
        console.log("⚠️ Could not find channel for leaderboard post");
        return;
      }

      const users = await this.db.getAllUsers();

      if (users.length === 0) {
        const embed = new EmbedBuilder()
          .setColor("#ffd700")
          .setTitle("🏃‍♂️ Daily Step Battle Results")
          .setDescription("📊 No participants have logged steps today.")
          .setTimestamp()
          .setFooter({ text: "Step Battle Bot - Daily Results" });

        await channel.send({ embeds: [embed] });
        return;
      }

      // Sort users by steps (highest first)
      const sortedUsers = users.sort((a, b) => b.steps - a.steps);
      const leaderSteps = sortedUsers[0].steps;

      // Create leaderboard display with Discord names when available
      const leaderboardEntries = await Promise.all(
        sortedUsers.map(async (user, index) => {
          const position = index + 1;
          const isLeader = position === 1;
          const stepsBehind = leaderSteps - user.steps;

          let emoji = "🥉";
          if (position === 1) emoji = "🥇";
          else if (position === 2) emoji = "🥈";

          // Try to get Discord username for this Apple device name
          const discordId = await this.db.getDiscordUsernameForAppleHealthName(user.name);
          let displayName = user.name; // Default to Apple device name

          if (discordId) {
            try {
              // Try to fetch the Discord user
              const discordUser = await this.client.users.fetch(discordId);
              displayName = discordUser.username;
            } catch (error) {
              // If we can't fetch the Discord user, fall back to Apple device name
              console.log(`Could not fetch Discord user ${discordId} for ${user.name}`);
            }
          }

          // Create the entry text
          let entryText = `${emoji} **${displayName}**`;
          
          if (isLeader) {
            entryText += " 🏆 **LEADER**";
          } else {
            // Get the percentage change in gap
            const gapChange = await this.db.getGapChangePercentage(user.id);
            
            if (gapChange !== null) {
              if (gapChange > 0) {
                // Catching up to the leader
                if (gapChange >= 10) {
                  entryText += ` 🚀 **+${gapChange}% closer** - Amazing progress!`;
                } else if (gapChange >= 5) {
                  entryText += ` 🔥 **+${gapChange}% closer** - You're gaining ground!`;
                } else {
                  entryText += ` 💪 **+${gapChange}% closer** - Keep it up!`;
                }
              } else if (gapChange < 0) {
                // Falling behind
                const absChange = Math.abs(gapChange);
                if (absChange >= 10) {
                  entryText += ` 📉 **${gapChange}% gap** - Time to step it up!`;
                } else if (absChange >= 5) {
                  entryText += ` ⚠️ **${gapChange}% gap** - Don't fall behind!`;
                } else {
                  entryText += ` 🚶‍♂️ **${gapChange}% gap** - Stay focused!`;
                }
              } else {
                // No change
                entryText += ` ➡️ **Same gap** - Maintain the pace!`;
              }
            } else {
              // Not enough data yet
              entryText += ` 📊 **New participant** - Welcome to the challenge!`;
            }
          }

          return entryText;
        })
      );

      // Get display name for the leader
      const leaderDiscordId = await this.db.getDiscordUsernameForAppleHealthName(sortedUsers[0].name);
      let leaderDisplayName = sortedUsers[0].name;
      
      if (leaderDiscordId) {
        try {
          const discordUser = await this.client.users.fetch(leaderDiscordId);
          leaderDisplayName = discordUser.username;
        } catch (error) {
          console.log(`Could not fetch Discord user ${leaderDiscordId} for ${sortedUsers[0].name}`);
        }
      }

      const embed = new EmbedBuilder()
        .setColor("#ffd700")
        .setTitle("🏃‍♂️ Biggest Steppers")
        .setDescription(leaderboardEntries.join("\n"))
        .setTimestamp();

      await channel.send({ embeds: [embed] });
      console.log("✅ Posted daily leaderboard");
    } catch (error) {
      console.error("❌ Error posting leaderboard:", error);
    }
  }

  async registerCommands(clientId: string, token: string): Promise<void> {
    const rest = new REST().setToken(token);
    const commands = Array.from(this.commands.values()).map((cmd) =>
      cmd.data.toJSON()
    );

    try {
      console.log("Started refreshing application (/) commands.");

      await rest.put(Routes.applicationCommands(clientId), { body: commands });

      console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
      console.error("Error registering commands:", error);
    }
  }

  async start(token: string): Promise<void> {
    await this.client.login(token);
  }

  async stop(): Promise<void> {
    if (this.scheduler) {
      clearInterval(this.scheduler);
      this.scheduler = null;
    }
    await this.client.destroy();
  }
}

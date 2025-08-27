import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  TextChannel,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { StepBattleDatabase } from "./database/index.js";
import * as leaderboardCommand from "./commands/leaderboard.js";
import * as linkCommand from "./commands/link.js";
import * as startsteppingCommand from "./commands/startstepping.js";
import * as submitstepsCommand from "./commands/submitsteps.js";
import { Cron } from "croner";

export class StepBattleBot {
  private client: Client;
  private db: StepBattleDatabase;
  private commands: Collection<string, any>;
  private scheduler: Cron | null = null;
  private leaderboardSchedule: {
    enabled: boolean;
    dayOfWeek: number;
    hour: number;
    minute: number;
    intervalWeeks: number;
  };
  private static instance: StepBattleBot | null = null;

  constructor(
    token: string,
    db: StepBattleDatabase,
    leaderboardSchedule: {
      enabled: boolean;
      dayOfWeek: number;
      hour: number;
      minute: number;
      intervalWeeks: number;
    }
  ) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.db = db;
    this.leaderboardSchedule = leaderboardSchedule;
    this.commands = new Collection();
    StepBattleBot.instance = this;

    this.setupCommands();
    this.setupEventHandlers();
  }

  // Register commands
  private setupCommands(): void {
    const isDevelopment = process.env.NODE_ENV !== "production";

    // Always register these commands
    this.commands.set(startsteppingCommand.data.name, startsteppingCommand);
    this.commands.set(submitstepsCommand.data.name, submitstepsCommand);

    // Only register development commands in development mode
    if (isDevelopment) {
      this.commands.set(leaderboardCommand.data.name, leaderboardCommand);
      this.commands.set(linkCommand.data.name, linkCommand);
      console.log("🔧 Development mode: All commands registered");
    } else {
      console.log(
        "🚀 Production mode: Only startstepping and submitsteps commands registered"
      );
    }
  }

  // Static method to get the bot instance
  public static getInstance(): StepBattleBot | null {
    return StepBattleBot.instance;
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
            console.error(
              `Error in autocomplete for ${interaction.commandName}:`,
              error
            );
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
        await command.execute(interaction, this.db);
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);

        const errorMessage = "There was an error while executing this command!";
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: errorMessage,
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await interaction.reply({
            content: errorMessage,
            flags: MessageFlags.Ephemeral,
          });
        }
      }
    });
  }

  private startScheduler(): void {
    if (!this.leaderboardSchedule.enabled) {
      console.log("⏰ Leaderboard scheduler is disabled");
      return;
    }

    // Create cron expression for the schedule
    // Format: minute hour day-of-month month day-of-week
    // For bi-weekly posting, we'll use a custom function to check the week interval
    const cronExpression = `${this.leaderboardSchedule.minute} ${this.leaderboardSchedule.hour} * * ${this.leaderboardSchedule.dayOfWeek}`;

    console.log(`⏰ Creating Croner schedule: ${cronExpression} (UTC)`);
    console.log(
      `📅 Leaderboard will post every ${
        this.leaderboardSchedule.intervalWeeks
      } week(s) on day ${this.leaderboardSchedule.dayOfWeek} at ${
        this.leaderboardSchedule.hour
      }:${this.leaderboardSchedule.minute.toString().padStart(2, "0")} UTC`
    );

    // Create the cron job
    this.scheduler = new Cron(
      cronExpression,
      {
        timezone: "UTC",
        name: "leaderboard-scheduler",
      },
      () => {
        this.handleScheduledLeaderboard();
      }
    );

    // Log next run time
    const nextRun = this.scheduler.nextRun();
    if (nextRun) {
      console.log(
        `⏰ Next scheduled leaderboard post: ${nextRun.toISOString()} UTC`
      );
    }
  }

  private handleScheduledLeaderboard(): void {
    // Check if it's the right interval (every X weeks)
    const now = new Date();
    const weekOfMonth = Math.ceil(now.getDate() / 7);
    const shouldPost =
      (weekOfMonth - 1) % this.leaderboardSchedule.intervalWeeks === 0;

    console.log(
      `📅 Scheduled leaderboard trigger - Week ${weekOfMonth}, should post: ${shouldPost} (interval: ${this.leaderboardSchedule.intervalWeeks} weeks)`
    );

    if (shouldPost) {
      console.log(
        `📅 Scheduled leaderboard posting triggered at ${now.toISOString()} UTC - Week ${weekOfMonth}, posting every ${
          this.leaderboardSchedule.intervalWeeks
        } week(s)`
      );
      this.postLeaderboard();
    } else {
      console.log(
        `⏰ Time matched but not the right week. Week ${weekOfMonth}, posting every ${this.leaderboardSchedule.intervalWeeks} weeks`
      );
    }
  }

  public async postLeaderboard(): Promise<void> {
    console.log("🚀 Starting scheduled leaderboard posting process...");
    try {
      // Get all server configurations
      const serverConfigs = await this.db.getAllServerConfigs();

      if (serverConfigs.length === 0) {
        console.log(
          "⚠️ No servers configured, skipping bi-weekly leaderboard post"
        );
        return;
      }

      const users = await this.db.getAllUsers();

      if (users.length === 0) {
        // Post "no participants" message to all configured channels
        for (const config of serverConfigs) {
          try {
            const channel = (await this.client.channels.fetch(
              config.channelId
            )) as TextChannel;
            if (channel) {
              const embed = new EmbedBuilder()
                .setColor("#ffd700")
                .setTitle("🏃‍♂️ Biggest Steppers")
                .setDescription("📊 No participants have logged steps yet.")
                .setTimestamp();

              await channel.send({ embeds: [embed] });
              console.log(
                `✅ Posted "no participants" message to guild ${config.guildId}`
              );
            }
          } catch (error) {
            console.error(
              `❌ Error posting to channel ${config.channelId}:`,
              error
            );
          }
        }
        return;
      }

      // Post to all configured channels with guild-specific filtering
      console.log(
        `📊 Posting bi-weekly leaderboard to ${serverConfigs.length} configured channels...`
      );

      for (const config of serverConfigs) {
        try {
          const channel = (await this.client.channels.fetch(
            config.channelId
          )) as TextChannel;
          if (!channel) {
            console.error(
              `❌ Could not fetch channel ${config.channelId} for guild ${config.guildId}`
            );
            continue;
          }

          const guild = channel.guild;
          if (!guild) {
            console.error(
              `❌ Could not get guild for channel ${config.channelId}`
            );
            continue;
          }

          // Get bi-weekly totals for this guild and filter to linked users
          const guildUsers = await this.db.getAllUsersWithBiWeeklyTotals(
            config.guildId
          );
          const filteredUsers = [];

          for (const user of guildUsers) {
            // Check if user has a Discord link
            const discordId =
              await this.db.getDiscordUsernameForAppleHealthName(user.name);
            if (!discordId) {
              continue; // Skip users without Discord links
            }

            // Check if the Discord user is a member of this guild
            try {
              const guildMember = await guild.members.fetch(discordId);
              if (guildMember) {
                // User is linked and in this guild, add them to filtered list
                filteredUsers.push({
                  ...user,
                  discordId: discordId,
                  discordUsername: guildMember.user.username,
                });
              }
            } catch (error) {
              // User is not in this guild, skip them
              console.log(
                `User ${discordId} (${user.name}) is not a member of guild ${guild.id}`
              );
              continue;
            }
          }

          if (filteredUsers.length === 0) {
            // No linked participants in this guild
            const embed = new EmbedBuilder()
              .setColor("#ffd700")
              .setTitle("🏃‍♂️ Biggest Steppers")
              .setDescription(
                "📊 No linked participants in this server have logged steps yet.\n\nUse `/link` to connect your Discord account to your Apple device name."
              )
              .setTimestamp();

            await channel.send({ embeds: [embed] });
            console.log(
              `✅ Posted "no linked participants" message to guild ${config.guildId}`
            );
            continue;
          }

          const leaderSteps = filteredUsers[0]?.steps || 0;

          // Create leaderboard display for this guild
          const leaderboardEntries = await Promise.all(
            filteredUsers.map(async (user, index) => {
              const position = index + 1;
              const isLeader = position === 1;

              let emoji = "🥉";
              if (position === 1) emoji = "🥇";
              else if (position === 2) emoji = "🥈";

              // Use the Discord username we already fetched
              const displayName = user.discordUsername;

              // Create the entry text
              let entryText = `${emoji} **${displayName}**`;

              if (isLeader) {
                entryText += " 🏆 **LEADER**";
              }

              return entryText;
            })
          );

          const embed = new EmbedBuilder()
            .setColor("#ffd700")
            .setTitle("🏃‍♂️ Biggest Steppers")
            .setDescription(leaderboardEntries.join("\n"))
            .setTimestamp();

          await channel.send({ embeds: [embed] });
          console.log(
            `✅ Posted bi-weekly leaderboard to guild ${config.guildId} (${channel.name}) - ${filteredUsers.length} participants`
          );
        } catch (error) {
          console.error(
            `❌ Error posting to channel ${config.channelId} (guild ${config.guildId}):`,
            error
          );
        }
      }

      console.log(
        `🎉 Bi-weekly leaderboard posted to ${serverConfigs.length} channels successfully!`
      );
    } catch (error) {
      console.error("❌ Error posting bi-weekly leaderboard:", error);
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
      this.scheduler.stop();
      this.scheduler = null;
    }
    await this.client.destroy();
  }
}

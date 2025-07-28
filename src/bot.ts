import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
} from "discord.js";
import { StepBattleDatabase } from "./database/index.js";
import * as logCommand from "./commands/log.js";
import * as leaderboardCommand from "./commands/leaderboard.js";

export class StepBattleBot {
  private client: Client;
  private db: StepBattleDatabase;
  private authorizedUsers: string[];
  private commands: Collection<string, any>;

  constructor(
    token: string,
    db: StepBattleDatabase,
    authorizedUsers: string[]
  ) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.db = db;
    this.authorizedUsers = authorizedUsers;
    this.commands = new Collection();

    this.setupCommands();
    this.setupEventHandlers();
  }

  private setupCommands(): void {
    // Register commands
    this.commands.set(logCommand.data.name, logCommand);
    this.commands.set(leaderboardCommand.data.name, leaderboardCommand);
  }

  private setupEventHandlers(): void {
    this.client.on(Events.ClientReady, () => {
      console.log(`🤖 Bot logged in as ${this.client.user?.tag}`);
    });

    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const command = this.commands.get(interaction.commandName);
      if (!command) {
        console.error(
          `No command matching ${interaction.commandName} was found.`
        );
        return;
      }

      try {
        if (interaction.commandName === "log") {
          await command.execute(interaction, this.db, this.authorizedUsers);
        } else {
          await command.execute(interaction, this.db);
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
    await this.client.destroy();
  }
}

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
} from "discord.js";
import { StepBattleDatabase } from "../database/index.js";
import {
  validateChannel,
  getChannelErrorMessage,
  getSetupMessage,
} from "../utils/channelValidation.js";
import { generateLeaderboard } from "../utils/leaderboardUtils.js";

export const data = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("Show the current step battle leaderboard");

export async function execute(
  interaction: ChatInputCommandInteraction,
  db: StepBattleDatabase
): Promise<void> {
  try {
    // Validate channel access
    const channelValidation = await validateChannel(interaction, db);
    if (!channelValidation.isValid) {
      await interaction.reply({
        content: getChannelErrorMessage(channelValidation.configuredChannelId!),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Show setup message if no channel is configured
    if (channelValidation.needsSetup) {
      await interaction.reply({
        content: getSetupMessage(),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        content: "❌ This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const leaderboardResult = await generateLeaderboard(
      guild,
      db,
      interaction.guildId!
    );

    if (leaderboardResult.participantCount === 0) {
      await interaction.reply({
        content: leaderboardResult.embed.data.description || "📊 No participants have logged steps yet.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({ embeds: [leaderboardResult.embed] });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    await interaction.reply({
      content:
        "❌ An error occurred while fetching the leaderboard. Please try again.",
      flags: MessageFlags.Ephemeral,
    });
  }
}

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { StepBattleDatabase } from "../database/index.js";
import { validateChannel, getChannelErrorMessage, getSetupMessage } from "../utils/channelValidation.js";

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

    const users = await db.getAllUsers();

    if (users.length === 0) {
      await interaction.reply({
        content: "📊 No participants have logged steps yet.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Filter users to only include those who are linked and in this guild
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        content: "❌ This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const filteredUsers = [];
    
    for (const user of users) {
      // Check if user has a Discord link
      const discordId = await db.getDiscordUsernameForAppleHealthName(user.name);
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
            discordUsername: guildMember.user.username
          });
        }
      } catch (error) {
        // User is not in this guild, skip them
        console.log(`User ${discordId} (${user.name}) is not a member of guild ${guild.id}`);
        continue;
      }
    }

    if (filteredUsers.length === 0) {
      await interaction.reply({
        content: "📊 No linked participants in this server have logged steps yet.\n\nUse `/link` to connect your Discord account to your Apple device name.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Sort filtered users by steps (highest first)
    const sortedUsers = filteredUsers.sort((a, b) => b.steps - a.steps);
    const leaderSteps = sortedUsers[0].steps;

    // Create leaderboard display
    const leaderboardEntries = await Promise.all(
      sortedUsers.map(async (user, index) => {
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
      .setTimestamp()
      .setFooter({ text: `Showing ${filteredUsers.length} linked participants in this server` });

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    await interaction.reply({
      content:
        "❌ An error occurred while fetching the leaderboard. Please try again.",
      flags: MessageFlags.Ephemeral,
    });
  }
}

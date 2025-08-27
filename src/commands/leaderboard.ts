import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { StepBattleDatabase } from "../database/index.js";
import {
  validateChannel,
  getChannelErrorMessage,
  getSetupMessage,
} from "../utils/channelValidation.js";

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

    const users = await db.getAllUsersWithBiWeeklyTotals(interaction.guildId!);

    if (users.length === 0) {
      await interaction.reply({
        content: "📊 No participants have logged steps yet.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Filter users to include both linked users and manual Discord users
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
      let discordUsername = null;
      let isGuildMember = false;

      // Check if this is a manual Discord user (starts with "discord_")
      if (user.id.startsWith("discord_")) {
        const discordId = user.id.replace("discord_", "");
        try {
          const guildMember = await guild.members.fetch(discordId);
          if (guildMember) {
            discordUsername = guildMember.user.username;
            isGuildMember = true;
          }
        } catch (error) {
          // User is not in this guild, skip them
          console.log(
            `Discord user ${discordId} is not a member of guild ${guild.id}`
          );
          continue;
        }
      } else {
        // Check if user has a Discord link (Apple Health user)
        const discordId = await db.getDiscordUsernameForAppleHealthName(
          user.name
        );
        if (discordId) {
          try {
            const guildMember = await guild.members.fetch(discordId);
            if (guildMember) {
              discordUsername = guildMember.user.username;
              isGuildMember = true;
            }
          } catch (error) {
            // User is not in this guild, skip them
            console.log(
              `Linked user ${discordId} (${user.name}) is not a member of guild ${guild.id}`
            );
            continue;
          }
        }
      }

      if (isGuildMember && discordUsername) {
        filteredUsers.push({
          ...user,
          discordUsername: discordUsername,
        });
      }
    }

    if (filteredUsers.length === 0) {
      await interaction.reply({
        content:
          "📊 No participants in this server have logged steps yet.\n\nUse `/link` to connect your Apple Health account or `/submitsteps` to manually submit steps.",
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
      .setTimestamp();

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

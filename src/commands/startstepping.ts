import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
} from "discord.js";
import { StepBattleDatabase } from "../database/index.js";

export const data = new SlashCommandBuilder()
  .setName("startstepping")
  .setDescription(
    "Start the step battle in this channel and see when the next leaderboard will be posted"
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(
  interaction: ChatInputCommandInteraction,
  db: StepBattleDatabase
): Promise<void> {
  try {
    // Check if user has administrator permissions
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
    ) {
      await interaction.reply({
        content: "❌ You need Administrator permissions to use this command.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Use the current channel
    const channel = interaction.channel;

    if (!channel || channel.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: "❌ This command can only be used in a text channel.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Check if the bot has permissions in the current channel
    const botMember = interaction.guild?.members.cache.get(
      interaction.client.user!.id
    );
    if (!botMember) {
      await interaction.reply({
        content: "❌ Unable to verify bot permissions.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const channelPermissions = channel.permissionsFor(botMember);
    if (!channelPermissions) {
      await interaction.reply({
        content: `❌ Unable to check permissions for <#${channel.id}>. Please ensure the bot has access to this channel.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Check each permission individually and provide specific feedback
    const requiredPermissions = [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.EmbedLinks,
    ];

    const missingPermissions = requiredPermissions.filter(
      (permission) => !channelPermissions.has(permission)
    );

    if (missingPermissions.length > 0) {
      const permissionNames = missingPermissions.map((permission) => {
        switch (permission) {
          case PermissionFlagsBits.ViewChannel:
            return "View Channel";
          case PermissionFlagsBits.SendMessages:
            return "Send Messages";
          case PermissionFlagsBits.EmbedLinks:
            return "Embed Links";
          default:
            return "Unknown Permission";
        }
      });

      const missingPermissionsList = permissionNames.join(", ");

      await interaction.reply({
        content: `❌ **Missing Permissions in <#${channel.id}>**\n\nThe bot needs the following permissions:\n• ${missingPermissionsList}\n\n**To fix this:**\n1. Go to Server Settings → Roles\n2. Find the bot's role\n3. Go to the channel settings for <#${channel.id}>\n4. Ensure the bot's role has these permissions enabled\n\n**Or:**\n• Give the bot's role these permissions at the server level (they will apply to all channels)`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Calculate the next leaderboard time as the start date
    const startDate = getNextLeaderboardTime().toISOString();

    // Save the channel configuration with start date
    await db.setServerChannel(interaction.guildId!, channel.id, startDate);

    await interaction.reply({
      content: `enabled in <#${channel.id}>`,
      flags: MessageFlags.Ephemeral,
    });

    // Send a confirmation message to the configured channel
    try {
      await channel.send({
        content: `big steppers has entered the chat\n\nfirst leaderboard drops at <t:${
          getNextLeaderboardTime().getTime() / 1000
        }:F>.`,
      });
    } catch (sendError) {
      console.error("Error sending confirmation message:", sendError);
      await interaction.followUp({
        content: `⚠️ Channel configured successfully, but I couldn't send a confirmation message to <#${channel.id}>. This might indicate a permission issue.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  } catch (error) {
    console.error("Error starting step battle:", error);
    await interaction.reply({
      content:
        "❌ An error occurred while starting the step battle. Please try again.",
      flags: MessageFlags.Ephemeral,
    });
  }
}

// Assuming default schedule: Sunday at 11:59 PM UTC, every 2 weeks
function getNextLeaderboardTime(): Date {
  // Create a date for the next occurrence of this day/time
  const now = new Date();
  const targetDay = 0; // Sunday
  const targetHour = 23; // 11 PM
  const targetMinute = 59;

  // Find the next occurrence of this day/time
  let nextDate = new Date(now);
  nextDate.setHours(targetHour, targetMinute, 0, 0);

  // If we've passed this time today, move to next week
  if (nextDate <= now) {
    nextDate.setDate(nextDate.getDate() + 7);
  }

  // Adjust to the correct day of week (Sunday = 0)
  const currentDay = nextDate.getDay();
  const daysToAdd = (targetDay - currentDay + 7) % 7;
  nextDate.setDate(nextDate.getDate() + daysToAdd);

  return nextDate;
}

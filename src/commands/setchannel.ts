import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import { StepBattleDatabase } from "../database/index.js";

export const data = new SlashCommandBuilder()
  .setName("setchannel")
  .setDescription("Set the current channel as the bot's active channel for commands and leaderboards")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(
  interaction: ChatInputCommandInteraction,
  db: StepBattleDatabase
): Promise<void> {
  try {
    // Check if user has administrator permissions
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: "❌ You need Administrator permissions to use this command.",
        ephemeral: true,
      });
      return;
    }

    // Use the current channel
    const channel = interaction.channel;
    
    if (!channel || channel.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: "❌ This command can only be used in a text channel.",
        ephemeral: true,
      });
      return;
    }

    // Check if the bot has permissions in the current channel
    const botMember = interaction.guild?.members.cache.get(interaction.client.user!.id);
    if (!botMember) {
      await interaction.reply({
        content: "❌ Unable to verify bot permissions.",
        ephemeral: true,
      });
      return;
    }

    const channelPermissions = channel.permissionsFor(botMember);
    if (!channelPermissions) {
      await interaction.reply({
        content: `❌ Unable to check permissions for <#${channel.id}>. Please ensure the bot has access to this channel.`,
        ephemeral: true,
      });
      return;
    }

    // Check each permission individually and provide specific feedback
    const requiredPermissions = [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.EmbedLinks
    ];

    const missingPermissions = requiredPermissions.filter(permission => 
      !channelPermissions.has(permission)
    );

    if (missingPermissions.length > 0) {
      const permissionNames = missingPermissions.map(permission => {
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
        ephemeral: true,
      });
      return;
    }

    // Save the channel configuration
    await db.setServerChannel(interaction.guildId!, channel.id);

    await interaction.reply({
      content: `✅ Successfully set <#${channel.id}> as the bot's channel!\n\nFrom now on, I will only respond to commands and post leaderboards in this channel.`,
      ephemeral: true,
    });

    // Send a confirmation message to the configured channel
    try {
      await channel.send({
        content: `🎉 **Step Battle Bot is now active in this channel!**\n\nI'll respond to commands and post daily leaderboards here. Use \`/leaderboard\` to see the current standings!`,
      });
    } catch (sendError) {
      console.error("Error sending confirmation message:", sendError);
      await interaction.followUp({
        content: `⚠️ Channel configured successfully, but I couldn't send a confirmation message to <#${channel.id}>. This might indicate a permission issue.`,
        ephemeral: true,
      });
    }

  } catch (error) {
    console.error("Error setting channel:", error);
    await interaction.reply({
      content: "❌ An error occurred while setting the channel. Please try again.",
      ephemeral: true,
    });
  }
}

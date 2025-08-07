import { ChatInputCommandInteraction } from "discord.js";
import { StepBattleDatabase } from "../database/index.js";

export async function validateChannel(
  interaction: ChatInputCommandInteraction,
  db: StepBattleDatabase
): Promise<{ isValid: boolean; configuredChannelId?: string; needsSetup?: boolean }> {
  // If no guild, allow the command (DM commands)
  if (!interaction.guildId) {
    return { isValid: true };
  }

  // Get the configured channel for this guild
  const configuredChannelId = await db.getServerChannel(interaction.guildId);

  // If no channel is configured, allow the command but suggest setting one
  if (!configuredChannelId) {
    return { isValid: true, needsSetup: true };
  }

  // Check if the command is being used in the configured channel
  if (interaction.channelId === configuredChannelId) {
    return { isValid: true, configuredChannelId };
  }

  // Command is being used in the wrong channel
  return { isValid: false, configuredChannelId };
}

export function getChannelErrorMessage(configuredChannelId: string): string {
  return `❌ **Wrong channel!** This command can only be used in <#${configuredChannelId}>.\n\nPlease use the bot commands in the designated channel.`;
}

export function getSetupMessage(): string {
  return `⚠️ **No channel configured!** A server administrator needs to set up a channel for the bot using \`/setchannel\`.\n\nOnce configured, I'll only respond to commands in that specific channel.`;
}

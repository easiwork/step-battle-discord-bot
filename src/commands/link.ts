import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  AutocompleteInteraction,
} from "discord.js";
import { StepBattleDatabase } from "../database/index.js";
import { validateChannel, getChannelErrorMessage, getSetupMessage } from "../utils/channelValidation.js";

export const data = new SlashCommandBuilder()
  .setName("link")
  .setDescription("Link your Discord account to an existing Apple device name")
  .addStringOption((option) =>
    option
      .setName("name")
      .setDescription("The Apple device name to link to")
      .setRequired(true)
      .setAutocomplete(true)
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  db: StepBattleDatabase
): Promise<void> {
  // Validate channel access
  const channelValidation = await validateChannel(interaction, db);
  if (!channelValidation.isValid) {
    await interaction.reply({
      content: getChannelErrorMessage(channelValidation.configuredChannelId!),
      ephemeral: true,
    });
    return;
  }

  // Show setup message if no channel is configured
  if (channelValidation.needsSetup) {
    await interaction.reply({
      content: getSetupMessage(),
      ephemeral: true,
    });
    return;
  }

  const userId = interaction.user.id;
  const appleDeviceName = interaction.options.getString("name", true);

  try {
    // Check if the Apple device name exists in the database
    const existingUser = await db.getUser(appleDeviceName);
    if (!existingUser) {
      await interaction.reply({
        content: `❌ Apple device name "${appleDeviceName}" not found. Please log steps first by using the Apple Shortcut.`,
        ephemeral: true,
      });
      return;
    }

    // Check if this Discord user is already linked to any Apple device name
    const existingLink = await db.getDiscordLink(userId);
    if (existingLink) {
      await interaction.reply({
        content: `❌ You are already linked to Apple device name "${existingLink}". You cannot link to multiple names.`,
        ephemeral: true,
      });
      return;
    }

    // Check if this Apple device name is already linked to another Discord user
    const existingAppleDeviceLink = await db.getAppleHealthLink(appleDeviceName);
    if (existingAppleDeviceLink) {
      await interaction.reply({
        content: `❌ Apple device name "${appleDeviceName}" is already linked to another Discord user.`,
        ephemeral: true,
      });
      return;
    }

    // Create the link
    await db.createDiscordLink(userId, appleDeviceName);

    const embed = new EmbedBuilder()
      .setColor("#00ff00")
      .setTitle("✅ Account Linked Successfully!")
      .setDescription(
        `Your Discord account has been linked to Apple device name "${appleDeviceName}".`
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Error linking account:", error);
    await interaction.reply({
      content:
        "❌ An error occurred while linking your account. Please try again.",
      ephemeral: true,
    });
  }
}

export async function autocomplete(
  interaction: AutocompleteInteraction,
  db: StepBattleDatabase
): Promise<void> {
  const focusedValue = interaction.options.getFocused();
  
  try {
    // Get all users from the database
    const users = await db.getAllUsers();
    
    console.log(`Autocomplete: focusedValue="${focusedValue}", total users=${users.length}`);
    
    let choices;
    
    if (focusedValue && focusedValue.trim().length > 0) {
      // Filter users based on the focused value (case-insensitive)
      const filteredUsers = users
        .filter(user => 
          user.name.toLowerCase().includes(focusedValue.toLowerCase().trim())
        )
        .slice(0, 25); // Discord limits to 25 choices
      
      console.log(`Autocomplete: filtered users=${filteredUsers.length}`);
      
      choices = filteredUsers.map(user => ({
        name: user.name,
        value: user.name
      }));
    } else {
      // If no input, show all users (up to 25)
      const allUsers = users.slice(0, 25);
      console.log(`Autocomplete: showing all users (${allUsers.length})`);
      
      choices = allUsers.map(user => ({
        name: user.name,
        value: user.name
      }));
    }
    
    await interaction.respond(choices);
  } catch (error) {
    console.error("Error in autocomplete:", error);
    await interaction.respond([]);
  }
} 
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  AutocompleteInteraction,
} from "discord.js";
import { StepBattleDatabase } from "../database/index.js";

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
      .addFields({
        name: "📊 Current Steps",
        value: `${existingUser.steps.toLocaleString()} steps`,
        inline: true,
      })
      .addFields({
        name: "🔗 Link Status",
        value: "✅ Active",
        inline: true,
      })
      .setTimestamp()
      .setFooter({ text: "Step Battle Bot" });

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
    
    // Filter users based on the focused value (case-insensitive)
    const filteredUsers = users
      .filter(user => 
        user.name.toLowerCase().includes(focusedValue.toLowerCase())
      )
      .slice(0, 25); // Discord limits to 25 choices
    
    // Create choices for autocomplete
    const choices = filteredUsers.map(user => ({
      name: `${user.name} (${user.steps.toLocaleString()} steps)`,
      value: user.name
    }));
    
    // If no users match, show all available users
    if (choices.length === 0 && users.length > 0) {
      const allChoices = users.slice(0, 25).map(user => ({
        name: `${user.name} (${user.steps.toLocaleString()} steps)`,
        value: user.name
      }));
      await interaction.respond(allChoices);
    } else {
      await interaction.respond(choices);
    }
  } catch (error) {
    console.error("Error in autocomplete:", error);
    await interaction.respond([]);
  }
} 
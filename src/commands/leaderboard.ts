import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { StepBattleDatabase } from "../database/index.js";

export const data = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("Show the current step battle leaderboard");

export async function execute(
  interaction: ChatInputCommandInteraction,
  db: StepBattleDatabase
): Promise<void> {
  try {
    const users = await db.getAllUsers();

    if (users.length === 0) {
      await interaction.reply({
        content: "📊 No participants have logged steps yet.",
        ephemeral: true,
      });
      return;
    }

    // Sort users by steps (highest first)
    const sortedUsers = users.sort((a, b) => b.steps - a.steps);
    const leaderSteps = sortedUsers[0].steps;

    // Create leaderboard display with Discord names when available
    const leaderboardEntries = await Promise.all(
      sortedUsers.map(async (user, index) => {
        const position = index + 1;
        const isLeader = position === 1;
        const stepsBehind = leaderSteps - user.steps;

        let emoji = "🥉";
        if (position === 1) emoji = "🥇";
        else if (position === 2) emoji = "🥈";

        // Try to get Discord username for this Apple device name
        const discordId = await db.getDiscordUsernameForAppleHealthName(user.name);
        let displayName = user.name; // Default to Apple device name

        if (discordId) {
          try {
            // Try to fetch the Discord user
            const discordUser = await interaction.client.users.fetch(discordId);
            displayName = discordUser.username;
          } catch (error) {
            // If we can't fetch the Discord user, fall back to Apple device name
            console.log(`Could not fetch Discord user ${discordId} for ${user.name}`);
          }
        }

        // Create the entry text
        let entryText = `${emoji} **${displayName}**`;
        
        if (isLeader) {
          entryText += " 🏆 **LEADER**";
        } else {
          // Get the percentage change in gap
          const gapChange = await db.getGapChangePercentage(user.id);
          
          if (gapChange !== null) {
            if (gapChange > 0) {
              // Catching up to the leader
              if (gapChange >= 10) {
                entryText += ` 🚀 **+${gapChange}% closer** - Amazing progress!`;
              } else if (gapChange >= 5) {
                entryText += ` 🔥 **+${gapChange}% closer** - You're gaining ground!`;
              } else {
                entryText += ` 💪 **+${gapChange}% closer** - Keep it up!`;
              }
            } else if (gapChange < 0) {
              // Falling behind
              const absChange = Math.abs(gapChange);
              if (absChange >= 10) {
                entryText += ` 📉 **${gapChange}% gap** - Time to step it up!`;
              } else if (absChange >= 5) {
                entryText += ` ⚠️ **${gapChange}% gap** - Don't fall behind!`;
              } else {
                entryText += ` 🚶‍♂️ **${gapChange}% gap** - Stay focused!`;
              }
            } else {
              // No change
              entryText += ` ➡️ **Same gap** - Maintain the pace!`;
            }
          } else {
            // Not enough data yet
            entryText += ` 📊 **New participant** - Welcome to the challenge!`;
          }
        }

        return entryText;
      })
    );

    // Get display name for the leader
    const leaderDiscordId = await db.getDiscordUsernameForAppleHealthName(sortedUsers[0].name);
    let leaderDisplayName = sortedUsers[0].name;
    
    if (leaderDiscordId) {
      try {
        const discordUser = await interaction.client.users.fetch(leaderDiscordId);
        leaderDisplayName = discordUser.username;
      } catch (error) {
        console.log(`Could not fetch Discord user ${leaderDiscordId} for ${sortedUsers[0].name}`);
      }
    }

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
      ephemeral: true,
    });
  }
}

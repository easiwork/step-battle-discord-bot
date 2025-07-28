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

    // Create leaderboard display without revealing totals
    const leaderboardEntries = sortedUsers.map((user, index) => {
      const position = index + 1;
      const isAhead = position === 1;

      let emoji = "🥉";
      if (position === 1) emoji = "🥇";
      else if (position === 2) emoji = "🥈";

      return `${emoji} **${user.name}** ${
        isAhead ? "is currently ahead!" : "keep pushing!"
      }`;
    });

    const embed = new EmbedBuilder()
      .setColor("#ffd700")
      .setTitle("🏃‍♂️ Step Battle Leaderboard")
      .setDescription(leaderboardEntries.join("\n"))
      .addFields({
        name: "📈 Battle Status",
        value:
          sortedUsers.length === 1
            ? `${sortedUsers[0].name} is the only participant so far!`
            : `${sortedUsers[0].name} is leading the pack!`,
      })
      .setTimestamp()
      .setFooter({ text: "Step Battle Bot - No step totals revealed!" });

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

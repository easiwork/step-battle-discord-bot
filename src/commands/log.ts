import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { StepBattleDatabase } from "../database/index.js";

export const data = new SlashCommandBuilder()
  .setName("log")
  .setDescription("Log your steps for the past two weeks")
  .addStringOption((option) =>
    option
      .setName("name")
      .setDescription("Your Apple device name")
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("week1")
      .setDescription("Average steps for the past week")
      .setRequired(true)
      .setMinValue(0)
      .setMaxValue(50000)
  )
  .addIntegerOption((option) =>
    option
      .setName("week2")
      .setDescription("Average steps for the week before that")
      .setRequired(true)
      .setMinValue(0)
      .setMaxValue(50000)
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  db: StepBattleDatabase
): Promise<void> {
  const name = interaction.options.getString("name", true);
  const week1 = interaction.options.getInteger("week1", true);
  const week2 = interaction.options.getInteger("week2", true);

  try {
    // Ensure user exists in database
    await db.createUser(name, name);

    // Calculate total steps for the 2-week period
    const totalSteps = Math.round(((week1 + week2) / 2) * 14);

    // Add step entry
    await db.addStepEntry(
      name,
      {
        date: new Date().toISOString().split("T")[0],
        week1,
        week2,
      },
      "manual"
    );

    // Get updated user data
    const user = await db.getUser(name);
    if (!user) {
      throw new Error("Failed to retrieve user data");
    }

    const embed = new EmbedBuilder()
      .setColor("#00ff00")
      .setTitle("✅ Steps Logged Successfully!")
      .setDescription(
        `${name} has logged their steps for the past 2 weeks.`
      )
      .addFields(
        {
          name: "Week 1 Average",
          value: `${week1.toLocaleString()} steps`,
          inline: true,
        },
        {
          name: "Week 2 Average",
          value: `${week2.toLocaleString()} steps`,
          inline: true,
        },
        {
          name: "Total Added",
          value: `${totalSteps.toLocaleString()} steps`,
          inline: true,
        },
        {
          name: "Your Total",
          value: `${user.steps.toLocaleString()} steps`,
          inline: false,
        }
      )
      .setTimestamp()
      .setFooter({ text: "Step Battle Bot" });

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Error logging steps:", error);
    await interaction.reply({
      content:
        "❌ An error occurred while logging your steps. Please try again.",
      ephemeral: true,
    });
  }
}

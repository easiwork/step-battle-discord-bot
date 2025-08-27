import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
} from "discord.js";
import { StepBattleDatabase } from "../database/index.js";
import {
  validateChannel,
  getChannelErrorMessage,
  getSetupMessage,
} from "../utils/channelValidation.js";

const roasts = [
  "bro thinks hes training for the olympics just to walk in circles",
  "lmao u walked all that and still not touching grass",
  "ur fitbit is literally in its flop era",
  "ok mr marathon man who asked",
  "u walked 100k steps and still a certified npc",
  "damn bro really speedran being annoying",
  "all those steps just to end up back where u started",
  "congrats u unlocked the mid badge",
  "bro thinks hes on tour or smth",
  "u walked like a side quest character nobody talks to",
  "that’s not cardio thats a personality disorder",
  "bro farming steps like its minecraft xp",
  "nah cause even my dog walks more and hes unemployed",
  "2 weeks of walking just to flex on nobody",
  "u walking like u tryna outpace ur problems",
  "bro acts like nike gon sponsor him",
  "imagine bragging about cardio when ur still broke",
  "u walked more than my screen time and thats wild",
  "all those steps and ur still not him",
  "bro got the step count of a pilgrim and the vibes of a potato",
  "congrats u ran away from relevance",
  "ur shoes bout to file a restraining order",
  "bro walking like hes trying to escape the friendzone",
  "nah this is npc pathing fr",
  "u got side quest energy with main character cardio",
  "200k steps just to walk into disappointment",
  "bro took one giant step for mankind and zero for his personality",
  "walking like the final boss of boredom",
  "ok columbus u discovered nothing",
  "ur step count built like a pyramid scheme",
  "bro thinks hes in his cardio arc but hes in his cringe arc",
  "all that walking just to look lost",
  "ur sneakers got more character development than u",
  "bro hit 10 miles per day and still cant run a conversation",
  "certified walker unverified human",
  "nah cause u walking like gta npc on repeat",
  "bro logged more miles than my uber and still useless",
  "congrats u just invented jogging in place for clout",
  "all those steps and ur riz stayed at zero",
  "bro the only thing ur stepping on is my nerves",
];

function getRandomRoast(): string {
  return roasts[Math.floor(Math.random() * roasts.length)];
}

export const data = new SlashCommandBuilder()
  .setName("submitsteps")
  .setDescription("Manually submit steps for bi-weekly periods")
  .addIntegerOption((option) =>
    option
      .setName("week1")
      .setDescription(
        "Steps for the first week of the current bi-weekly period"
      )
      .setRequired(true)
      .setMinValue(0)
  )
  .addIntegerOption((option) =>
    option
      .setName("week2")
      .setDescription(
        "Steps for the second week of the current bi-weekly period"
      )
      .setRequired(true)
      .setMinValue(0)
  );

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

    // Get the step counts
    const week1Steps = interaction.options.getInteger("week1", true);
    const week2Steps = interaction.options.getInteger("week2", true);

    // Use Discord username for manual submissions
    const discordId = interaction.user.id;
    const discordUsername = interaction.user.username;

    // Create a unique identifier for this Discord user
    const userId = `discord_${discordId}`;

    // Get or create user
    await db.createUser(userId, discordUsername);

    // Get the server start date to calculate periods
    const startDate = await db.getServerStartDate(interaction.guildId!);
    if (!startDate) {
      await interaction.reply({
        content:
          "❌ This server hasn't started a step battle yet!\n\nAn administrator needs to use `/startstepping` first.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Calculate the current bi-weekly period
    const now = new Date();
    const start = new Date(startDate);

    // Find the current period start (14 days before the next leaderboard)
    let currentPeriodStart = new Date(start);
    currentPeriodStart.setDate(currentPeriodStart.getDate() - 13); // 14 days before start

    // Find which period we're in
    let periodNumber = 0;
    let periodStart = new Date(currentPeriodStart);

    while (periodStart <= now) {
      const periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 13);

      if (now >= periodStart && now <= periodEnd) {
        break; // Found the current period
      }

      periodStart.setDate(periodStart.getDate() + 14);
      periodNumber++;
    }

    // Calculate the two weeks within this period
    const week1Start = new Date(periodStart);
    const week1End = new Date(week1Start);
    week1End.setDate(week1End.getDate() + 6); // 7 days (0-6)

    const week2Start = new Date(week1End);
    week2Start.setDate(week2Start.getDate() + 1); // Next day
    const week2End = new Date(week2Start);
    week2End.setDate(week2End.getDate() + 6); // 7 days (0-6)

    // Submit combined steps for the bi-weekly period
    const totalPeriodSteps = week1Steps + week2Steps;
    if (totalPeriodSteps > 0) {
      await db.addStepEntry(userId, totalPeriodSteps, "manual");
    }

    // Get updated totals
    const users = await db.getAllUsersWithBiWeeklyTotals(interaction.guildId!);
    const user = users.find((u) => u.id === userId);
    const totalSteps = user?.steps || 0;

    // Create response message
    // let response = `✅ **Steps submitted successfully!**\n\n`;
    // response += `📅 **Period ${
    //   periodNumber + 1
    // }** (${periodStart.toLocaleDateString()} - ${week2End.toLocaleDateString()})\n`;

    // if (week1Steps > 0) {
    //   response += `📊 **Week 1:** ${week1Steps.toLocaleString()} steps\n`;
    // }
    // if (week2Steps > 0) {
    //   response += `📊 **Week 2:** ${week2Steps.toLocaleString()} steps\n`;
    // }

    // response += `📊 **Period Total:** ${totalPeriodSteps.toLocaleString()} steps\n`;
    // response += `\n🏃‍♂️ **Your Total:** ${totalSteps.toLocaleString()} steps\n`;
    // response += `\n${getRandomInsult()}`;

    const roast = getRandomRoast();
    await interaction.reply({
      // content: `Got your steps, <@${discordId}>.\n\n_${roast}_`,
      content: roast,
    });
  } catch (error) {
    console.error("Error submitting steps:", error);
    await interaction.reply({
      content:
        "❌ An error occurred while submitting your steps. Please try again.",
      flags: MessageFlags.Ephemeral,
    });
  }
}

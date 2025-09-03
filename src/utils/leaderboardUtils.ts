import { Guild, EmbedBuilder } from "discord.js";
import { StepBattleDatabase } from "../database/index.js";

export interface LeaderboardUser {
  id: string;
  name: string;
  steps: number;
  discordUsername: string;
}

export interface LeaderboardResult {
  users: LeaderboardUser[];
  embed: EmbedBuilder;
  participantCount: number;
}

export async function generateLeaderboard(
  guild: Guild,
  db: StepBattleDatabase,
  guildId: string
): Promise<LeaderboardResult> {
  const users = await db.getAllUsersWithBiWeeklyTotals(guildId);
  const filteredUsers: LeaderboardUser[] = [];

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
    const embed = new EmbedBuilder()
      .setColor("#ffd700")
      .setTitle("🏃‍♂️ Biggest Steppers")
      .setDescription(
        "📊 No participants in this server have logged steps yet.\n\nUse `/link` to connect your Apple Health account or `/submitsteps` to manually submit steps."
      )
      .setTimestamp();

    return {
      users: [],
      embed,
      participantCount: 0,
    };
  }

  // Sort filtered users by steps (highest first)
  const sortedUsers = filteredUsers.sort((a, b) => b.steps - a.steps);

  // Create leaderboard display
  const leaderboardEntries = sortedUsers.map((user, index) => {
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
  });

  const embed = new EmbedBuilder()
    .setColor("#ffd700")
    .setTitle("🏃‍♂️ Biggest Steppers")
    .setDescription(leaderboardEntries.join("\n"))
    .setTimestamp();

  return {
    users: sortedUsers,
    embed,
    participantCount: sortedUsers.length,
  };
}

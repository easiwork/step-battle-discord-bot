import { Cron } from "croner";

export interface LeaderboardSchedule {
  enabled: boolean;
  dayOfWeek: number;
  hour: number;
  minute: number;
  intervalWeeks: number;
}

export interface ScheduledTime {
  timestamp: Date;
  timeUntil: string;
  isThisWeek: boolean;
}

export function getNextLeaderboardTimes(
  schedule: LeaderboardSchedule,
  count: number = 5
): ScheduledTime[] {
  if (!schedule.enabled) {
    return [];
  }

  const cronExpression = `${schedule.minute} ${schedule.hour} * * ${schedule.dayOfWeek}`;
  const cron = new Cron(cronExpression, { timezone: "UTC" });
  
  const scheduledTimes: ScheduledTime[] = [];
  let currentTime = new Date();
  let nextRun = cron.nextRun();
  let runCount = 0;

  while (nextRun && runCount < count * 2) { // Get more than needed to filter by interval
    const timeUntil = nextRun.getTime() - currentTime.getTime();
    const daysUntil = Math.floor(timeUntil / (1000 * 60 * 60 * 24));
    const hoursUntil = Math.floor((timeUntil % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutesUntil = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));

    let timeUntilString = "";
    if (daysUntil > 0) {
      timeUntilString = `in ${daysUntil}d ${hoursUntil}h ${minutesUntil}m`;
    } else if (hoursUntil > 0) {
      timeUntilString = `in ${hoursUntil}h ${minutesUntil}m`;
    } else {
      timeUntilString = `in ${minutesUntil}m`;
    }

    // Check if this week matches the interval
    const weekOfMonth = Math.ceil(nextRun.getDate() / 7);
    const shouldPost = (weekOfMonth - 1) % schedule.intervalWeeks === 0;

    if (shouldPost) {
      scheduledTimes.push({
        timestamp: nextRun,
        timeUntil: timeUntilString,
        isThisWeek: weekOfMonth === Math.ceil(currentTime.getDate() / 7)
      });

      if (scheduledTimes.length >= count) {
        break;
      }
    }

    // Get next run time
    nextRun = cron.nextRun(nextRun);
    runCount++;
  }

  return scheduledTimes;
}

export function shouldPostThisWeek(schedule: LeaderboardSchedule): boolean {
  if (!schedule.enabled) {
    return false;
  }

  const now = new Date();
  const weekOfMonth = Math.ceil(now.getDate() / 7);
  return (weekOfMonth - 1) % schedule.intervalWeeks === 0;
}

export function getCurrentWeekInfo(schedule: LeaderboardSchedule): {
  currentWeek: number;
  shouldPost: boolean;
  weeksUntilNext: number;
} {
  if (!schedule.enabled) {
    return { currentWeek: 0, shouldPost: false, weeksUntilNext: 0 };
  }

  const now = new Date();
  const weekOfMonth = Math.ceil(now.getDate() / 7);
  const shouldPost = (weekOfMonth - 1) % schedule.intervalWeeks === 0;
  
  let weeksUntilNext = 0;
  if (!shouldPost) {
    weeksUntilNext = schedule.intervalWeeks - ((weekOfMonth - 1) % schedule.intervalWeeks);
  }

  return {
    currentWeek: weekOfMonth,
    shouldPost,
    weeksUntilNext
  };
}

export function getReminderSchedule(schedule: LeaderboardSchedule): {
  hour: number;
  minute: number;
  cronExpression: string;
} {
  const reminderHour = (schedule.hour - 1 + 24) % 24; // 1 hour before
  const reminderCronExpression = `${schedule.minute} ${reminderHour} * * ${schedule.dayOfWeek}`;
  
  return {
    hour: reminderHour,
    minute: schedule.minute,
    cronExpression: reminderCronExpression
  };
}

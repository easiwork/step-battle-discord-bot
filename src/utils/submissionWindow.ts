export function isSubmissionWindowOpen(): { isOpen: boolean; windowDate?: string; nextWindow?: string } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const hour = now.getHours();
  const minute = now.getMinutes();

  // Check if it's Sunday
  if (dayOfWeek !== 0) {
    return { isOpen: false };
  }

  // Check if it's an odd week (1st, 3rd, 5th, etc. Sunday of each month)
  const weekOfMonth = Math.ceil(now.getDate() / 7);
  const isOddWeek = weekOfMonth % 2 === 1;

  if (!isOddWeek) {
    return { isOpen: false };
  }

  // Check if it's within the submission window (10 PM to 11:55 PM)
  const isWithinWindow = (hour === 22 && minute >= 0) || 
                        (hour === 23 && minute <= 55);

  if (!isWithinWindow) {
    return { isOpen: false };
  }

  // Window is open, return the window date
  const windowDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  return { isOpen: true, windowDate };
}

export function getNextSubmissionWindow(): string {
  const now = new Date();
  const currentDay = now.getDay();
  const currentWeek = Math.ceil(now.getDate() / 7);
  
  let targetDate = new Date(now);
  
  // If it's Sunday and an odd week, but outside the window, next window is next odd Sunday
  if (currentDay === 0 && currentWeek % 2 === 1) {
    // Add 2 weeks to get to next odd Sunday
    targetDate.setDate(targetDate.getDate() + 14);
  } else {
    // Find the next odd Sunday
    const daysUntilNextSunday = (7 - currentDay) % 7;
    targetDate.setDate(targetDate.getDate() + daysUntilNextSunday);
    
    // If this Sunday is even, add another week
    const nextSundayWeek = Math.ceil(targetDate.getDate() / 7);
    if (nextSundayWeek % 2 === 0) {
      targetDate.setDate(targetDate.getDate() + 7);
    }
  }
  
  // Set to 10 PM on that Sunday
  targetDate.setHours(22, 0, 0, 0);
  
  return targetDate.toISOString();
}

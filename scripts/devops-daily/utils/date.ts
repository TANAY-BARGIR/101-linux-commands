import { format, getWeek, getYear, isAfter, isBefore, subDays } from 'date-fns';

/**
 * Get the current week number
 */
export function getCurrentWeek(): number {
  return getWeek(new Date(), { weekStartsOn: 1 });
}

/**
 * Get the current year
 */
export function getCurrentYear(): number {
  return getYear(new Date());
}

/**
 * Format a date as ISO string (YYYY-MM-DD)
 */
export function formatISODate(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Check if a date is within the last N days
 */
export function isWithinLastDays(date: Date | string, days: number = 7): boolean {
  const compareDate = typeof date === 'string' ? new Date(date) : date;
  const threshold = subDays(new Date(), days);
  return isAfter(compareDate, threshold);
}

/**
 * Parse various date formats to Date object
 */
export function parseDate(dateString: string): Date {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date string: ${dateString}`);
    return new Date();
  }
  return date;
}

/**
 * Get formatted date for display (e.g., "Nov 16, 2025")
 */
export function formatDisplayDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseDate(date) : date;
  return format(d, 'MMM d, yyyy');
}

/**
 * Generate a branch name for the news digest
 */
export function generateBranchName(year?: number, week?: number): string {
  const y = year || getCurrentYear();
  const w = week || getCurrentWeek();
  return `news-${y}-w${w}`;
}

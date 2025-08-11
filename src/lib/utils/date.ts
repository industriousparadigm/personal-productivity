import * as chrono from 'chrono-node';
import { format, isToday, isTomorrow, isThisWeek, isPast, differenceInDays, startOfDay, endOfDay } from 'date-fns';

export function parseDate(input: string): Date | null {
  const result = chrono.parseDate(input);
  return result;
}

export function formatCommitmentDate(date: Date): string {
  if (isToday(date)) {
    return `Today at ${format(date, 'h:mm a')}`;
  }
  if (isTomorrow(date)) {
    return `Tomorrow at ${format(date, 'h:mm a')}`;
  }
  if (isThisWeek(date)) {
    return format(date, "EEEE 'at' h:mm a");
  }
  return format(date, "MMM d 'at' h:mm a");
}

export function getDaysOverdue(date: Date): number {
  if (!isPast(date)) return 0;
  return differenceInDays(new Date(), date);
}

export function getCommitmentStatus(date: Date): 'overdue' | 'today' | 'upcoming' {
  if (isPast(date) && !isToday(date)) {
    return 'overdue';
  }
  if (isToday(date)) {
    return 'today';
  }
  return 'upcoming';
}

export function getTodayRange() {
  const now = new Date();
  return {
    start: startOfDay(now),
    end: endOfDay(now),
  };
}
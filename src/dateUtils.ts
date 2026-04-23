import { differenceInCalendarDays, format, getDay, parse, startOfWeek } from "date-fns";
import { WEEK_DAY_KEYS } from "./constants";
import type { WeekDayKey } from "./types";

export function formatDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function formatPlannerDateKey(date: Date) {
  return `planner-${formatDateKey(date)}`;
}

/** 해당 주의 월요일 00:00 (로컬), 월~일 주간 기준 */
export function startOfWeekMonday(ref: Date): Date {
  return startOfWeek(ref, { weekStartsOn: 1 });
}

export function getWeekDayKey(date: Date): WeekDayKey {
  const day = getDay(date);
  if (day === 0) return "Sun";
  return WEEK_DAY_KEYS[day - 1];
}

export function isValidYMD(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s.trim());
}

export function daysBetweenDateKeys(refKey: string, targetKey: string): number | null {
  if (!isValidYMD(refKey) || !isValidYMD(targetKey)) return null;
  const refDate = parse(refKey, "yyyy-MM-dd", new Date());
  const targetDate = parse(targetKey, "yyyy-MM-dd", new Date());
  return differenceInCalendarDays(targetDate, refDate);
}

import type { WeekDayKey } from "./types";

export const PLANNER_STORAGE_KEY = "planner-user-inputs-v1";
export const SHARED_STORAGE_KEY = "growth-system-v2";
export const GANDHI_GOALS_KEY = "gandhi-goals";
export const GANDHI_REFLECTION_KEY = "gandhi-reflection";
export const DAILY_EP_KEY = "dailyEP";
export const GANDHI_WEEKLY_SCHEDULE_KEY = "gandhi-weekly-schedule";
export const GANDHI_BASE_SCHEDULE_KEY = "gandhi-base-schedule";
export const GANDHI_SCHEDULE_CHECKED_KEY = "gandhi-schedule-checked";
export const GANDHI_KANBAN_KEY = "gandhi-kanban-board-v1";

export const WEEK_DAY_KEYS: WeekDayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEK_DAY_LABEL_KO: Record<WeekDayKey, string> = {
  Mon: "월",
  Tue: "화",
  Wed: "수",
  Thu: "목",
  Fri: "금",
  Sat: "토",
  Sun: "일",
};

export const ALARM_SOUND_URL = "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg";
export const DEFAULT_MONTHLY_VISION = "Finding my own pace";
export const DEFAULT_WEEKLY_GOALS: Record<string, string> = {
  Mon: "Deep focus reading",
  Tue: "Creative project",
  Wed: "Community service",
  Thu: "Math exploration",
  Fri: "Reflection & rest",
  Sat: "",
  Sun: "",
};

export const TIMELINE_START = 6;
export const TIMELINE_END = 24;
export const TIMELINE_SPAN = TIMELINE_END - TIMELINE_START;

export const WEEK_MINIMAP_SLOTS = [
  { label: "아침", start: 8, end: 11 },
  { label: "점심", start: 11, end: 14 },
  { label: "오후", start: 14, end: 18 },
  { label: "저녁", start: 18, end: 22 },
] as const;

export const CALENDAR_WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

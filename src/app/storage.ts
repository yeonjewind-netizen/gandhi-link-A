import { DAILY_BONUS_COUNT_KEY, DAILY_EP_KEY, DAILY_ROUTINES_KEY, SHARED_KEY } from "./constants";
import type { DailyRoutine, SharedData } from "./types";

export function readDailyEpMap(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DAILY_EP_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function readDailyBonusMap(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DAILY_BONUS_COUNT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function readShared(): SharedData {
  if (typeof window === "undefined") return { byDate: {} };
  try {
    const raw = localStorage.getItem(SHARED_KEY);
    if (!raw) return { byDate: {} };
    return JSON.parse(raw) as SharedData;
  } catch {
    return { byDate: {} };
  }
}

export function writeShared(next: SharedData) {
  localStorage.setItem(SHARED_KEY, JSON.stringify(next));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("growth-sync"));
  }
}

export function readDailyRoutines(): DailyRoutine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DAILY_ROUTINES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DailyRoutine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

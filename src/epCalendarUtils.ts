import { DAILY_EP_KEY } from "./constants";
import type { BigGoal } from "./types";

export function computeGoalEp(goal: BigGoal): number {
  const n = goal.subTasks.length;
  const done = goal.subTasks.filter((t) => t.isDone).length;
  let ep = done * 10;
  if (n >= 3 && done === n && n > 0) ep += 50;
  return ep;
}

export function computeBig3DailyEp(big3: BigGoal[]): number {
  return big3.reduce((sum, g) => sum + computeGoalEp(g), 0);
}

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

/** 히트맵 색 농도(0~100): 일일 EP 기준 */
export function dailyEpToHeatPercent(ep: number): number {
  if (ep <= 0) return 0;
  return Math.min(100, Math.round((ep / 240) * 100));
}

export function heatClassForCalendarCell(achievement: number): string {
  if (achievement >= 81) return "bg-emerald-500 text-white font-bold";
  if (achievement >= 41) return "bg-emerald-300/70 text-stone-800";
  if (achievement >= 1) return "bg-emerald-100/50 text-stone-700";
  return "bg-transparent text-stone-700";
}

/** dailyEP 구간별 잔디 심기 아이콘 */
export function getCalendarPlantIcon(ep: number): string | null {
  if (ep <= 0) return null;
  if (ep < 50) return "🌱";
  if (ep < 110) return "🌿";
  if (ep < 160) return "🌼";
  return "🌳";
}

export function getPlantStageFromDailyEp(ep: number) {
  if (ep >= 160) return { icon: "🌳", label: "든든한 나무" };
  if (ep >= 110) return { icon: "🌼", label: "꽃" };
  if (ep >= 50) return { icon: "🌿", label: "잎사귀" };
  if (ep >= 10) return { icon: "🌱", label: "새싹" };
  return { icon: "🌱", label: "새싹" };
}

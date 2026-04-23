import { format } from "date-fns";
import type { BigGoal } from "./types";

/** 소목표 1개당 +10 EP, 해당 Big 3 전체 완료 시 소목표 3개 이상이면 +50 EP */
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

/** 오늘 기준 달성 가능한 최대 EP (진행 바용) */
export function computeBig3MaxEp(big3: BigGoal[]): number {
  return big3.reduce((sum, g) => {
    const n = g.subTasks.length;
    if (n === 0) return sum;
    const maxGoal = n * 10 + (n >= 3 ? 50 : 0);
    return sum + maxGoal;
  }, 0);
}

/** 하루 총 EP에 따른 식물 단계(홈·마감 모달) */
export function getPlantStageFromDailyEp(ep: number) {
  if (ep >= 160) return { icon: "🌳", label: "든든한 나무" };
  if (ep >= 110) return { icon: "🌼", label: "꽃" };
  if (ep >= 50) return { icon: "🌿", label: "잎사귀" };
  if (ep >= 10) return { icon: "🌱", label: "새싹" };
  return { icon: "🌱", label: "새싹" };
}

/** 해당 날 Big 3 중 대목표 보너스(+50 EP)가 발생한 횟수(목표당 최대 1) */
export function countBonusGoalsToday(big3: BigGoal[]): number {
  return big3.filter((g) => {
    const n = g.subTasks.length;
    const done = g.subTasks.filter((t) => t.isDone).length;
    return n >= 3 && done === n && n > 0;
  }).length;
}

export function getDateKey(date = new Date()) {
  return format(date, "yyyy-MM-dd");
}

export function defaultBig3(): BigGoal[] {
  return [
    { id: "goal-1", title: "", subTasks: [] },
    { id: "goal-2", title: "", subTasks: [] },
    { id: "goal-3", title: "", subTasks: [] },
  ];
}

export function normalizeBig3(input?: BigGoal[]): BigGoal[] {
  const base = defaultBig3();
  if (!input || input.length === 0) return base;
  return base.map((fallback, index) => {
    const item = input[index];
    if (!item) return fallback;
    return {
      id: item.id || fallback.id,
      title: item.title ?? "",
      subTasks: Array.isArray(item.subTasks) ? item.subTasks : [],
    };
  });
}

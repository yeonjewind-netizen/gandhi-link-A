import type { BigGoal } from "./types";

export function createDefaultBig3(): BigGoal[] {
  return [
    { id: "goal-1", title: "", subTasks: [] },
    { id: "goal-2", title: "", subTasks: [] },
    { id: "goal-3", title: "", subTasks: [] },
  ];
}

import {
  GANDHI_KANBAN_KEY,
  GANDHI_SCHEDULE_CHECKED_KEY,
  PLANNER_STORAGE_KEY,
  SHARED_STORAGE_KEY,
} from "./constants";
import type { KanbanState, PlannerPersistedState, ScheduleCheckedStore, SharedState } from "./types";

export function getSharedState(): SharedState {
  if (typeof window === "undefined") return { byDate: {} };
  try {
    const raw = localStorage.getItem(SHARED_STORAGE_KEY);
    if (!raw) return { byDate: {} };
    const parsed = JSON.parse(raw) as SharedState;
    return {
      byDate: parsed?.byDate ?? {},
    };
  } catch {
    return { byDate: {} };
  }
}

export function saveSharedState(next: SharedState) {
  localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(next));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("growth-sync"));
  }
}

export function getPlannerState(): PlannerPersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PLANNER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PlannerPersistedState;
  } catch {
    return null;
  }
}

export function getScheduleCheckedStore(): ScheduleCheckedStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(GANDHI_SCHEDULE_CHECKED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ScheduleCheckedStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveScheduleCheckedStore(next: ScheduleCheckedStore) {
  localStorage.setItem(GANDHI_SCHEDULE_CHECKED_KEY, JSON.stringify(next));
}

const EMPTY_KANBAN: KanbanState = {
  todo: [],
  doing: [],
  done: [],
};

export function getKanbanState(): KanbanState {
  if (typeof window === "undefined") return EMPTY_KANBAN;
  try {
    const raw = localStorage.getItem(GANDHI_KANBAN_KEY);
    if (!raw) return EMPTY_KANBAN;
    const parsed = JSON.parse(raw) as Partial<KanbanState>;
    return {
      todo: Array.isArray(parsed?.todo) ? parsed.todo : [],
      doing: Array.isArray(parsed?.doing) ? parsed.doing : [],
      done: Array.isArray(parsed?.done) ? parsed.done : [],
    };
  } catch {
    return EMPTY_KANBAN;
  }
}

export function saveKanbanState(next: KanbanState) {
  localStorage.setItem(GANDHI_KANBAN_KEY, JSON.stringify(next));
}

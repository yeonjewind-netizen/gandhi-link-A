import { useSyncExternalStore } from "react";
import { DAILY_EP_KEY, GANDHI_GOALS_KEY, GANDHI_REFLECTION_KEY, SHARED_STORAGE_KEY } from "../constants";
import { DAILY_BONUS_COUNT_KEY, DAILY_ROUTINES_KEY } from "../app/constants";
import type { DailyRoutine, SharedData } from "../app/types";

type GandhiSnapshot = {
  shared: SharedData;
  dailyRoutines: DailyRoutine[];
  dailyEpMap: Record<string, number>;
  dailyBonusMap: Record<string, number>;
  reflectionMap: Record<string, string>;
};

const EMPTY_SHARED: SharedData = { byDate: {} };
const EMPTY_ROUTINES: DailyRoutine[] = [];
const EMPTY_NUMBER_MAP: Record<string, number> = {};
const EMPTY_REFLECTION_MAP: Record<string, string> = {};

const listeners = new Set<() => void>();

function parseObject<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as T;
    if (!parsed || typeof parsed !== "object") return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

function parseRoutineArray(raw: string | null): DailyRoutine[] {
  if (!raw) return EMPTY_ROUTINES;
  try {
    const parsed = JSON.parse(raw) as DailyRoutine[];
    return Array.isArray(parsed) ? parsed : EMPTY_ROUTINES;
  } catch {
    return EMPTY_ROUTINES;
  }
}

function readSnapshot(): GandhiSnapshot {
  if (typeof window === "undefined") {
    return {
      shared: EMPTY_SHARED,
      dailyRoutines: EMPTY_ROUTINES,
      dailyEpMap: EMPTY_NUMBER_MAP,
      dailyBonusMap: EMPTY_NUMBER_MAP,
      reflectionMap: EMPTY_REFLECTION_MAP,
    };
  }
  const sharedRaw = localStorage.getItem(GANDHI_GOALS_KEY) ?? localStorage.getItem(SHARED_STORAGE_KEY);
  return {
    shared: parseObject<SharedData>(sharedRaw, EMPTY_SHARED),
    dailyRoutines: parseRoutineArray(localStorage.getItem(DAILY_ROUTINES_KEY)),
    dailyEpMap: parseObject<Record<string, number>>(localStorage.getItem(DAILY_EP_KEY), EMPTY_NUMBER_MAP),
    dailyBonusMap: parseObject<Record<string, number>>(localStorage.getItem(DAILY_BONUS_COUNT_KEY), EMPTY_NUMBER_MAP),
    reflectionMap: parseObject<Record<string, string>>(localStorage.getItem(GANDHI_REFLECTION_KEY), EMPTY_REFLECTION_MAP),
  };
}

let snapshotCache = readSnapshot();

function notifyListeners() {
  for (const listener of listeners) listener();
}

function refreshSnapshot() {
  snapshotCache = readSnapshot();
  notifyListeners();
}

function emitGrowthSync() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("growth-sync"));
}

export function subscribeGandhiStore(listener: () => void) {
  listeners.add(listener);
  if (typeof window === "undefined") {
    return () => {
      listeners.delete(listener);
    };
  }

  const onSync = () => refreshSnapshot();
  window.addEventListener("storage", onSync);
  window.addEventListener("growth-sync", onSync);
  window.addEventListener("focus", onSync);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onSync);
    window.removeEventListener("growth-sync", onSync);
    window.removeEventListener("focus", onSync);
  };
}

export function getGandhiSnapshot() {
  return snapshotCache;
}

function persistAndBroadcast() {
  refreshSnapshot();
  emitGrowthSync();
}

export function updateShared(updater: (prev: SharedData) => SharedData) {
  if (typeof window === "undefined") return;
  const current = readSnapshot().shared;
  const next = updater(current);
  localStorage.setItem(GANDHI_GOALS_KEY, JSON.stringify(next));
  localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(next));
  persistAndBroadcast();
}

export function updateDailyRoutines(updater: (prev: DailyRoutine[]) => DailyRoutine[]) {
  if (typeof window === "undefined") return;
  const current = readSnapshot().dailyRoutines;
  const next = updater(current);
  localStorage.setItem(DAILY_ROUTINES_KEY, JSON.stringify(next));
  persistAndBroadcast();
}

export function setDailyEpForDate(dateKey: string, ep: number) {
  if (typeof window === "undefined") return;
  const currentMap = readSnapshot().dailyEpMap;
  const prev = currentMap[dateKey];
  const normalized = Number.isFinite(Number(ep)) ? Math.max(0, Number(ep)) : 0;
  if (prev === normalized) return;
  const nextMap = { ...currentMap, [dateKey]: normalized };
  localStorage.setItem(DAILY_EP_KEY, JSON.stringify(nextMap));
  persistAndBroadcast();
}

export function setDailyBonusForDate(dateKey: string, count: number) {
  if (typeof window === "undefined") return;
  const currentMap = readSnapshot().dailyBonusMap;
  const normalized = Number.isFinite(Number(count)) ? Math.max(0, Math.floor(Number(count))) : 0;
  const prev = currentMap[dateKey];
  if (prev === normalized) return;
  const nextMap = { ...currentMap, [dateKey]: normalized };
  localStorage.setItem(DAILY_BONUS_COUNT_KEY, JSON.stringify(nextMap));
  persistAndBroadcast();
}

export function updateReflection(dateKey: string, text: string) {
  if (typeof window === "undefined") return;
  const currentMap = readSnapshot().reflectionMap;
  if ((currentMap[dateKey] ?? "") === text) return;
  const nextMap = { ...currentMap, [dateKey]: text };
  localStorage.setItem(GANDHI_REFLECTION_KEY, JSON.stringify(nextMap));
  persistAndBroadcast();
}

export function useGandhiStore() {
  return useSyncExternalStore(subscribeGandhiStore, getGandhiSnapshot, getGandhiSnapshot);
}

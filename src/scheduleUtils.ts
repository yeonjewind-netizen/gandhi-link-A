import type { BaseWeeklyScheduleStore, LayeredScheduleItem, ScheduleItem, WeeklyScheduleStore } from "./types";
import { GANDHI_BASE_SCHEDULE_KEY, GANDHI_WEEKLY_SCHEDULE_KEY } from "./constants";

export function schedulePriority(s: Pick<ScheduleItem, "priority">): import("./types").SchedulePriority {
  const p = s.priority;
  if (p === 2) return 2;
  if (p === 3) return 3;
  return 1;
}

export function parsePriorityFromFormData(fd: FormData): import("./types").SchedulePriority {
  const raw = String(fd.get("priority") ?? "1");
  if (raw === "3") return 3;
  if (raw === "2") return 2;
  return 1;
}

/** "14:00~16:00" 또는 단일 "14:00" → 시간(소수) 구간 (단일 시각은 1분 구간으로 슬롯 배치) */
export function parseTimeRange(time: string): { start: number; end: number } | null {
  const trimmed = time.trim();
  const range = trimmed.match(/(\d{1,2})\s*:\s*(\d{2})\s*[~\-–]\s*(\d{1,2})\s*:\s*(\d{2})/);
  if (range) {
    const sh = parseInt(range[1], 10) + parseInt(range[2], 10) / 60;
    const eh = parseInt(range[3], 10) + parseInt(range[4], 10) / 60;
    if (eh <= sh) return null;
    return { start: sh, end: eh };
  }
  const single = trimmed.match(/^(\d{1,2})\s*:\s*(\d{2})$/);
  if (single) {
    const sh = parseInt(single[1], 10) + parseInt(single[2], 10) / 60;
    return { start: sh, end: sh + 1 / 60 };
  }
  return null;
}

/** 같은 시간대면 중요도 낮은 것을 먼저 그려 위에(나중에 그린) 높은 중요도가 올라오게 */
export function compareSchedulesForDisplay(a: ScheduleItem, b: ScheduleItem): number {
  const pa = parseTimeRange(a.time);
  const pb = parseTimeRange(b.time);
  if (!pa && !pb) return schedulePriority(a) - schedulePriority(b);
  if (!pa) return 1;
  if (!pb) return -1;
  if (pa.start !== pb.start) return pa.start - pb.start;
  if (pa.end !== pb.end) return pa.end - pb.end;
  return schedulePriority(a) - schedulePriority(b);
}

/** 표시용: 소수 시각 → HH:mm (분 단위 유지) */
function decimalHourToHM(dec: number): string {
  const totalMinutes = Math.round(dec * 60);
  const clamped = Math.max(0, Math.min(totalMinutes, 24 * 60));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 저장 문자열에서 구간을 직접 읽어 표시(부동소수 왕복 없이 분 보존) */
export function formatScheduleTimeDisplay(time: string): string {
  const trimmed = time.trim();
  const range = trimmed.match(/(\d{1,2})\s*:\s*(\d{2})\s*[~\-–]\s*(\d{1,2})\s*:\s*(\d{2})/);
  if (range) {
    const pad = (h: string, mm: string) =>
      `${String(Math.min(24, Math.max(0, parseInt(h, 10)))).padStart(2, "0")}:${mm}`;
    return `${pad(range[1], range[2])} ~ ${pad(range[3], range[4])}`;
  }
  const r = parseTimeRange(trimmed);
  if (!r) return trimmed;
  return `${decimalHourToHM(r.start)} ~ ${decimalHourToHM(r.end)}`;
}

/** type="time" 기본값: 저장 문자열에서 HH:mm (5글자) 추출 */
export function rangeToTimeInputDefaults(time: string): { start: string; end: string } | null {
  const trimmed = time.trim();
  const range = trimmed.match(/(\d{1,2})\s*:\s*(\d{2})\s*[~\-–]\s*(\d{1,2})\s*:\s*(\d{2})/);
  if (range) {
    const pad = (h: string, mm: string) =>
      `${String(Math.min(24, Math.max(0, parseInt(h, 10)))).padStart(2, "0")}:${mm}`;
    return { start: pad(range[1], range[2]), end: pad(range[3], range[4]) };
  }
  const r = parseTimeRange(trimmed);
  if (!r) return null;
  return { start: decimalHourToHM(r.start), end: decimalHourToHM(r.end) };
}

/** type=time 값(HH:mm 또는 HH:mm:ss)을 저장용 HH:mm 으로 통일 — 시·분 전체 유지 */
export function normalizeTimeInputToHM(s: string): string {
  const trimmed = s.trim();
  const m = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return trimmed;
  const h = Math.min(24, Math.max(0, parseInt(m[1], 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export function hmStringToDecimal(hm: string): number | null {
  const n = normalizeTimeInputToHM(hm);
  const m = n.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return parseInt(m[1], 10) + parseInt(m[2], 10) / 60;
}

export function schedulesOverlappingSlot(
  schedules: ScheduleItem[],
  slotStart: number,
  slotEnd: number
): ScheduleItem[] {
  return schedules.filter((s) => {
    const r = parseTimeRange(s.time);
    if (!r) return false;
    const a = Math.max(r.start, slotStart);
    const b = Math.min(r.end, slotEnd);
    return b > a;
  });
}

export function timelineBlockClasses(item: LayeredScheduleItem): string {
  const pr = schedulePriority(item);
  const isGoal = item.type === "goal";
  const baseWeekly = item.layer === "base";
  if (baseWeekly) {
    if (isGoal) {
      if (pr >= 3)
        return "border-emerald-500/80 border-dashed bg-emerald-200/90 text-emerald-950 opacity-70 ring-2 ring-emerald-400/50";
      if (pr >= 2)
        return "border-emerald-400/70 border-dashed bg-emerald-100 text-emerald-950 opacity-60 ring-emerald-500/30";
      return "border-emerald-400/70 border-dashed bg-emerald-100/80 text-emerald-950 opacity-55";
    }
    if (pr >= 3)
      return "border-stone-400/60 border-dashed bg-emerald-200/85 text-emerald-950 opacity-70 ring-2 ring-emerald-400/40";
    if (pr >= 2)
      return "border-stone-400/50 border-dashed bg-stone-200/90 text-stone-800 opacity-65 ring-stone-400/30";
    return "border-stone-300/80 border-dashed bg-stone-100/85 text-stone-700 opacity-55";
  }
  if (isGoal) {
    if (pr >= 3) return "border-emerald-300/90 bg-emerald-200 text-emerald-950 ring-2 ring-emerald-400/45";
    if (pr >= 2) return "border-emerald-300/80 bg-emerald-100 text-emerald-950 ring-1 ring-emerald-400/35";
    return "border-emerald-200/90 bg-emerald-100 text-emerald-950";
  }
  if (pr >= 3) return "border-emerald-200/90 bg-emerald-200 text-emerald-950 ring-2 ring-emerald-400/40";
  if (pr >= 2) return "border-stone-200/90 bg-stone-200/95 text-stone-800 ring-1 ring-stone-400/25";
  return "border-stone-200/90 bg-stone-100/90 text-stone-800";
}

export function listRowClasses(item: LayeredScheduleItem): string {
  const pr = schedulePriority(item);
  const isGoal = item.type === "goal";
  if (item.layer === "base") {
    if (isGoal) {
      if (pr >= 3)
        return "border-emerald-400/90 border-dashed bg-emerald-200/90 text-emerald-950 opacity-85 ring-2 ring-emerald-400/40";
      if (pr >= 2)
        return "border-emerald-300/80 border-dashed bg-emerald-100 text-emerald-900 opacity-85 ring-1 ring-emerald-400/30";
      return "border-emerald-300/80 border-dashed bg-emerald-50 text-emerald-900 opacity-80";
    }
    if (pr >= 3)
      return "border-emerald-300/70 border-dashed bg-emerald-200/80 text-emerald-950 opacity-85 ring-2 ring-emerald-400/35";
    if (pr >= 2)
      return "border-stone-300/80 border-dashed bg-stone-200 text-stone-800 opacity-85";
    return "border-stone-300/80 border-dashed bg-stone-100 text-stone-700 opacity-80";
  }
  if (isGoal) {
    if (pr >= 3) return "border-emerald-300/90 bg-emerald-200 text-emerald-950 ring-2 ring-emerald-400/40";
    if (pr >= 2) return "border-emerald-200/90 bg-emerald-100 text-emerald-950 ring-1 ring-emerald-300/50";
    return "border-emerald-200/80 bg-emerald-100/90 text-emerald-950";
  }
  if (pr >= 3) return "border-emerald-200/80 bg-emerald-200 text-emerald-950 ring-2 ring-emerald-400/35";
  if (pr >= 2) return "border-stone-200/80 bg-stone-200/90 text-stone-800 ring-1 ring-stone-300/40";
  return "border-stone-200/80 bg-stone-100/80 text-stone-800";
}

export function minimapCellClasses(item: LayeredScheduleItem): string {
  const pr = schedulePriority(item);
  if (item.layer === "base") {
    if (item.type === "goal") {
      if (pr >= 3)
        return "border border-dashed border-emerald-500/50 bg-emerald-200/80 text-emerald-950 opacity-75 ring-emerald-500/25";
      if (pr >= 2)
        return "border border-dashed border-emerald-500/40 bg-emerald-100/80 text-emerald-950 opacity-65 ring-emerald-500/20";
      return "border border-dashed border-emerald-500/40 bg-emerald-200/60 text-emerald-950 opacity-60 ring-emerald-500/20";
    }
    if (pr >= 3)
      return "border border-dashed border-stone-400/50 bg-emerald-200/75 text-emerald-950 opacity-70 ring-stone-400/20";
    if (pr >= 2)
      return "border border-dashed border-stone-400/50 bg-stone-200/80 text-stone-800 opacity-65 ring-stone-400/20";
    return "border border-dashed border-stone-400/50 bg-stone-200/70 text-stone-700 opacity-60 ring-stone-400/20";
  }
  if (item.type === "goal") {
    if (pr >= 3) return "bg-emerald-200 text-emerald-950 ring-2 ring-emerald-400/40";
    if (pr >= 2) return "bg-emerald-200/90 text-emerald-950 ring-1 ring-emerald-400/30";
    return "bg-emerald-300 text-emerald-950 ring-emerald-500/30";
  }
  if (pr >= 3) return "bg-emerald-200 text-emerald-950 ring-2 ring-emerald-400/35";
  if (pr >= 2) return "bg-stone-300 text-stone-800 ring-1 ring-stone-400/30";
  return "bg-stone-300 text-stone-800 ring-stone-400/25";
}

export function scheduleInstanceKey(item: Pick<LayeredScheduleItem, "id" | "layer">): string {
  return `${item.layer}:${item.id}`;
}

export function readWeeklyScheduleStore(): WeeklyScheduleStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(GANDHI_WEEKLY_SCHEDULE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as WeeklyScheduleStore;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

export function writeWeeklyScheduleStore(next: WeeklyScheduleStore) {
  localStorage.setItem(GANDHI_WEEKLY_SCHEDULE_KEY, JSON.stringify(next));
}

export function readBaseWeeklyScheduleStore(): BaseWeeklyScheduleStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(GANDHI_BASE_SCHEDULE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as BaseWeeklyScheduleStore;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

export function writeBaseWeeklyScheduleStore(next: BaseWeeklyScheduleStore) {
  localStorage.setItem(GANDHI_BASE_SCHEDULE_KEY, JSON.stringify(next));
}

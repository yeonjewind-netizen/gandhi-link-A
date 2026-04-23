import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type SetStateAction } from "react";
import { subDays } from "date-fns";
import { createDefaultBig3 } from "./big3";
import {
  ALARM_SOUND_URL,
  DEFAULT_MONTHLY_VISION,
  DEFAULT_WEEKLY_GOALS,
  PLANNER_STORAGE_KEY,
  WEEK_DAY_KEYS,
} from "./constants";
import { daysBetweenDateKeys, formatDateKey, formatPlannerDateKey, getWeekDayKey, isValidYMD, startOfWeekMonday } from "./dateUtils";
import { computeBig3DailyEp, dailyEpToHeatPercent, getPlantStageFromDailyEp } from "./epCalendarUtils";
import { updateReflection, updateShared, useGandhiStore } from "./hooks/useGandhiStore";
import { GrowthLogChart } from "./components/GrowthLogChart";
import { PlannerDayTab } from "./PlannerDayTab";
import { PlannerMissionModal } from "./PlannerMissionModal";
import { PlannerMonthTab } from "./PlannerMonthTab";
import { PlannerWeekTab } from "./PlannerWeekTab";
import {
  hmStringToDecimal,
  normalizeTimeInputToHM,
  parsePriorityFromFormData,
  readBaseWeeklyScheduleStore,
  readWeeklyScheduleStore,
  rangeToTimeInputDefaults,
  scheduleInstanceKey,
  schedulePriority,
  writeBaseWeeklyScheduleStore,
  writeWeeklyScheduleStore,
} from "./scheduleUtils";
import {
  getPlannerState,
  getScheduleCheckedStore,
  saveScheduleCheckedStore,
} from "./storage";
import type {
  BaseWeeklyScheduleStore,
  BigGoal,
  LayeredScheduleItem,
  MissionStage,
  ScheduleCheckedStore,
  ScheduleItem,
  SchedulePriority,
  ViewMode,
  WeekDayKey,
  WeeklyScheduleStore,
} from "./types";

export default function PlannerPage() {
  const today = new Date();
  const todayKey = formatDateKey(today);
  const { shared, dailyEpMap, reflectionMap } = useGandhiStore();

  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [monthlyVision, setMonthlyVision] = useState(() => {
    const saved = getPlannerState();
    return typeof saved?.monthlyVision === "string" ? saved.monthlyVision : DEFAULT_MONTHLY_VISION;
  });
  const [weeklyGoals] = useState<Record<string, string>>(() => {
    const saved = getPlannerState();
    return saved?.weeklyGoals ? { ...DEFAULT_WEEKLY_GOALS, ...saved.weeklyGoals } : DEFAULT_WEEKLY_GOALS;
  });
  const [monthlyGoalDeadline, setMonthlyGoalDeadline] = useState(() => {
    const saved = getPlannerState();
    return typeof saved?.monthlyGoalDeadline === "string" ? saved.monthlyGoalDeadline : "";
  });
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(today);
  const [selectedDayMemo, setSelectedDayMemo] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(formatPlannerDateKey(today)) ?? "";
  });
  const [missionEnabled, setMissionEnabled] = useState(true);
  const [missionTime, setMissionTime] = useState("06:30");
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [missionStage, setMissionStage] = useState<MissionStage>("alarm");
  const [missionBigThree, setMissionBigThree] = useState<string[]>(["", "", ""]);
  const [snoozeDeadlineMs, setSnoozeDeadlineMs] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(60);
  const lastTriggeredMinuteRef = useRef<string>("");
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);

  const todayBig3: BigGoal[] = shared.byDate[todayKey]?.big3 ?? createDefaultBig3();

  const nearestDdayBanner = useMemo(() => {
    const td = monthlyGoalDeadline.trim();
    if (!isValidYMD(td)) return null;
    const days = daysBetweenDateKeys(todayKey, td);
    if (days === null) return null;
    const name = monthlyVision.trim() || "월간 목표";
    const label = days === 0 ? "D-Day" : days > 0 ? `D-${days}` : `D+${-days}`;
    return `🔥 ${name}까지 ${label}`;
  }, [monthlyVision, monthlyGoalDeadline, todayKey]);

  const todayEpTotal = useMemo(() => {
    const stored = dailyEpMap[todayKey];
    if (stored != null && Number.isFinite(Number(stored))) {
      return Math.max(0, Number(stored));
    }
    return computeBig3DailyEp(todayBig3);
  }, [todayKey, todayBig3, dailyEpMap]);
  const growthEnergyPercent = useMemo(() => {
    const totalSubtasks = todayBig3.reduce(
      (sum, goal) => sum + goal.subTasks.filter((task) => task.text.trim().length > 0).length,
      0
    );
    if (totalSubtasks <= 0) return 0;
    const doneSubtasks = todayBig3.reduce(
      (sum, goal) => sum + goal.subTasks.filter((task) => task.text.trim().length > 0 && task.isDone).length,
      0
    );
    return Math.round((doneSubtasks / totalSubtasks) * 100);
  }, [todayBig3]);
  const recentGrowthLog = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = subDays(new Date(), 6 - index);
      const dateKey = formatDateKey(date);
      const goals = shared.byDate[dateKey]?.big3 ?? [];
      const total = goals.reduce((sum, goal) => sum + goal.subTasks.filter((task) => task.text.trim().length > 0).length, 0);
      const completed = goals.reduce(
        (sum, goal) => sum + goal.subTasks.filter((task) => task.text.trim().length > 0 && task.isDone).length,
        0
      );
      return { dateKey, total, completed };
    });
  }, [shared]);

  const [selectedWeekDate, setSelectedWeekDate] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  });
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleStore>(() => readWeeklyScheduleStore());
  const [baseWeeklySchedule, setBaseWeeklySchedule] = useState<BaseWeeklyScheduleStore>(() =>
    readBaseWeeklyScheduleStore()
  );
  const [scheduleCheckedStore, setScheduleCheckedStore] = useState<ScheduleCheckedStore>(() => getScheduleCheckedStore());
  const [scheduleFormBump, setScheduleFormBump] = useState(0);
  const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [isMasterMode, setIsMasterMode] = useState(false);
  const [masterSelectedDays, setMasterSelectedDays] = useState<WeekDayKey[]>([]);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const scheduleFormRef = useRef<HTMLDivElement | null>(null);

  const weekStripDays = useMemo(() => {
    const [y, m, d] = todayKey.split("-").map(Number);
    const baseDate = new Date(y, m - 1, d);
    const mono = startOfWeekMonday(baseDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mono);
      d.setDate(mono.getDate() + i);
      return d;
    });
  }, [todayKey]);

  const selectedDayKey = useMemo(() => formatDateKey(selectedWeekDate), [selectedWeekDate]);
  const selectedWeekDayKey = useMemo(() => getWeekDayKey(selectedWeekDate), [selectedWeekDate]);

  const weeklySchedulesForSelectedDay = useMemo(() => {
    return weeklySchedule[selectedDayKey]?.schedules ?? [];
  }, [weeklySchedule, selectedDayKey]);

  const baseSchedulesForSelectedDay = useMemo(() => {
    return baseWeeklySchedule[selectedWeekDayKey]?.schedules ?? [];
  }, [baseWeeklySchedule, selectedWeekDayKey]);

  const schedulesForSelectedDay = useMemo<LayeredScheduleItem[]>(() => {
    const fixed = baseSchedulesForSelectedDay.map((item) => ({ ...item, layer: "base" as const }));
    const dynamic = weeklySchedulesForSelectedDay.map((item) => ({ ...item, layer: "weekly" as const }));
    return [...fixed, ...dynamic];
  }, [baseSchedulesForSelectedDay, weeklySchedulesForSelectedDay]);

  const scheduleFormDefaults = useMemo(() => {
    if (!editingScheduleId) return null;
    const w = weeklySchedulesForSelectedDay.find((s) => s.id === editingScheduleId);
    if (w) return { layer: "weekly" as const, item: w };
    const b = baseSchedulesForSelectedDay.find((s) => s.id === editingScheduleId);
    if (b) return { layer: "base" as const, item: b };
    return null;
  }, [editingScheduleId, weeklySchedulesForSelectedDay, baseSchedulesForSelectedDay]);

  const scheduleFormTimeDefaults = useMemo(() => {
    if (!scheduleFormDefaults) return { start: "", end: "" };
    return rangeToTimeInputDefaults(scheduleFormDefaults.item.time) ?? { start: "", end: "" };
  }, [scheduleFormDefaults]);

  const scheduleFormPriorityDefault = useMemo(() => {
    if (!editingScheduleId || !scheduleFormDefaults) return 1 as SchedulePriority;
    return schedulePriority(scheduleFormDefaults.item);
  }, [editingScheduleId, scheduleFormDefaults]);

  useEffect(() => {
    localStorage.setItem(
      PLANNER_STORAGE_KEY,
      JSON.stringify({
        monthlyVision,
        monthlyGoalDeadline,
        weeklyGoals,
      })
    );
  }, [monthlyVision, monthlyGoalDeadline, weeklyGoals]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      setWeeklySchedule(readWeeklyScheduleStore());
      setBaseWeeklySchedule(readBaseWeeklyScheduleStore());
      setScheduleCheckedStore(getScheduleCheckedStore());
    };
    window.addEventListener("focus", handler);
    window.addEventListener("storage", handler);
    window.addEventListener("growth-sync", handler);
    return () => {
      window.removeEventListener("focus", handler);
      window.removeEventListener("storage", handler);
      window.removeEventListener("growth-sync", handler);
    };
  }, []);

  const plantStage = useMemo(() => getPlantStageFromDailyEp(todayEpTotal), [todayEpTotal]);

  useEffect(() => {
    if (!editingScheduleId || !scheduleFormOpen) return;
    const t = window.setTimeout(() => {
      scheduleFormRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [editingScheduleId, scheduleFormOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(formatPlannerDateKey(selectedCalendarDate), selectedDayMemo);
  }, [selectedCalendarDate, selectedDayMemo]);

  const monthMeta = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - firstDay.getDay());
    const cells: Array<{ date: Date; inMonth: boolean; key: string; achievement: number; dailyEp: number }> = [];

    for (let i = 0; i < 42; i += 1) {
      const cellDate = new Date(start);
      cellDate.setDate(start.getDate() + i);
      const dateKey = formatDateKey(cellDate);
      const dailyEp = Math.max(0, Number(dailyEpMap[dateKey] ?? 0) || 0);
      const achievement = dailyEpToHeatPercent(dailyEp);
      cells.push({
        date: cellDate,
        inMonth: cellDate.getMonth() === month,
        key: dateKey,
        achievement,
        dailyEp,
      });
    }

    return {
      title: firstDay.toLocaleDateString("ko-KR", { year: "numeric", month: "long" }),
      cells,
      todayKey,
      selectedKey: formatDateKey(selectedCalendarDate),
    };
  }, [selectedDate, selectedCalendarDate, todayKey, dailyEpMap]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const audio = new Audio(ALARM_SOUND_URL);
    audio.loop = true;
    alarmAudioRef.current = audio;
    const unlockAudio = () => {
      const target = alarmAudioRef.current;
      if (!target) return;
      target.volume = 0;
      void target.play().then(() => {
        target.pause();
        target.currentTime = 0;
        target.volume = 0.8;
      });
      window.removeEventListener("pointerdown", unlockAudio);
    };
    window.addEventListener("pointerdown", unlockAudio);
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!missionEnabled || !missionTime || isMissionModalOpen) return;
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const currentTime = `${hh}:${mm}`;
      const minuteKey = `${formatDateKey(now)}-${currentTime}`;
      if (currentTime === missionTime && lastTriggeredMinuteRef.current !== minuteKey) {
        lastTriggeredMinuteRef.current = minuteKey;
        setMissionStage("alarm");
        setSnoozeDeadlineMs(null);
        setRemainingSeconds(60);
        setMissionBigThree([todayBig3[0]?.title ?? "", todayBig3[1]?.title ?? "", todayBig3[2]?.title ?? ""]);
        setIsMissionModalOpen(true);
        void alarmAudioRef.current?.play().catch(() => {});
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [missionEnabled, missionTime, isMissionModalOpen, todayBig3]);

  useEffect(() => {
    if (!isMissionModalOpen || missionStage !== "mission" || !snoozeDeadlineMs) return;
    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((snoozeDeadlineMs - Date.now()) / 1000));
      setRemainingSeconds(left);
      if (left === 0) {
        setMissionStage("alarm");
        setSnoozeDeadlineMs(null);
        setRemainingSeconds(60);
        void alarmAudioRef.current?.play().catch(() => {});
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isMissionModalOpen, missionStage, snoozeDeadlineMs]);

  function stopAlarm() {
    const audio = alarmAudioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }

  function applyMissionBigThree() {
    updateShared((prev) => {
      const current = prev.byDate[todayKey]?.big3 ?? createDefaultBig3();
      const updated = current.map((goal, i) => ({ ...goal, title: (missionBigThree[i] ?? "").trim() }));
      return {
        ...prev,
        byDate: { ...prev.byDate, [todayKey]: { big3: updated } },
      };
    });
  }

  const missionCompleted = missionBigThree.every((t) => t.trim().length > 0);

  const handleScheduleFormSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const title = String(fd.get("title") ?? "").trim();
      const timeStart = String(fd.get("timeStart") ?? "").trim();
      const timeEnd = String(fd.get("timeEnd") ?? "").trim();
      const typeRaw = String(fd.get("type") ?? "routine");
      const priority = parsePriorityFromFormData(fd);
      if (!title || !timeStart || !timeEnd) return;
      const ts = normalizeTimeInputToHM(timeStart);
      const te = normalizeTimeInputToHM(timeEnd);
      const startDec = hmStringToDecimal(ts);
      const endDec = hmStringToDecimal(te);
      if (startDec == null || endDec == null || endDec <= startDec) return;
      const time = `${ts} ~ ${te}`;
      const type: ScheduleItem["type"] = typeRaw === "goal" ? "goal" : "routine";

      if (editingScheduleId) {
        const id = editingScheduleId;
        const weeklyList = weeklySchedule[selectedDayKey]?.schedules ?? [];
        const inWeekly = weeklyList.some((s) => s.id === id);

        if (inWeekly) {
          const next: WeeklyScheduleStore = { ...weeklySchedule };
          const bundle = next[selectedDayKey] ?? { schedules: [] };
          next[selectedDayKey] = {
            schedules: bundle.schedules.map((s) => (s.id === id ? { ...s, title, time, type, priority } : s)),
          };
          setWeeklySchedule(next);
          writeWeeklyScheduleStore(next);
        } else {
          const nextBase: BaseWeeklyScheduleStore = { ...baseWeeklySchedule };
          let found = false;
          for (const dk of WEEK_DAY_KEYS) {
            const list = nextBase[dk]?.schedules ?? [];
            if (!list.some((s) => s.id === id)) continue;
            found = true;
            nextBase[dk] = {
              schedules: list.map((s) => (s.id === id ? { ...s, title, time, type, priority } : s)),
            };
            break;
          }
          if (found) {
            setBaseWeeklySchedule(nextBase);
            writeBaseWeeklyScheduleStore(nextBase);
          }
        }

        setEditingScheduleId(null);
        e.currentTarget.reset();
        setMasterSelectedDays([]);
        setScheduleFormBump((b) => b + 1);
        window.dispatchEvent(new Event("growth-sync"));
        return;
      }

      const newItem: ScheduleItem = {
        id: `sched-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        time,
        type,
        priority,
      };
      if (isMasterMode) {
        const nextBase = { ...baseWeeklySchedule };
        if (masterSelectedDays.length === 0) return;
        for (const dayKey of masterSelectedDays) {
          const prevBase = nextBase[dayKey]?.schedules ?? [];
          nextBase[dayKey] = {
            schedules: [
              ...prevBase,
              {
                ...newItem,
                id: `sched-${dayKey}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              },
            ],
          };
        }
        setBaseWeeklySchedule(nextBase);
        writeBaseWeeklyScheduleStore(nextBase);
      } else {
        const next = { ...weeklySchedule };
        const prev = next[selectedDayKey]?.schedules ?? [];
        next[selectedDayKey] = { schedules: [...prev, newItem] };
        setWeeklySchedule(next);
        writeWeeklyScheduleStore(next);
      }
      e.currentTarget.reset();
      if (isMasterMode) setMasterSelectedDays([]);
      setScheduleFormBump((b) => b + 1);
      window.dispatchEvent(new Event("growth-sync"));
    },
    [
      editingScheduleId,
      weeklySchedule,
      selectedDayKey,
      baseWeeklySchedule,
      isMasterMode,
      masterSelectedDays,
    ]
  );

  const scheduleFormForFields = scheduleFormDefaults ? { item: scheduleFormDefaults.item } : null;
  const scheduleFormKey = `sched-${selectedDayKey}-${scheduleFormBump}-${editingScheduleId ?? "new"}`;
  const scheduleCheckedForSelectedDay = scheduleCheckedStore[selectedDayKey] ?? {};

  const onSetIsMasterMode = useCallback((next: SetStateAction<boolean>) => {
    setIsMasterMode((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      if (!resolved) {
        setMasterSelectedDays([]);
      }
      return resolved;
    });
  }, []);

  const onSetSelectedWeekDate = useCallback((nextDate: Date) => {
    setSelectedWeekDate(nextDate);
    setEditingScheduleId(null);
  }, []);

  const onSetSelectedCalendarDate = useCallback((nextDate: Date) => {
    setSelectedCalendarDate(nextDate);
    if (typeof window === "undefined") {
      setSelectedDayMemo("");
      return;
    }
    const key = formatPlannerDateKey(nextDate);
    setSelectedDayMemo(localStorage.getItem(key) ?? "");
  }, []);

  const onUpdateGoalTitle = useCallback(
    (goalIndex: number, title: string) => {
      updateShared((prev) => {
        const current = prev.byDate[todayKey]?.big3 ?? createDefaultBig3();
        return {
          ...prev,
          byDate: {
            ...prev.byDate,
            [todayKey]: {
              big3: current.map((item, index) => (index === goalIndex ? { ...item, title } : item)),
            },
          },
        };
      });
    },
    [todayKey]
  );

  const onAppendSubtask = useCallback(
    (goalIndex: number, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      updateShared((prev) => {
        const current = prev.byDate[todayKey]?.big3 ?? createDefaultBig3();
        return {
          ...prev,
          byDate: {
            ...prev.byDate,
            [todayKey]: {
              big3: current.map((goal, index) =>
                index === goalIndex
                  ? {
                      ...goal,
                      subTasks: [...goal.subTasks, { id: Date.now(), text: trimmed, isDone: false }],
                    }
                  : goal
              ),
            },
          },
        };
      });
    },
    [todayKey]
  );

  const onToggleSubtask = useCallback(
    (goalIndex: number, subtaskId: string | number) => {
      updateShared((prev) => {
        const current = prev.byDate[todayKey]?.big3 ?? createDefaultBig3();
        return {
          ...prev,
          byDate: {
            ...prev.byDate,
            [todayKey]: {
              big3: current.map((goal, index) =>
                index === goalIndex
                  ? {
                      ...goal,
                      subTasks: goal.subTasks.map((task) =>
                        task.id === subtaskId ? { ...task, isDone: !task.isDone } : task
                      ),
                    }
                  : goal
              ),
            },
          },
        };
      });
    },
    [todayKey]
  );

  const onDeleteSubtask = useCallback(
    (goalIndex: number, subtaskId: string | number) => {
      updateShared((prev) => {
        const current = prev.byDate[todayKey]?.big3 ?? createDefaultBig3();
        return {
          ...prev,
          byDate: {
            ...prev.byDate,
            [todayKey]: {
              big3: current.map((goal, index) =>
                index === goalIndex ? { ...goal, subTasks: goal.subTasks.filter((task) => task.id !== subtaskId) } : goal
              ),
            },
          },
        };
      });
    },
    [todayKey]
  );
  const onUpsertChunkingSubtask = useCallback(
    (goalIndex: number, slotIndex: number, text: string) => {
      updateShared((prev) => {
        const current = prev.byDate[todayKey]?.big3 ?? createDefaultBig3();
        return {
          ...prev,
          byDate: {
            ...prev.byDate,
            [todayKey]: {
              big3: current.map((goal, index) => {
                if (index !== goalIndex) return goal;
                const nextSubtasks = [...goal.subTasks];
                if (nextSubtasks[slotIndex]) {
                  nextSubtasks[slotIndex] = { ...nextSubtasks[slotIndex], text };
                } else {
                  nextSubtasks[slotIndex] = {
                    id: `chunk-${Date.now()}-${slotIndex}`,
                    text,
                    isDone: false,
                  };
                }
                return { ...goal, subTasks: nextSubtasks };
              }),
            },
          },
        };
      });
    },
    [todayKey]
  );

  const onToggleScheduleChecked = useCallback(
    (item: LayeredScheduleItem, nextChecked: boolean) => {
      const itemKey = scheduleInstanceKey(item);
      const nextStore: ScheduleCheckedStore = { ...scheduleCheckedStore };
      const dayMap = { ...(nextStore[selectedDayKey] ?? {}) };
      dayMap[itemKey] = nextChecked;
      nextStore[selectedDayKey] = dayMap;
      setScheduleCheckedStore(nextStore);
      saveScheduleCheckedStore(nextStore);
    },
    [scheduleCheckedStore, selectedDayKey]
  );

  return (
    <section className="mb-6 rounded-3xl bg-white/85 p-7 shadow-sm ring-1 ring-stone-200/60 sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm tracking-wide text-stone-500">Planner</p>
          <h2 className="font-display text-xl font-semibold text-stone-800">My Growth Planner</h2>
        </div>
        <div className="rounded-2xl bg-sage-light px-4 py-3 text-center">
          <p className="text-xs text-sage-deep">오늘 EP</p>
          <p className="text-lg font-semibold text-sage-deep">{todayEpTotal}</p>
        </div>
      </div>
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs text-stone-500">오늘의 성장 에너지</p>
          <p className="text-xs font-semibold text-sage-deep">{growthEnergyPercent}%</p>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-sage-light/40 shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sage-deep via-emerald-500/85 to-sage-light transition-[width] duration-500 ease-out"
            style={{ width: `${growthEnergyPercent}%` }}
          />
        </div>
      </div>
      <div className="mb-6 rounded-2xl border border-sage-light/70 bg-sage-light/30 px-4 py-3">
        <p className="text-xs font-semibold text-sage-deep">오늘의 기획 팁</p>
        <p className="mt-1 text-sm leading-relaxed text-stone-700">
          큰 목표가 막막하다면 3개의 작은 단계로 쪼개보세요. 작게 시작하는 것이 위대한 성장의 첫걸음입니다.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl bg-cream/70 p-2">
        {(["month", "week", "day"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            className={`rounded-xl px-3 py-2 text-sm font-medium capitalize transition ${
              viewMode === mode ? "bg-stone-800 text-white" : "text-stone-600 hover:bg-white/80"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {nearestDdayBanner ? (
        <div className="sticky top-0 z-20 mb-4 rounded-2xl border border-emerald-200/80 bg-emerald-100/95 px-4 py-2.5 text-center text-sm font-semibold text-emerald-950 shadow-sm backdrop-blur-sm">
          {nearestDdayBanner}
        </div>
      ) : null}

      {viewMode === "month" && (
        <PlannerMonthTab
          monthlyVision={monthlyVision}
          setMonthlyVision={setMonthlyVision}
          monthlyGoalDeadline={monthlyGoalDeadline}
          setMonthlyGoalDeadline={setMonthlyGoalDeadline}
          plantStage={plantStage}
          todayEpTotal={todayEpTotal}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          monthMeta={monthMeta}
          setSelectedCalendarDate={onSetSelectedCalendarDate}
          selectedDayMemo={selectedDayMemo}
          setSelectedDayMemo={setSelectedDayMemo}
        />
      )}

      {viewMode === "week" && (
        <PlannerWeekTab
          isMasterMode={isMasterMode}
          setIsMasterMode={onSetIsMasterMode}
          todayKey={todayKey}
          weekStripDays={weekStripDays}
          selectedWeekDate={selectedWeekDate}
          setSelectedWeekDate={onSetSelectedWeekDate}
          baseWeeklySchedule={baseWeeklySchedule}
          setBaseWeeklySchedule={setBaseWeeklySchedule}
          weeklySchedule={weeklySchedule}
          setWeeklySchedule={setWeeklySchedule}
          schedulesForSelectedDay={schedulesForSelectedDay}
          selectedDayKey={selectedDayKey}
          selectedWeekDayKey={selectedWeekDayKey}
          editingScheduleId={editingScheduleId}
          setEditingScheduleId={setEditingScheduleId}
          setScheduleFormOpen={setScheduleFormOpen}
          setScheduleFormBump={setScheduleFormBump}
          scheduleFormRef={scheduleFormRef}
          scheduleFormOpen={scheduleFormOpen}
          scheduleFormKey={scheduleFormKey}
          onScheduleFormSubmit={handleScheduleFormSubmit}
          scheduleFormDefaults={scheduleFormForFields}
          scheduleFormTimeDefaults={scheduleFormTimeDefaults}
          scheduleFormPriorityDefault={scheduleFormPriorityDefault}
          masterSelectedDays={masterSelectedDays}
          setMasterSelectedDays={setMasterSelectedDays}
          scheduleCheckedForSelectedDay={scheduleCheckedForSelectedDay}
          onToggleScheduleChecked={onToggleScheduleChecked}
        />
      )}

      {viewMode === "day" && (
        <PlannerDayTab
          todayBig3={todayBig3}
          onUpdateGoalTitle={onUpdateGoalTitle}
          onAppendSubtask={onAppendSubtask}
          onToggleSubtask={onToggleSubtask}
          onDeleteSubtask={onDeleteSubtask}
          onUpsertChunkingSubtask={onUpsertChunkingSubtask}
          missionEnabled={missionEnabled}
          setMissionEnabled={setMissionEnabled}
          missionTime={missionTime}
          setMissionTime={setMissionTime}
        />
      )}

      <div className="mt-6">
        <GrowthLogChart title="최근 7일 실행 발자국" items={recentGrowthLog} />
      </div>

      <div className="mt-6 rounded-2xl border border-sage-light/70 bg-sage-light/20 p-4">
        <p className="text-sm font-semibold text-sage-deep">오늘의 성찰과 연대</p>
        <p className="mt-1 text-xs text-stone-500">
          오늘 마주한 한계는 무엇이었나요? 누구와 마음을 나누었나요?
        </p>
        <textarea
          value={reflectionMap[todayKey] ?? ""}
          onChange={(event) => updateReflection(todayKey, event.target.value)}
          rows={4}
          className="mt-3 w-full rounded-xl border border-sage-light bg-white px-3 py-2 text-sm text-stone-700 placeholder:text-stone-400"
          placeholder="짧게라도 괜찮아요. 오늘의 마음을 남겨보세요."
        />
      </div>

      <PlannerMissionModal
        isOpen={isMissionModalOpen}
        missionStage={missionStage}
        missionBigThree={missionBigThree}
        setMissionBigThree={setMissionBigThree}
        remainingSeconds={remainingSeconds}
        missionCompleted={missionCompleted}
        onAlarmDismiss={() => {
          stopAlarm();
          setMissionStage("mission");
          setSnoozeDeadlineMs(Date.now() + 60 * 1000);
          setRemainingSeconds(60);
        }}
        onRefreshCountdown={() => {
          setSnoozeDeadlineMs(Date.now() + 60 * 1000);
          setRemainingSeconds(60);
        }}
        onComplete={() => {
          if (!missionCompleted) return;
          applyMissionBigThree();
          stopAlarm();
          setSnoozeDeadlineMs(null);
          setIsMissionModalOpen(false);
        }}
      />
    </section>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { differenceInCalendarDays, subDays } from "date-fns";
import PlannerPage from "../PlannerPage";
import { setDailyBonusForDate, setDailyEpForDate, updateDailyRoutines, updateShared, useGandhiStore } from "../hooks/useGandhiStore";
import { HOME_STORAGE_KEY, ROUTINE_EP_EACH } from "./constants";
import { ForestTab } from "./ForestTab";
import {
  computeBig3DailyEp,
  countBonusGoalsToday,
  getDateKey,
  getPlantStageFromDailyEp,
  normalizeBig3,
} from "./domain";
import { HomeTab } from "./HomeTab";
import type { BigGoal, DailyRoutine } from "./types";

const STREAK_COUNT_KEY = "streakCount";
const LAST_COMPLETED_DATE_KEY = "lastCompletedDate";
const TOTAL_POINTS_KEY = "totalPoints";
const NOTIFICATION_ENABLED_KEY = "isNotificationEnabled";
const POINTS_PER_COMPLETED_SUBTASK = 100;

type StreakState = {
  count: number;
  lastCompletedDate: string;
};

const CELEBRATION_SPARKS = [
  { left: "12%", top: "18%", delay: "0ms" },
  { left: "24%", top: "30%", delay: "120ms" },
  { left: "40%", top: "16%", delay: "220ms" },
  { left: "58%", top: "28%", delay: "80ms" },
  { left: "73%", top: "17%", delay: "180ms" },
  { left: "86%", top: "34%", delay: "280ms" },
] as const;

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isContinuingStreak(lastCompletedDate: string, todayKey: string) {
  if (!lastCompletedDate) return false;
  const dayGap = differenceInCalendarDays(parseDateKey(todayKey), parseDateKey(lastCompletedDate));
  return dayGap === 0 || dayGap === 1;
}

function readStreakState(todayKey: string): StreakState {
  if (typeof window === "undefined") return { count: 0, lastCompletedDate: "" };
  const storedCount = localStorage.getItem(STREAK_COUNT_KEY);
  const storedDate = localStorage.getItem(LAST_COMPLETED_DATE_KEY);
  const count = Math.max(0, Number(storedCount ?? 0) || 0);
  const lastCompletedDate = storedDate ?? "";
  const next = {
    count: isContinuingStreak(lastCompletedDate, todayKey) ? count : 0,
    lastCompletedDate: isContinuingStreak(lastCompletedDate, todayKey) ? lastCompletedDate : "",
  };
  localStorage.setItem(STREAK_COUNT_KEY, String(next.count));
  localStorage.setItem(LAST_COMPLETED_DATE_KEY, next.lastCompletedDate);
  return next;
}

function writeStreakState(next: StreakState) {
  localStorage.setItem(STREAK_COUNT_KEY, String(next.count));
  localStorage.setItem(LAST_COMPLETED_DATE_KEY, next.lastCompletedDate);
}

function readTotalPoints() {
  if (typeof window === "undefined") return 0;
  return Math.max(0, Number(localStorage.getItem(TOTAL_POINTS_KEY) ?? 0) || 0);
}

function writeTotalPoints(nextTotalPoints: number) {
  localStorage.setItem(TOTAL_POINTS_KEY, String(Math.max(0, nextTotalPoints)));
}

function readNotificationEnabled() {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  return localStorage.getItem(NOTIFICATION_ENABLED_KEY) === "true" && Notification.permission === "granted";
}

function countCompletedSubtasks(goals: BigGoal[]) {
  return goals.reduce(
    (sum, goal) => sum + goal.subTasks.filter((task) => task.text.trim().length > 0 && task.isDone).length,
    0
  );
}

export default function App() {
  const todayKey = getDateKey();
  const { shared, dailyRoutines, dailyEpMap } = useGandhiStore();
  const [activeTab, setActiveTab] = useState<"home" | "planner" | "forest">(() => {
    if (typeof window === "undefined") return "home";
    try {
      const raw = localStorage.getItem(HOME_STORAGE_KEY);
      if (!raw) return "home";
      const savedTab = JSON.parse(raw).activeTab;
      return savedTab === "planner" || savedTab === "forest" ? savedTab : "home";
    } catch {
      return "home";
    }
  });
  const [showDayCloseModal, setShowDayCloseModal] = useState(false);
  const [streak, setStreak] = useState<StreakState>(() => readStreakState(todayKey));
  const [totalPoints, setTotalPoints] = useState(() => readTotalPoints());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(() => readNotificationEnabled());
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return "default";
    return Notification.permission;
  });
  const [showGrowthCelebration, setShowGrowthCelebration] = useState(false);
  const [celebrationStreakCount, setCelebrationStreakCount] = useState(streak.count);
  const isAwardingStreakRef = useRef(false);
  const completedTodayRef = useRef(streak.lastCompletedDate === todayKey);

  useEffect(() => {
    localStorage.setItem(HOME_STORAGE_KEY, JSON.stringify({ activeTab }));
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem(NOTIFICATION_ENABLED_KEY, String(isNotificationEnabled));
  }, [isNotificationEnabled]);

  const big3 = normalizeBig3(shared.byDate[todayKey]?.big3);
  const big3Ep = useMemo(() => computeBig3DailyEp(big3), [big3]);
  const routineEpTotal = useMemo(
    () => dailyRoutines.filter((r) => r.isDone).length * ROUTINE_EP_EACH,
    [dailyRoutines]
  );
  const totalDailyEp = useMemo(() => big3Ep + routineEpTotal, [big3Ep, routineEpTotal]);
  const subtaskStats = useMemo(() => {
    const totalSubtasks = big3.reduce(
      (sum, goal) => sum + goal.subTasks.filter((task) => task.text.trim().length > 0).length,
      0
    );
    const doneSubtasks = big3.reduce(
      (sum, goal) => sum + goal.subTasks.filter((task) => task.text.trim().length > 0 && task.isDone).length,
      0
    );
    return { done: doneSubtasks, total: totalSubtasks };
  }, [big3]);
  const growthEnergyPercent = useMemo(() => {
    if (subtaskStats.total <= 0) return 0;
    return Math.round((subtaskStats.done / subtaskStats.total) * 100);
  }, [subtaskStats]);

  useEffect(() => {
    setDailyEpForDate(todayKey, totalDailyEp);
    setDailyBonusForDate(todayKey, countBonusGoalsToday(big3));
  }, [todayKey, totalDailyEp, big3]);

  const plantStage = useMemo(() => getPlantStageFromDailyEp(totalDailyEp), [totalDailyEp]);

  const lifetimeEpTotal = useMemo(
    () => Object.values(dailyEpMap).reduce((acc, value) => acc + (Number(value) || 0), 0),
    [dailyEpMap]
  );

  const hasGrowthTasks = useMemo(() => big3.some((g) => g.subTasks.length > 0), [big3]);
  const isStreakActive = useMemo(
    () => streak.count > 0 && isContinuingStreak(streak.lastCompletedDate, todayKey),
    [streak, todayKey]
  );
  const recentGrowthLog = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = subDays(new Date(), 6 - index);
      const dateKey = getDateKey(date);
      const goals = normalizeBig3(shared.byDate[dateKey]?.big3);
      const total = goals.reduce((sum, goal) => sum + goal.subTasks.filter((task) => task.text.trim().length > 0).length, 0);
      const completed = goals.reduce(
        (sum, goal) => sum + goal.subTasks.filter((task) => task.text.trim().length > 0 && task.isDone).length,
        0
      );
      return { dateKey, total, completed };
    });
  }, [shared]);

  function setTodayBig3(nextBig3: BigGoal[]) {
    const normalizedNextBig3 = normalizeBig3(nextBig3);
    const completedDelta = countCompletedSubtasks(normalizedNextBig3) - countCompletedSubtasks(big3);
    if (completedDelta > 0) {
      setTotalPoints((prev) => {
        const nextTotalPoints = prev + completedDelta * POINTS_PER_COMPLETED_SUBTASK;
        writeTotalPoints(nextTotalPoints);
        return nextTotalPoints;
      });
    }
    updateShared((prev) => ({
        ...prev,
        byDate: { ...prev.byDate, [todayKey]: { big3: normalizedNextBig3 } },
      }));
  }

  const appendSubtask = useCallback(
    (goalIndex: number, text: string) => {
      updateShared((prevGoals) => {
        const currentGoals = normalizeBig3(prevGoals.byDate[todayKey]?.big3);
        const updatedGoals = [...currentGoals];
        updatedGoals[goalIndex] = {
          ...updatedGoals[goalIndex],
          subTasks: [...updatedGoals[goalIndex].subTasks, { id: Date.now(), text, isDone: false }],
        };
        const nextState = {
          ...prevGoals,
          byDate: { ...prevGoals.byDate, [todayKey]: { big3: updatedGoals } },
        };
        return nextState;
      });
    },
    [todayKey]
  );

  const setDailyRoutinesState: Dispatch<SetStateAction<DailyRoutine[]>> = useCallback((next) => {
    updateDailyRoutines((prev) => (typeof next === "function" ? next(prev) : next));
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setIsNotificationEnabled(false);
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    setIsNotificationEnabled(permission === "granted");
  }, []);

  const sendTestNotification = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;
    const title = "🌳 간디 링크";
    const body = "오늘 하루도 잘 채워볼까요?";

    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: "/pwa-icon.svg",
        badge: "/pwa-icon-maskable.svg",
      });
      return;
    }

    new Notification(title, {
      body,
      icon: "/pwa-icon.svg",
    });
  }, []);

  const awardStreakForToday = useCallback(() => {
    if (typeof window === "undefined") return null;
    const latest = readStreakState(todayKey);
    if (latest.lastCompletedDate === todayKey) {
      completedTodayRef.current = true;
      return null;
    }

    const wasYesterday = latest.lastCompletedDate
      ? differenceInCalendarDays(parseDateKey(todayKey), parseDateKey(latest.lastCompletedDate)) === 1
      : false;
    const nextStreak = {
      count: wasYesterday ? latest.count + 1 : 1,
      lastCompletedDate: todayKey,
    };
    writeStreakState(nextStreak);
    completedTodayRef.current = true;
    return nextStreak;
  }, [todayKey]);

  useEffect(() => {
    const hasCompletedEverySubtask = subtaskStats.total > 0 && subtaskStats.done === subtaskStats.total;
    if (!hasCompletedEverySubtask) return;
    if (completedTodayRef.current) return;
    if (isAwardingStreakRef.current) return;

    const nextStreak = awardStreakForToday();
    if (!nextStreak) return;
    isAwardingStreakRef.current = true;
    const timer = window.setTimeout(() => {
      setStreak(nextStreak);
      setCelebrationStreakCount(nextStreak.count);
      setShowGrowthCelebration(true);
      isAwardingStreakRef.current = false;
    }, 0);
    return () => window.clearTimeout(timer);
  }, [awardStreakForToday, subtaskStats.done, subtaskStats.total]);

  return (
    <div className="min-h-dvh bg-[#FAF7F2] pb-28">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-10 pb-8 sm:px-8 sm:pt-12">
        <header className="sticky top-3 z-40 mb-5 flex items-center justify-between rounded-3xl border border-sage-light/70 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
          <div>
            <p className="text-xs font-medium text-stone-500">Gandhi Link</p>
            <p className="text-sm font-semibold text-stone-800">오늘도 작은 한 걸음</p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition ${
                isStreakActive ? "bg-orange-100 text-orange-600 shadow-sm" : "bg-stone-100 text-stone-400"
              }`}
              aria-label={`현재 연속 달성일 ${streak.count}일`}
            >
              <span className={`text-lg ${isStreakActive ? "drop-shadow-sm" : "grayscale"}`} aria-hidden>
                🔥
              </span>
              <span>{streak.count}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="rounded-2xl bg-stone-100 px-3 py-2 text-lg text-stone-500 transition hover:bg-sage-light/60 hover:text-sage-deep"
              aria-label="설정 열기"
            >
              ⚙️
            </button>
          </div>
        </header>
        {activeTab === "home" ? (
          <HomeTab
            totalDailyEp={totalDailyEp}
            plantStage={plantStage}
            lifetimeEpTotal={lifetimeEpTotal}
            epProgressPercent={growthEnergyPercent}
            onDayClose={() => setShowDayCloseModal(true)}
            big3={big3}
            setTodayBig3={setTodayBig3}
            appendSubtask={appendSubtask}
            dailyRoutines={dailyRoutines}
            setDailyRoutines={setDailyRoutinesState}
            showDayCloseModal={showDayCloseModal}
            setShowDayCloseModal={setShowDayCloseModal}
            hasGrowthTasks={hasGrowthTasks}
            recentGrowthLog={recentGrowthLog}
          />
        ) : activeTab === "planner" ? (
          <PlannerPage />
        ) : (
          <ForestTab growthEnergyPercent={growthEnergyPercent} streakCount={streak.count} totalPoints={totalPoints} />
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-stone-200/70 bg-[#FAF7F2]/95 px-6 py-4 backdrop-blur-md sm:px-10">
        <div className="mx-auto flex max-w-md justify-between gap-2">
          {[
            { icon: "⌂", label: "Home", value: "home" as const },
            { icon: "▦", label: "Planner", value: "planner" as const },
            { icon: "🌳", label: "Forest", value: "forest" as const },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setActiveTab(item.value)}
              className={`flex flex-1 flex-col items-center gap-2 rounded-2xl py-3 text-xs transition ${
                activeTab === item.value ? "text-sage-deep" : "text-stone-400 hover:text-stone-600"
              }`}
            >
              <span className="text-lg" aria-hidden>
                {item.icon}
              </span>
              <span className="font-medium tracking-wide">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-stone-900/35 p-6 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-3xl border border-sage-light/70 bg-[#FAF7F2] p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sage-deep">Settings</p>
                <h2 className="mt-1 text-xl font-bold text-stone-800">알림 설정</h2>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  앱 방문을 잊지 않도록 브라우저 시스템 알림을 켤 수 있어요.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="rounded-full bg-white px-3 py-1.5 text-sm text-stone-500 ring-1 ring-stone-200"
              >
                닫기
              </button>
            </div>

            {!("Notification" in window) ? (
              <p className="rounded-2xl bg-stone-100 px-4 py-3 text-sm text-stone-500">
                이 브라우저는 Web Notification API를 지원하지 않아요.
              </p>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => void requestNotificationPermission()}
                  className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isNotificationEnabled
                      ? "bg-sage-deep text-white"
                      : "bg-white text-sage-deep ring-1 ring-sage-light hover:bg-sage-light/40"
                  }`}
                >
                  {isNotificationEnabled ? "🔔 알림 켜짐" : "🔔 푸시 알림 켜기"}
                </button>

                <button
                  type="button"
                  disabled={!isNotificationEnabled || notificationPermission !== "granted"}
                  onClick={() => void sendTestNotification()}
                  className="w-full rounded-2xl bg-orange-100 px-4 py-3 text-sm font-semibold text-orange-700 transition enabled:hover:bg-orange-200 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  테스트 알림 보내기
                </button>

                <p className="text-center text-xs text-stone-500">
                  현재 권한 상태: <span className="font-semibold text-stone-700">{notificationPermission}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {showGrowthCelebration && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-sage-deep/45 px-6 backdrop-blur-sm">
          <div className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-sage-light/80 bg-[#FAF7F2] p-7 text-center shadow-2xl">
            {CELEBRATION_SPARKS.map((spark, index) => (
              <span
                key={`${spark.left}-${index}`}
                className="celebration-spark absolute h-3 w-3 rounded-full bg-orange-300"
                style={{ left: spark.left, top: spark.top, animationDelay: spark.delay }}
              />
            ))}
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-sage-light text-4xl shadow-inner">
              🎉
            </div>
            <p className="text-sm font-semibold text-sage-deep">100% 성장 에너지 달성</p>
            <h2 className="mt-2 text-2xl font-bold text-stone-800">축하합니다! 오늘도 성장했어요!</h2>
            <div className="streak-pop mx-auto mt-5 inline-flex items-center gap-2 rounded-2xl bg-orange-100 px-5 py-3 text-lg font-bold text-orange-600">
              <span aria-hidden>🔥</span>
              <span>{celebrationStreakCount}일 연속 성장</span>
            </div>
            <button
              type="button"
              onClick={() => setShowGrowthCelebration(false)}
              className="mt-6 w-full rounded-2xl bg-sage-deep py-3 text-sm font-semibold text-white transition hover:bg-sage-deep/90"
            >
              계속 성장하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

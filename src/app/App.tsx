import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { subDays } from "date-fns";
import PlannerPage from "../PlannerPage"; 
import { setDailyBonusForDate, setDailyEpForDate, updateDailyRoutines, updateShared, useGandhiStore } from "../hooks/useGandhiStore";
import { HOME_STORAGE_KEY, ROUTINE_EP_EACH } from "./constants";
import {
  computeBig3DailyEp,
  countBonusGoalsToday,
  getDateKey,
  getPlantStageFromDailyEp,
  normalizeBig3,
} from "./domain";
import { HomeTab } from "./HomeTab";
import type { BigGoal, DailyRoutine } from "./types";

export default function App() {
  const todayKey = getDateKey();
  const { shared, dailyRoutines, dailyEpMap } = useGandhiStore();
  const [activeTab, setActiveTab] = useState<"home" | "planner">(() => {
    if (typeof window === "undefined") return "home";
    try {
      const raw = localStorage.getItem(HOME_STORAGE_KEY);
      if (!raw) return "home";
      return JSON.parse(raw).activeTab === "planner" ? "planner" : "home";
    } catch {
      return "home";
    }
  });
  const [showDayCloseModal, setShowDayCloseModal] = useState(false);

  useEffect(() => {
    localStorage.setItem(HOME_STORAGE_KEY, JSON.stringify({ activeTab }));
  }, [activeTab]);

  const big3 = normalizeBig3(shared.byDate[todayKey]?.big3);
  const big3Ep = useMemo(() => computeBig3DailyEp(big3), [big3]);
  const routineEpTotal = useMemo(
    () => dailyRoutines.filter((r) => r.isDone).length * ROUTINE_EP_EACH,
    [dailyRoutines]
  );
  const totalDailyEp = useMemo(() => big3Ep + routineEpTotal, [big3Ep, routineEpTotal]);
  const growthEnergyPercent = useMemo(() => {
    const totalSubtasks = big3.reduce(
      (sum, goal) => sum + goal.subTasks.filter((task) => task.text.trim().length > 0).length,
      0
    );
    if (totalSubtasks <= 0) return 0;
    const doneSubtasks = big3.reduce(
      (sum, goal) => sum + goal.subTasks.filter((task) => task.text.trim().length > 0 && task.isDone).length,
      0
    );
    return Math.round((doneSubtasks / totalSubtasks) * 100);
  }, [big3]);

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
    updateShared((prev) => ({
        ...prev,
        byDate: { ...prev.byDate, [todayKey]: { big3: normalizeBig3(nextBig3) } },
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

  return (
    <div className="min-h-dvh bg-[#FAF7F2] pb-28">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-10 pb-8 sm:px-8 sm:pt-12">
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
        ) : (
          <PlannerPage />
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-stone-200/70 bg-[#FAF7F2]/95 px-6 py-4 backdrop-blur-md sm:px-10">
        <div className="mx-auto flex max-w-md justify-between gap-2">
          {[
            { icon: "⌂", label: "Home", value: "home" as const },
            { icon: "▦", label: "Planner", value: "planner" as const },
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
    </div>
  );
}

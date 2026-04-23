import type { Dispatch, SetStateAction } from "react";
import { GrowthLogChart } from "../components/GrowthLogChart";
import { Big3GrowthSection } from "./components/Big3GrowthSection";
import { DailyRoutineSection } from "./components/DailyRoutineSection";
import { DayCloseModal } from "./components/DayCloseModal";
import { HomeHeader } from "./components/HomeHeader";
import type { BigGoal, DailyRoutine } from "./types";

type PlantStage = { icon: string; label: string };
type GrowthLogItem = { dateKey: string; completed: number; total: number };

export type HomeTabProps = {
  totalDailyEp: number;
  plantStage: PlantStage;
  lifetimeEpTotal: number;
  epProgressPercent: number;
  onDayClose: () => void;
  big3: BigGoal[];
  setTodayBig3: (next: BigGoal[]) => void;
  appendSubtask: (goalIndex: number, text: string) => void;
  dailyRoutines: DailyRoutine[];
  setDailyRoutines: Dispatch<SetStateAction<DailyRoutine[]>>;
  showDayCloseModal: boolean;
  setShowDayCloseModal: (v: boolean) => void;
  hasGrowthTasks: boolean;
  recentGrowthLog: GrowthLogItem[];
};

export function HomeTab({
  totalDailyEp,
  plantStage,
  lifetimeEpTotal,
  epProgressPercent,
  onDayClose,
  big3,
  setTodayBig3,
  appendSubtask,
  dailyRoutines,
  setDailyRoutines,
  showDayCloseModal,
  setShowDayCloseModal,
  hasGrowthTasks,
  recentGrowthLog,
}: HomeTabProps) {
  return (
    <>
      <HomeHeader totalDailyEp={totalDailyEp} />
      <Big3GrowthSection
        plantStage={plantStage}
        lifetimeEpTotal={lifetimeEpTotal}
        epProgressPercent={epProgressPercent}
        totalDailyEp={totalDailyEp}
        onDayClose={onDayClose}
        big3={big3}
        setTodayBig3={setTodayBig3}
        appendSubtask={appendSubtask}
      />
      <DailyRoutineSection dailyRoutines={dailyRoutines} setDailyRoutines={setDailyRoutines} />
      <div className="mb-6">
        <GrowthLogChart items={recentGrowthLog} />
      </div>
      <DayCloseModal
        isOpen={showDayCloseModal}
        setIsOpen={setShowDayCloseModal}
        plantStage={plantStage}
        totalDailyEp={totalDailyEp}
        lifetimeEpTotal={lifetimeEpTotal}
        hasGrowthTasks={hasGrowthTasks}
      />
    </>
  );
}

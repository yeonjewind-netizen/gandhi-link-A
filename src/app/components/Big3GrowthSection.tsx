import { BigGoalCard } from "./BigGoalCard";
import { EnergyGauge } from "./EnergyGauge";
import { ROUTINE_EP_EACH } from "../constants";
import type { BigGoal } from "../types";

type PlantStage = { icon: string; label: string };

type Big3GrowthSectionProps = {
  plantStage: PlantStage;
  lifetimeEpTotal: number;
  epProgressPercent: number;
  totalDailyEp: number;
  onDayClose: () => void;
  big3: BigGoal[];
  setTodayBig3: (next: BigGoal[]) => void;
  appendSubtask: (goalIndex: number, text: string) => void;
};

export function Big3GrowthSection({
  plantStage,
  lifetimeEpTotal,
  epProgressPercent,
  totalDailyEp,
  onDayClose,
  big3,
  setTodayBig3,
  appendSubtask,
}: Big3GrowthSectionProps) {
  const hasAnyPlannedGoal = big3.some((goal) => goal.title.trim().length > 0 || goal.subTasks.length > 0);

  return (
    <section className="mb-6 rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-sage-light/60">
      <EnergyGauge
        plantStage={plantStage}
        lifetimeEpTotal={lifetimeEpTotal}
        epProgressPercent={epProgressPercent}
        onDayClose={onDayClose}
      />
      <p className="mb-4 text-xs leading-relaxed text-stone-500">
        성장 에너지는 완료된 소목표 비율로 계산돼요. 하단 데일리 루틴은 완료 시마다 +{ROUTINE_EP_EACH} EP가 더해져요.
      </p>

      {!hasAnyPlannedGoal && (
        <p className="mb-4 rounded-2xl bg-sage-light/30 px-4 py-3 text-sm text-sage-deep">
          아직 세워진 계획이 없어요. 플래너에서 첫 번째 성장을 기획해보세요!
        </p>
      )}

      <div className="space-y-4">
        {big3.map((goal, goalIndex) => (
          <BigGoalCard
            key={goal.id}
            goal={goal}
            goalIndex={goalIndex}
            allGoals={big3}
            setTodayBig3={setTodayBig3}
            appendSubtask={appendSubtask}
          />
        ))}
      </div>
      <p className="mt-4 text-right text-xs text-sage-deep">오늘 에너지: {totalDailyEp} EP</p>
    </section>
  );
}

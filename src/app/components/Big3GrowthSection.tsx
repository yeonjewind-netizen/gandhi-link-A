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
};

export function Big3GrowthSection({
  plantStage,
  lifetimeEpTotal,
  epProgressPercent,
  totalDailyEp,
  onDayClose,
  big3,
  setTodayBig3,
}: Big3GrowthSectionProps) {
  const hasAnyPlannedGoal = big3.some((goal) => goal.title.trim().length > 0 || goal.subTasks.length > 0);

  return (
    <section className="mb-6 rounded-[24px] bg-white/92 p-5 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.45)] sm:p-6">
      <EnergyGauge
        plantStage={plantStage}
        lifetimeEpTotal={lifetimeEpTotal}
        epProgressPercent={epProgressPercent}
        onDayClose={onDayClose}
      />
      <p className="mb-4 text-xs leading-relaxed text-stone-500">
        성장 에너지는 완료된 소목표 비율로 계산돼요. 각 카드(아침/점심/저녁)를 눌러 세부 미션을 확인해보세요.
        데일리 루틴은 완료 시마다 +{ROUTINE_EP_EACH} EP가 더해져요.
      </p>

      {!hasAnyPlannedGoal && (
        <p className="mb-4 rounded-2xl bg-sage-light/30 px-4 py-3 text-sm text-sage-deep shadow-[0_8px_20px_-16px_rgba(15,23,42,0.25)]">
          아직 세워진 아침/점심/저녁 목표가 없어요. 플래너에서 오늘 목표를 먼저 적어보세요!
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
          />
        ))}
      </div>
      <p className="mt-4 text-right text-xs text-sage-deep">오늘 에너지: {totalDailyEp} EP</p>
    </section>
  );
}

type PlantStage = { icon: string; label: string };

type DayCloseModalProps = {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  plantStage: PlantStage;
  totalDailyEp: number;
  lifetimeEpTotal: number;
  hasGrowthTasks: boolean;
};

export function DayCloseModal({
  isOpen,
  setIsOpen,
  plantStage,
  totalDailyEp,
  lifetimeEpTotal,
  hasGrowthTasks,
}: DayCloseModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-sage-deep/30 p-6 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-close-title"
    >
      <div className="w-full max-w-md rounded-3xl border border-sage-light/70 bg-[#FAF7F2] p-6 shadow-xl">
        <h3 id="day-close-title" className="text-center text-xl font-semibold text-stone-800">
          오늘도 수고했어요
        </h3>
        <div className="mt-4 flex justify-center text-5xl" aria-hidden>
          {plantStage.icon}
        </div>
        {hasGrowthTasks ? (
          <p className="mt-4 text-center text-sm leading-relaxed text-stone-600">
            오늘 당신이 모은 <span className="font-semibold text-sage-deep">{totalDailyEp} EP</span>가 나무를 이만큼 키웠어요.
            충분히 잘했습니다!
          </p>
        ) : (
          <p className="mt-4 text-center text-sm leading-relaxed text-stone-600">
            아직 오늘의 실행 목표가 비어 있어요. Planner에서 Big 3를 채우면, 작은 한 걸음도 에너지가 될 수 있어요.
          </p>
        )}
        <p className="mt-3 text-center text-xs text-stone-500">
          {plantStage.label} · 누적 에너지 {lifetimeEpTotal} EP
        </p>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="mt-6 w-full rounded-2xl bg-sage-deep py-3 text-sm font-medium text-white"
        >
          확인
        </button>
      </div>
    </div>
  );
}

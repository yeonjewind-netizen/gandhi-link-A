type PlantStage = { icon: string; label: string };

type EnergyGaugeProps = {
  plantStage: PlantStage;
  lifetimeEpTotal: number;
  epProgressPercent: number;
  onDayClose: () => void;
};

export function EnergyGauge({ plantStage, lifetimeEpTotal, epProgressPercent, onDayClose }: EnergyGaugeProps) {
  return (
    <>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-5xl leading-none" aria-hidden>
            {plantStage.icon}
          </span>
          <div>
            <h2 className="text-xl font-semibold text-sage-deep">Growth Zone</h2>
            <p className="mt-0.5 text-xs text-stone-500">
              {plantStage.label} · 누적 에너지 {lifetimeEpTotal} EP
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-sage-light/80 px-3 py-1 text-xs text-sage-deep ring-1 ring-sage-deep/10">
          성장 에너지 {epProgressPercent}%
        </span>
      </div>
      <div className="mb-5 h-3 overflow-hidden rounded-full bg-sage-light/40 shadow-inner" aria-label={`성장 에너지 ${epProgressPercent}%`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-sage-deep via-emerald-500/85 to-sage-light transition-[width] duration-500 ease-out"
          style={{ width: `${epProgressPercent}%` }}
        />
      </div>
      <button
        type="button"
        onClick={onDayClose}
        className="mb-5 w-full rounded-2xl border border-sage-deep/30 bg-sage-light/50 py-3 text-sm font-medium text-sage-deep transition hover:bg-sage-light"
      >
        오늘 하루 마감하기
      </button>
    </>
  );
}

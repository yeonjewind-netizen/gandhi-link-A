type GrowthLogItem = {
  dateKey: string;
  completed: number;
  total: number;
};

type GrowthLogChartProps = {
  title?: string;
  items: GrowthLogItem[];
};

export function GrowthLogChart({ title = "최근 7일 성장 로그", items }: GrowthLogChartProps) {
  return (
    <section className="rounded-3xl border border-sage-light/70 bg-white/90 p-5 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-sage-deep">{title}</h3>
        <p className="mt-1 text-xs text-stone-500">완료한 소목표의 비율이 점과 막대로 기록됩니다.</p>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {items.map((item) => {
          const percent = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;
          const dayLabel = item.dateKey.slice(5).replace("-", "/");
          return (
            <div key={item.dateKey} className="flex flex-col items-center gap-2">
              <div className="flex h-24 w-full items-end justify-center rounded-2xl bg-sage-light/20 p-1">
                <div className="w-full rounded-xl bg-sage-light/40">
                  <div
                    className="w-full rounded-xl bg-gradient-to-t from-sage-deep to-emerald-400/90 transition-all duration-500"
                    style={{ height: `${Math.max(percent, 6)}%` }}
                  />
                </div>
              </div>
              <div className={`h-2.5 w-2.5 rounded-full ${percent > 0 ? "bg-sage-deep" : "bg-sage-light/70"}`} />
              <p className="text-[10px] text-stone-500">{dayLabel}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

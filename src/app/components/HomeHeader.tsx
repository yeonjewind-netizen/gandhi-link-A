type HomeHeaderProps = {
  totalDailyEp: number;
};

export function HomeHeader({ totalDailyEp }: HomeHeaderProps) {
  return (
    <header className="mb-6">
      <div className="mb-5 rounded-2xl border border-sage-light/70 bg-gradient-to-br from-sage-light/45 to-cream/80 px-4 py-3 shadow-sm ring-1 ring-sage-light/60">
        <p className="text-xs font-medium text-stone-500">오늘의 총 획득 에너지</p>
        <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-sage-deep">{totalDailyEp} EP</p>
      </div>
      <p className="text-sm tracking-wide text-stone-500">Gandhi Link</p>
      <h1 className="mt-2 text-2xl font-semibold text-stone-800">오늘의 성장 실행 보드</h1>
    </header>
  );
}

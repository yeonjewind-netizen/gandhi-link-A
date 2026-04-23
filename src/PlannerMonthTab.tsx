import { CALENDAR_WEEKDAY_HEADERS } from "./constants";
import { DeferredTextArea } from "./DeferredInputs";
import { getCalendarPlantIcon, heatClassForCalendarCell } from "./epCalendarUtils";
import type { MonthMeta } from "./types";

type PlantStage = { icon: string; label: string };

export type PlannerMonthTabProps = {
  monthlyVision: string;
  setMonthlyVision: (v: string) => void;
  monthlyGoalDeadline: string;
  setMonthlyGoalDeadline: (v: string) => void;
  plantStage: PlantStage;
  todayEpTotal: number;
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  monthMeta: MonthMeta;
  setSelectedCalendarDate: (d: Date) => void;
  selectedDayMemo: string;
  setSelectedDayMemo: (v: string) => void;
};

export function PlannerMonthTab({
  monthlyVision,
  setMonthlyVision,
  monthlyGoalDeadline,
  setMonthlyGoalDeadline,
  plantStage,
  todayEpTotal,
  selectedDate,
  setSelectedDate,
  monthMeta,
  setSelectedCalendarDate,
  selectedDayMemo,
  setSelectedDayMemo,
}: PlannerMonthTabProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-100/90 bg-gradient-to-br from-emerald-50/90 to-cream/50 p-4 shadow-sm ring-1 ring-emerald-100/60">
        <h3 className="text-sm font-semibold text-stone-800">월간 목표</h3>
        <p className="mt-1 text-xs leading-relaxed text-stone-500">
          이번 달에 집중할 목표를 적고, 달성일을 정하면 상단 D-Day 카운트다운에 반영돼요.
        </p>
        <label className="mt-3 block text-xs font-medium text-stone-600">한 줄 목표</label>
        <DeferredTextArea
          committedValue={monthlyVision}
          onCommit={(v) => setMonthlyVision(v)}
          className="mt-1 w-full resize-y rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400"
          placeholder="예: 매일 아침 독서 30분, 프로젝트 MVP 완성"
          rows={3}
        />
        <p className="mt-1 text-[10px] text-stone-400">저장: 포커스를 벗어날 때 · Ctrl+Enter (Mac: ⌘+Enter)</p>
        <label className="mt-3 block text-xs font-medium text-stone-600">목표 달성일 (D-Day)</label>
        <input
          type="date"
          value={monthlyGoalDeadline}
          onChange={(e) => setMonthlyGoalDeadline(e.target.value)}
          className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800"
        />
      </div>
      <div className="relative rounded-2xl border border-stone-100 bg-cream/40 p-4">
        <div
          className="pointer-events-none absolute right-3 top-3 z-10 max-w-[11rem] rounded-2xl border border-emerald-200/60 bg-white/90 px-3 py-2 text-right shadow-sm backdrop-blur-sm sm:right-4 sm:top-4"
          aria-live="polite"
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-stone-400">내 성장</p>
          <p className="mt-0.5 text-lg leading-none">{plantStage.icon}</p>
          <p className="mt-1 text-xs font-semibold text-sage-deep">{plantStage.label}</p>
          <p className="mt-0.5 text-[11px] text-stone-500">오늘 {todayEpTotal} EP</p>
        </div>
        <div className="mb-3 flex items-center justify-between pr-[7.5rem] sm:pr-[8.5rem]">
          <button
            type="button"
            onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
            className="rounded-lg bg-white px-3 py-1.5 text-sm text-stone-600 ring-1 ring-stone-200"
          >
            ←
          </button>
          <p className="text-sm font-semibold text-stone-700">{monthMeta.title}</p>
          <button
            type="button"
            onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
            className="rounded-lg bg-white px-3 py-1.5 text-sm text-stone-600 ring-1 ring-stone-200"
          >
            →
          </button>
        </div>
        <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-xs text-stone-500">
          {CALENDAR_WEEKDAY_HEADERS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {monthMeta.cells.map((cell) => {
            const isToday = cell.key === monthMeta.todayKey;
            const isSelected = cell.key === monthMeta.selectedKey;
            const heatClass = heatClassForCalendarCell(cell.achievement);
            const plantIcon = cell.inMonth ? getCalendarPlantIcon(cell.dailyEp) : null;
            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelectedCalendarDate(new Date(cell.date))}
                className={`relative aspect-square rounded-xl text-sm ${cell.inMonth ? heatClass : "text-stone-300"} ${
                  isToday
                    ? "border-2 border-emerald-600"
                    : isSelected
                    ? "ring-1 ring-amber-200"
                    : "ring-1 ring-stone-200/70"
                }`}
              >
                <span
                  className={`inline-flex flex-col items-center justify-center gap-0.5 ${isToday ? "font-bold text-emerald-700" : ""}`}
                >
                  {cell.date.getDate()}
                  {plantIcon && (
                    <span className="text-[10px] leading-none" aria-hidden>
                      {plantIcon}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-stone-100 bg-cream/40 p-4">
        <label className="mb-2 block text-sm font-medium text-stone-700">이달의 메모</label>
        <textarea
          value={selectedDayMemo}
          onChange={(e) => setSelectedDayMemo(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700"
        />
      </div>
    </div>
  );
}

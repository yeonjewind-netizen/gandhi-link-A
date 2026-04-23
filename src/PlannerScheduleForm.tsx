import type { Dispatch, FormEventHandler, SetStateAction } from "react";
import { WEEK_DAY_KEYS, WEEK_DAY_LABEL_KO } from "./constants";
import type { ScheduleItem, SchedulePriority, WeekDayKey } from "./types";

export type PlannerScheduleFormProps = {
  formKey: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  scheduleFormDefaults: { item: ScheduleItem } | null;
  scheduleFormTimeDefaults: { start: string; end: string };
  scheduleFormPriorityDefault: SchedulePriority;
  isMasterMode: boolean;
  editingScheduleId: string | null;
  masterSelectedDays: WeekDayKey[];
  setMasterSelectedDays: Dispatch<SetStateAction<WeekDayKey[]>>;
};

export function PlannerScheduleForm({
  formKey,
  onSubmit,
  scheduleFormDefaults,
  scheduleFormTimeDefaults,
  scheduleFormPriorityDefault,
  isMasterMode,
  editingScheduleId,
  masterSelectedDays,
  setMasterSelectedDays,
}: PlannerScheduleFormProps) {
  return (
    <form key={formKey} className="pointer-events-auto relative z-30 space-y-3" onSubmit={onSubmit}>
      <label className="block text-xs font-medium text-stone-600">제목</label>
      <input
        name="title"
        type="text"
        autoComplete="off"
        placeholder="예: 기타 연습, 학교 수업"
        defaultValue={scheduleFormDefaults?.item.title ?? ""}
        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800"
      />
      <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-b from-emerald-50/80 to-[#FAF7F2] p-3 ring-1 ring-emerald-100/60">
        <p className="mb-3 text-xs font-medium text-emerald-900/80">시간</p>
        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label htmlFor="sched-time-start" className="block text-xs font-semibold text-stone-600">
              시작 시간
            </label>
            <input
              id="sched-time-start"
              name="timeStart"
              type="time"
              step={60}
              required
              aria-label="시작 시간"
              defaultValue={scheduleFormTimeDefaults.start}
              className="min-h-[3rem] w-full rounded-xl border border-stone-200/90 bg-white px-3 py-2.5 font-mono text-base text-stone-800 shadow-sm ring-1 ring-stone-100/80"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="sched-time-end" className="block text-xs font-semibold text-stone-600">
              종료 시간
            </label>
            <input
              id="sched-time-end"
              name="timeEnd"
              type="time"
              step={60}
              required
              aria-label="종료 시간"
              defaultValue={scheduleFormTimeDefaults.end}
              className="min-h-[3rem] w-full rounded-xl border border-stone-200/90 bg-white px-3 py-2.5 font-mono text-base text-stone-800 shadow-sm ring-1 ring-stone-100/80"
            />
          </div>
        </div>
      </div>
      <label className="block text-xs font-medium text-stone-600">유형</label>
      <select
        name="type"
        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800"
        defaultValue={scheduleFormDefaults?.item.type ?? "routine"}
      >
        <option value="routine">일반 일정</option>
        <option value="goal">월간 목표 쪼개기 (핵심)</option>
      </select>
      <fieldset className="space-y-2 rounded-2xl border border-stone-200/90 bg-white/90 px-3 py-3">
        <legend className="px-1 text-xs font-medium text-stone-600">중요도</legend>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {(
            [
              { v: "1" as const, label: "1 · 기본" },
              { v: "2" as const, label: "2 · 중요" },
              { v: "3" as const, label: "3 · 매우 중요 🔥" },
            ] as const
          ).map(({ v, label }) => (
            <label
              key={v}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/80 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100"
            >
              <input
                type="radio"
                name="priority"
                value={v}
                defaultChecked={String(scheduleFormPriorityDefault) === v}
                className="h-4 w-4 accent-emerald-600"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      {isMasterMode && !editingScheduleId ? (
        <div className="space-y-2">
          <span className="block text-xs font-medium text-stone-600">적용 요일 (복수 선택)</span>
          <div className="grid grid-cols-7 gap-1.5">
            {WEEK_DAY_KEYS.map((dayKey) => {
              const isSelected = masterSelectedDays.includes(dayKey);
              return (
                <button
                  key={dayKey}
                  type="button"
                  onClick={() =>
                    setMasterSelectedDays((prev) =>
                      prev.includes(dayKey) ? prev.filter((d) => d !== dayKey) : [...prev, dayKey]
                    )
                  }
                  className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${
                    isSelected
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  {WEEK_DAY_LABEL_KO[dayKey]}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <button
        type="submit"
        disabled={isMasterMode && !editingScheduleId && masterSelectedDays.length === 0}
        className="pointer-events-auto relative z-30 w-full rounded-md bg-emerald-500 px-4 py-2 font-semibold text-white transition-all hover:bg-emerald-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-emerald-200 disabled:text-emerald-50"
      >
        {editingScheduleId ? "수정 완료" : isMasterMode ? "고정 일정 저장" : "일정 추가"}
      </button>
    </form>
  );
}

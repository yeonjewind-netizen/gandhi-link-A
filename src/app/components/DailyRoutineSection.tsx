import type { Dispatch, SetStateAction } from "react";
import { ROUTINE_EP_EACH } from "../constants";
import type { DailyRoutine } from "../types";

type DailyRoutineSectionProps = {
  dailyRoutines: DailyRoutine[];
  setDailyRoutines: Dispatch<SetStateAction<DailyRoutine[]>>;
};

export function DailyRoutineSection({ dailyRoutines, setDailyRoutines }: DailyRoutineSectionProps) {
  return (
    <section className="mb-6 rounded-3xl bg-sage-light/25 p-5 shadow-sm ring-1 ring-sage-light/60">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-stone-700">일상의 쉼표 (데일리 루틴)</h3>
        <p className="mt-1 text-xs text-stone-500">
          작고 따뜻한 습관들을 체크해 보세요. 완료 시 +{ROUTINE_EP_EACH} EP, 해제 시 차감돼요.
        </p>
      </div>

      <ul className="space-y-2">
        {dailyRoutines.map((routine) => (
          <li key={routine.id} className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 ring-1 ring-sage-light/40">
            <input
              type="checkbox"
              checked={routine.isDone}
              onChange={() =>
                setDailyRoutines((prev) => prev.map((item) => (item.id === routine.id ? { ...item, isDone: !item.isDone } : item)))
              }
              className="h-4 w-4 rounded border-sage-light text-sage-deep"
            />
            <span className={`text-sm ${routine.isDone ? "text-stone-400 line-through" : "text-stone-700"}`}>{routine.text}</span>
          </li>
        ))}
      </ul>

      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const formData = new FormData(form);
          const text = String(formData.get("routineInput") ?? "").trim();
          if (!text) return;
          setDailyRoutines((prev) => [...prev, { id: Date.now(), text, isDone: false }]);
          form.reset();
        }}
      >
        <input
          name="routineInput"
          type="text"
          autoComplete="off"
          placeholder="루틴 추가..."
          className="flex-1 rounded-xl border border-sage-light bg-white px-3 py-2 text-sm text-stone-700"
        />
        <button type="submit" className="rounded-xl bg-sage-deep px-4 py-2 text-sm text-white transition hover:bg-sage-deep/90">
          추가
        </button>
      </form>
    </section>
  );
}

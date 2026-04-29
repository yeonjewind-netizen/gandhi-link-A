import { useState, type Dispatch, type SetStateAction } from "react";
import { DeferredTextInput } from "./DeferredInputs";
import { computeGoalEp } from "./epCalendarUtils";
import type { BigGoal } from "./types";

export type PlannerDayTabProps = {
  todayBig3: BigGoal[];
  onUpdateGoalTitle: (goalIndex: number, title: string) => void;
  onAppendSubtask: (goalIndex: number, text: string) => void;
  onToggleSubtask: (goalIndex: number, subtaskId: string | number) => void;
  onDeleteSubtask: (goalIndex: number, subtaskId: string | number) => void;
  missionEnabled: boolean;
  setMissionEnabled: Dispatch<SetStateAction<boolean>>;
  missionTime: string;
  setMissionTime: (v: string) => void;
};

export function PlannerDayTab({
  todayBig3,
  onUpdateGoalTitle,
  onAppendSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  missionEnabled,
  setMissionEnabled,
  missionTime,
  setMissionTime,
}: PlannerDayTabProps) {
  const [subtaskDraftByGoal, setSubtaskDraftByGoal] = useState<Record<number, string>>({});
  const goalLabels = ["🌅 아침 목표", "☀️ 점심 목표", "🌙 저녁 목표"] as const;

  return (
    <div className="space-y-3">
      {todayBig3.map((goal, index) => {
        const goalEp = computeGoalEp(goal);
        const subtaskDraft = subtaskDraftByGoal[index] ?? "";
        return (
          <div key={goal.id} className="rounded-[22px] bg-cream/40 p-4 shadow-[0_16px_35px_-26px_rgba(15,23,42,0.4)]">
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-stone-700">{goalLabels[index] ?? `목표 ${index + 1}`}</label>
              <span className="text-sm font-semibold text-orange-500">{goalEp} EP</span>
            </div>
            <DeferredTextInput
              committedValue={goal.title}
              onCommit={(title) => onUpdateGoalTitle(index, title)}
              className="w-full rounded-2xl border border-stone-200/70 bg-white px-3 py-2 text-sm text-stone-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition focus:border-sage-deep/40 focus:outline-none"
              placeholder="해당 시간대 메인 목표 입력"
            />

            <p className="mt-3 text-xs leading-relaxed text-stone-500">
              💡 이 목표를 이루기 위해 3가지 소목표를 적어보세요
            </p>
            <form
              className="mt-2 flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const text = subtaskDraft.trim();
                if (!text) return;
                onAppendSubtask(index, text);
                setSubtaskDraftByGoal((prev) => ({ ...prev, [index]: "" }));
              }}
            >
              <input
                type="text"
                value={subtaskDraft}
                onChange={(event) => setSubtaskDraftByGoal((prev) => ({ ...prev, [index]: event.target.value }))}
                className="flex-1 rounded-full border border-sage-light/70 bg-white px-3 py-2 text-sm text-stone-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition focus:border-sage-deep/40 focus:outline-none"
                placeholder="+ 소목표 추가"
              />
              <button
                type="submit"
                className="rounded-full bg-sage-deep px-4 py-2 text-sm text-white transition duration-200 active:scale-[0.98] hover:bg-sage-deep/90"
              >
                추가
              </button>
            </form>

            <ul className="mt-3 space-y-2">
              {goal.subTasks.map((subtask) => (
                <li key={subtask.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={subtask.isDone}
                    onChange={() => onToggleSubtask(index, subtask.id)}
                    className="h-4 w-4 rounded border-sage-light text-sage-deep"
                  />
                  <span className={`flex-1 text-sm ${subtask.isDone ? "text-stone-400 line-through" : "text-stone-700"}`}>
                    {subtask.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteSubtask(index, subtask.id)}
                    className="text-xs text-sage-deep/60 hover:text-sage-deep"
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      <div className="rounded-[22px] bg-cream/40 p-4 shadow-[0_16px_35px_-26px_rgba(15,23,42,0.4)]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-stone-700">Morning Mission Alarm</p>
          <button
            type="button"
            onClick={() => setMissionEnabled((prev) => !prev)}
            className={`rounded-full px-3 py-1 text-xs transition duration-200 active:scale-95 ${
              missionEnabled ? "bg-sage-deep text-white" : "bg-stone-200 text-stone-600"
            }`}
          >
            {missionEnabled ? "ON" : "OFF"}
          </button>
        </div>
        <input
          type="time"
          step={60}
          value={missionTime}
          onChange={(e) => setMissionTime(e.target.value)}
          className="w-full rounded-2xl border border-stone-200/70 bg-white px-3 py-2 text-sm text-stone-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition focus:border-sage-deep/40 focus:outline-none"
        />
      </div>
    </div>
  );
}

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
  onUpsertChunkingSubtask: (goalIndex: number, slotIndex: number, text: string) => void;
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
  onUpsertChunkingSubtask,
  missionEnabled,
  setMissionEnabled,
  missionTime,
  setMissionTime,
}: PlannerDayTabProps) {
  const [subtaskDraftByGoal, setSubtaskDraftByGoal] = useState<Record<number, string>>({});

  return (
    <div className="space-y-3">
      {todayBig3.map((goal, index) => {
        const goalEp = computeGoalEp(goal);
        const subtaskDraft = subtaskDraftByGoal[index] ?? "";
        return (
          <div key={goal.id} className="rounded-2xl border border-stone-100 bg-cream/40 p-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-stone-700">Big 3 #{index + 1}</label>
              <span className="text-sm font-semibold text-orange-500">{goalEp} EP</span>
            </div>
            <DeferredTextInput
              committedValue={goal.title}
              onCommit={(title) => onUpdateGoalTitle(index, title)}
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700"
              placeholder="오늘의 대목표 제목 입력"
            />
            <div className="mt-3 rounded-xl bg-sage-light/25 px-3 py-3">
              <p className="text-xs font-semibold text-sage-deep">이 목표를 위한 3가지 작은 발걸음</p>
              <div className="mt-2 space-y-2">
                {[0, 1, 2].map((slotIndex) => (
                  <input
                    key={`${goal.id}-chunk-${slotIndex}`}
                    type="text"
                    value={goal.subTasks[slotIndex]?.text ?? ""}
                    onChange={(event) => onUpsertChunkingSubtask(index, slotIndex, event.target.value)}
                    placeholder={
                      slotIndex === 0
                        ? "1단계: 관련 자료 1개 찾아보기"
                        : slotIndex === 1
                        ? "2단계: 15분 안에 첫 시도 해보기"
                        : "3단계: 실행 후 배운 점 한 줄 남기기"
                    }
                    className="w-full rounded-xl border border-sage-light bg-white px-3 py-2 text-sm text-stone-700 placeholder:text-stone-400"
                  />
                ))}
              </div>
            </div>
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
            <form
              className="mt-3 flex items-center gap-2"
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
                className="flex-1 rounded-xl border border-sage-light bg-white px-3 py-2 text-sm text-stone-700"
                placeholder="+ 소목표 추가"
              />
              <button
                type="submit"
                className="rounded-xl bg-sage-deep px-4 py-2 text-sm text-white transition hover:bg-sage-deep/90"
              >
                추가
              </button>
            </form>
          </div>
        );
      })}
      <div className="rounded-2xl border border-stone-100 bg-cream/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-stone-700">Morning Mission Alarm</p>
          <button
            type="button"
            onClick={() => setMissionEnabled((prev) => !prev)}
            className={`rounded-full px-3 py-1 text-xs ${missionEnabled ? "bg-sage-deep text-white" : "bg-stone-200 text-stone-600"}`}
          >
            {missionEnabled ? "ON" : "OFF"}
          </button>
        </div>
        <input
          type="time"
          step={60}
          value={missionTime}
          onChange={(e) => setMissionTime(e.target.value)}
          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700"
        />
      </div>
    </div>
  );
}

import { GrowthSubtaskComposer } from "../GrowthSubtaskComposer";
import { computeGoalEp } from "../domain";
import type { BigGoal } from "../types";

type BigGoalCardProps = {
  goal: BigGoal;
  goalIndex: number;
  allGoals: BigGoal[];
  setTodayBig3: (next: BigGoal[]) => void;
  appendSubtask: (goalIndex: number, text: string) => void;
};

export function BigGoalCard({ goal, goalIndex, allGoals, setTodayBig3, appendSubtask }: BigGoalCardProps) {
  const goalEp = computeGoalEp(goal);

  return (
    <div className="rounded-2xl border border-sage-light/70 bg-cream/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-medium text-stone-700">{goal.title || "Big 3 제목을 Planner에서 입력해 주세요"}</p>
        <span className="text-sm font-semibold text-sage-deep">{goalEp} EP</span>
      </div>
      <ul className="space-y-2">
        {goal.subTasks.map((sub) => (
          <li key={sub.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={sub.isDone}
              onChange={() =>
                setTodayBig3(
                  allGoals.map((item) =>
                    item.id === goal.id
                      ? {
                          ...item,
                          subTasks: item.subTasks.map((task) => (task.id === sub.id ? { ...task, isDone: !task.isDone } : task)),
                        }
                      : item
                  )
                )
              }
              className="h-4 w-4 rounded border-sage-light text-sage-deep"
            />
            <span className={`flex-1 text-sm ${sub.isDone ? "text-stone-400 line-through" : "text-stone-700"}`}>{sub.text}</span>
            <button
              type="button"
              onClick={() =>
                setTodayBig3(
                  allGoals.map((item) =>
                    item.id === goal.id ? { ...item, subTasks: item.subTasks.filter((task) => task.id !== sub.id) } : item
                  )
                )
              }
              className="text-xs text-sage-deep/60 hover:text-sage-deep"
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
      {goal.subTasks.length > 0 && goal.subTasks.length < 3 && (
        <p className="mt-2 text-[11px] leading-snug text-stone-500">
          💡 소목표를 3개 이상 작성해야 대목표 보너스(+50 EP)를 받을 수 있어요!
        </p>
      )}
      <GrowthSubtaskComposer goalIndex={goalIndex} onAppendSubtask={appendSubtask} />
    </div>
  );
}

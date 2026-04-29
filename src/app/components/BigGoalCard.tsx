import { useMemo, useState } from "react";
import { computeGoalEp } from "../domain";
import type { BigGoal } from "../types";

type BigGoalCardProps = {
  goal: BigGoal;
  goalIndex: number;
  allGoals: BigGoal[];
  setTodayBig3: (next: BigGoal[]) => void;
};

const GOAL_SECTIONS = [
  { icon: "🌅", label: "아침 목표" },
  { icon: "☀️", label: "점심 목표" },
  { icon: "🌙", label: "저녁 목표" },
] as const;

export function BigGoalCard({ goal, goalIndex, allGoals, setTodayBig3 }: BigGoalCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const goalEp = computeGoalEp(goal);
  const sectionLabel = GOAL_SECTIONS[goalIndex] ?? { icon: "🎯", label: `목표 ${goalIndex + 1}` };
  const doneCount = useMemo(() => goal.subTasks.filter((task) => task.isDone).length, [goal.subTasks]);
  const totalCount = goal.subTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="rounded-[24px] bg-white px-5 py-4 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.45)]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full text-left transition duration-200 active:scale-[0.99]"
        aria-expanded={isOpen}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-sage-deep">{`${sectionLabel.icon} ${sectionLabel.label}`}</p>
            <p className="mt-1 text-sm font-medium text-stone-700">
              {goal.title || `${sectionLabel.label} 제목을 Planner에서 입력해 주세요`}
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm font-semibold text-sage-deep">{goalEp} EP</span>
            <p className="text-xs text-stone-500">{isOpen ? "접기 ▲" : "펼치기 ▼"}</p>
          </div>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sage-deep to-emerald-400 transition-[width] duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-stone-500">
          진행률 {doneCount}/{totalCount} ({progressPercent}%)
        </p>
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${isOpen ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
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
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

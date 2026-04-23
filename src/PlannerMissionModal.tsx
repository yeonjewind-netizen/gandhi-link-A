import type { Dispatch, SetStateAction } from "react";
import type { MissionStage } from "./types";

export type PlannerMissionModalProps = {
  isOpen: boolean;
  missionStage: MissionStage;
  missionBigThree: string[];
  setMissionBigThree: Dispatch<SetStateAction<string[]>>;
  remainingSeconds: number;
  missionCompleted: boolean;
  onAlarmDismiss: () => void;
  onRefreshCountdown: () => void;
  onComplete: () => void;
};

export function PlannerMissionModal({
  isOpen,
  missionStage,
  missionBigThree,
  setMissionBigThree,
  remainingSeconds,
  missionCompleted,
  onAlarmDismiss,
  onRefreshCountdown,
  onComplete,
}: PlannerMissionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/30 px-6">
      <div className="w-full max-w-sm rounded-3xl border border-stone-200 bg-[#FAF7F2] p-6 shadow-xl">
        {missionStage === "alarm" ? (
          <>
            <h3 className="text-center text-xl font-semibold text-stone-800">아침 알람</h3>
            <button
              type="button"
              onClick={onAlarmDismiss}
              className="mt-5 w-full rounded-2xl bg-sage-deep px-4 py-3 text-sm font-medium text-white"
            >
              알람 끄기
            </button>
          </>
        ) : (
          <>
            <h3 className="text-center text-xl font-semibold text-stone-800">오늘의 Big 3 설정</h3>
            <p className="mt-2 text-center text-xs text-stone-500">남은 시간 00:{String(remainingSeconds).padStart(2, "0")}</p>
            {missionBigThree.map((title, idx) => (
              <input
                key={idx}
                value={title}
                onChange={(e) =>
                  setMissionBigThree((prev) => prev.map((item, i) => (i === idx ? e.target.value : item)))
                }
                placeholder={`Big 3 #${idx + 1} 목표`}
                className="mt-3 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700"
              />
            ))}
            <button
              type="button"
              onClick={onRefreshCountdown}
              className="mt-4 w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-600"
            >
              카운트 새로고침
            </button>
            <button
              type="button"
              disabled={!missionCompleted}
              onClick={onComplete}
              className={`mt-3 w-full rounded-2xl px-4 py-3 text-sm font-medium ${missionCompleted ? "bg-sage-deep text-white" : "bg-stone-200 text-stone-500"}`}
            >
              완료
            </button>
          </>
        )}
      </div>
    </div>
  );
}

import type { Dispatch, FormEventHandler, RefObject, SetStateAction } from "react";
import { TIMELINE_END, TIMELINE_SPAN, TIMELINE_START, WEEK_DAY_KEYS, WEEK_DAY_LABEL_KO, WEEK_MINIMAP_SLOTS } from "./constants";
import { formatDateKey, getWeekDayKey } from "./dateUtils";
import {
  compareSchedulesForDisplay,
  formatScheduleTimeDisplay,
  listRowClasses,
  minimapCellClasses,
  parseTimeRange,
  scheduleInstanceKey,
  schedulePriority,
  schedulesOverlappingSlot,
  timelineBlockClasses,
  writeBaseWeeklyScheduleStore,
  writeWeeklyScheduleStore,
} from "./scheduleUtils";
import { PlannerScheduleForm } from "./PlannerScheduleForm";
import type {
  BaseWeeklyScheduleStore,
  LayeredScheduleItem,
  SchedulePriority,
  ScheduleItem,
  WeekDayKey,
  WeeklyScheduleStore,
} from "./types";

export type PlannerWeekTabProps = {
  isMasterMode: boolean;
  setIsMasterMode: Dispatch<SetStateAction<boolean>>;
  todayKey: string;
  weekStripDays: Date[];
  selectedWeekDate: Date;
  setSelectedWeekDate: (d: Date) => void;
  baseWeeklySchedule: BaseWeeklyScheduleStore;
  setBaseWeeklySchedule: (v: BaseWeeklyScheduleStore) => void;
  weeklySchedule: WeeklyScheduleStore;
  setWeeklySchedule: (v: WeeklyScheduleStore) => void;
  schedulesForSelectedDay: LayeredScheduleItem[];
  selectedDayKey: string;
  selectedWeekDayKey: WeekDayKey;
  editingScheduleId: string | null;
  setEditingScheduleId: (id: string | null) => void;
  setScheduleFormOpen: Dispatch<SetStateAction<boolean>>;
  setScheduleFormBump: Dispatch<SetStateAction<number>>;
  scheduleFormRef: RefObject<HTMLDivElement | null>;
  scheduleFormOpen: boolean;
  scheduleFormKey: string;
  onScheduleFormSubmit: FormEventHandler<HTMLFormElement>;
  scheduleFormDefaults: { item: ScheduleItem } | null;
  scheduleFormTimeDefaults: { start: string; end: string };
  scheduleFormPriorityDefault: SchedulePriority;
  masterSelectedDays: WeekDayKey[];
  setMasterSelectedDays: Dispatch<SetStateAction<WeekDayKey[]>>;
  scheduleCheckedForSelectedDay: Record<string, boolean>;
  onToggleScheduleChecked: (item: LayeredScheduleItem, nextChecked: boolean) => void;
};

export function PlannerWeekTab({
  isMasterMode,
  setIsMasterMode,
  todayKey,
  weekStripDays,
  selectedWeekDate,
  setSelectedWeekDate,
  baseWeeklySchedule,
  setBaseWeeklySchedule,
  weeklySchedule,
  setWeeklySchedule,
  schedulesForSelectedDay,
  selectedDayKey,
  selectedWeekDayKey,
  editingScheduleId,
  setEditingScheduleId,
  setScheduleFormOpen,
  setScheduleFormBump,
  scheduleFormRef,
  scheduleFormOpen,
  scheduleFormKey,
  onScheduleFormSubmit,
  scheduleFormDefaults,
  scheduleFormTimeDefaults,
  scheduleFormPriorityDefault,
  masterSelectedDays,
  setMasterSelectedDays,
  scheduleCheckedForSelectedDay,
  onToggleScheduleChecked,
}: PlannerWeekTabProps) {
  return (
    <div
      className={`space-y-4 rounded-3xl p-4 ring-1 sm:p-5 ${
        isMasterMode ? "bg-emerald-50/70 ring-emerald-200/70" : "bg-stone-50 ring-stone-200/60"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/80">주간 시간 설계실</p>
          <p className="mt-0.5 text-sm text-stone-600">한 주를 가로로 조망하고, 요일별 시간표를 채워 보세요.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingScheduleId(null);
            setIsMasterMode((v) => !v);
          }}
          className={`rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm transition ${
            isMasterMode
              ? "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600"
              : "border-emerald-300/80 bg-emerald-50 text-emerald-900 hover:bg-emerald-100/90"
          }`}
        >
          {isMasterMode ? "✅ 기본 시간표 모드 ON" : "⚙️ 기본 시간표 설정"}
        </button>
      </div>
      {isMasterMode ? (
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-100/70 px-3 py-2 text-xs text-emerald-900">
          마스터 모드: 지금 추가/삭제하는 일정은 요일별 고정 시간표로 저장됩니다.
        </div>
      ) : null}

      <div className="w-full overflow-hidden rounded-2xl border border-stone-200/80 bg-white/95 shadow-sm ring-1 ring-stone-100/90">
        <div className="border-b border-stone-100 bg-gradient-to-r from-emerald-50/50 to-stone-50/80 px-3 py-2.5 sm:px-4">
          <p className="text-center text-[11px] font-medium text-stone-600 sm:text-left">
            이번 주 한눈에 · 열을 눌러 하루를 선택하세요 (가로 스크롤)
          </p>
        </div>

        <div className="overflow-x-auto overscroll-x-contain pb-2">
          <div
            className="inline-grid min-w-max"
            style={{
              gridTemplateColumns: "minmax(2.25rem, 2.5rem) repeat(7, minmax(80px, 92px))",
            }}
          >
            <div className="sticky left-0 z-[1] border-b border-r border-stone-100 bg-stone-50/95" aria-hidden />
            {weekStripDays.map((d, i) => {
              const key = formatDateKey(d);
              const isSelected = formatDateKey(selectedWeekDate) === key;
              const isToday = key === todayKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedWeekDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()))}
                  className={`min-w-[80px] border-b border-stone-100 py-2.5 text-center transition ${
                    isSelected
                      ? "bg-stone-200/90 ring-2 ring-inset ring-emerald-600/35"
                      : isToday
                      ? "bg-emerald-50/60 hover:bg-emerald-50/90"
                      : "bg-white hover:bg-stone-50/90"
                  }`}
                >
                  <span className="block text-[10px] font-semibold text-stone-500">{WEEK_DAY_LABEL_KO[WEEK_DAY_KEYS[i]]}</span>
                  <span className={`block text-sm font-bold ${isSelected ? "text-emerald-950" : "text-stone-800"}`}>
                    {d.getDate()}
                  </span>
                </button>
              );
            })}

            {WEEK_MINIMAP_SLOTS.map((slot, slotIdx) => (
              <div key={slot.label} className="contents">
                <div
                  className={`sticky left-0 z-[1] flex items-center justify-end border-r border-stone-100 bg-stone-50/95 pr-1.5 text-[10px] font-medium text-stone-500 ${
                    slotIdx === WEEK_MINIMAP_SLOTS.length - 1 ? "" : "border-b border-stone-50"
                  }`}
                >
                  {slot.label}
                </div>
                {weekStripDays.map((d, colIdx) => {
                  const dateKey = formatDateKey(d);
                  const isSelected = formatDateKey(selectedWeekDate) === dateKey;
                  const weekDayKey = getWeekDayKey(d);
                  const dayBaseSchedules = baseWeeklySchedule[weekDayKey]?.schedules ?? [];
                  const dayWeeklySchedules = weeklySchedule[dateKey]?.schedules ?? [];
                  const layeredInSlot: LayeredScheduleItem[] = [
                    ...schedulesOverlappingSlot(dayBaseSchedules, slot.start, slot.end).map((item) => ({
                      ...item,
                      layer: "base" as const,
                    })),
                    ...schedulesOverlappingSlot(dayWeeklySchedules, slot.start, slot.end).map((item) => ({
                      ...item,
                      layer: "weekly" as const,
                    })),
                  ];
                  const inSlot = [...layeredInSlot].sort(compareSchedulesForDisplay);
                  const visible = inSlot.slice(0, 4);
                  const overflow = inSlot.length - visible.length;
                  return (
                    <button
                      key={`${dateKey}-${slotIdx}-exp`}
                      type="button"
                      title={
                        inSlot.map((s) => `${s.title} (${formatScheduleTimeDisplay(s.time)})`).join(" · ") || undefined
                      }
                      onClick={() => setSelectedWeekDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()))}
                      className={`flex min-h-[3.25rem] min-w-[80px] flex-col justify-stretch gap-0.5 border-stone-50 p-1.5 ${
                        slotIdx === WEEK_MINIMAP_SLOTS.length - 1 ? "" : "border-b"
                      } ${
                        isSelected
                          ? "bg-stone-200/70 ring-1 ring-inset ring-emerald-600/25"
                          : colIdx % 2 === 0
                          ? "bg-stone-50/40"
                          : "bg-white/60"
                      }`}
                    >
                      {inSlot.length === 0 ? (
                        <span className="min-h-[2.5rem] flex-1 rounded-md bg-stone-100/70 ring-1 ring-inset ring-stone-200/40" aria-hidden />
                      ) : (
                        <>
                          {visible.map((item) => (
                            <div
                              key={`${item.id}-${item.layer}`}
                              className={`min-h-[1.15rem] flex-1 rounded-md px-1.5 py-0.5 text-left shadow-sm ${minimapCellClasses(
                                item
                              )}`}
                            >
                              <span className="line-clamp-2 text-[9px] font-semibold leading-tight">
                                {schedulePriority(item) >= 3 ? "🔥 " : ""}
                                {item.title}
                              </span>
                            </div>
                          ))}
                          {overflow > 0 ? (
                            <span className="shrink-0 rounded-md bg-stone-200/90 px-1 py-0.5 text-center text-[9px] font-bold text-stone-600">
                              +{overflow}
                            </span>
                          ) : null}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-sm ring-1 ring-stone-100/80">
        <div className="border-b border-stone-100 bg-gradient-to-r from-stone-50/90 to-emerald-50/40 px-4 py-3 sm:px-5">
          <p className="text-xs font-medium text-stone-500">선택한 날</p>
          <p className="text-lg font-semibold text-stone-800">
            {selectedWeekDate.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {String(TIMELINE_START).padStart(2, "0")}:00 ~ 24:00 타임라인
          </p>
        </div>

        <div className="px-3 py-4 sm:px-5">
          <div className="relative min-h-[320px] rounded-2xl border border-stone-100 bg-stone-50/50">
            <div className="relative ml-11 mr-2 min-h-[300px] border-l border-stone-200/80 pt-1 pb-1">
              {Array.from({ length: TIMELINE_END - TIMELINE_START + 1 }, (_, i) => TIMELINE_START + i).map((hour) => (
                <span
                  key={hour}
                  className="absolute -left-11 w-10 text-right text-[10px] text-stone-400"
                  style={{ top: `${((hour - TIMELINE_START) / TIMELINE_SPAN) * 100}%`, transform: "translateY(-50%)" }}
                >
                  {String(hour).padStart(2, "0")}:00
                </span>
              ))}
              {Array.from({ length: TIMELINE_END - TIMELINE_START }, (_, i) => (
                <div
                  key={i}
                  className="pointer-events-none absolute left-0 right-0 border-t border-stone-100/90"
                  style={{ top: `${(i / TIMELINE_SPAN) * 100}%` }}
                />
              ))}
              {(() => {
                const sorted = [...schedulesForSelectedDay].sort(compareSchedulesForDisplay);
                return sorted.map((item) => {
                  const r = parseTimeRange(item.time);
                  if (!r) return null;
                  const checked = !!scheduleCheckedForSelectedDay[scheduleInstanceKey(item)];
                  const start = Math.max(TIMELINE_START, r.start);
                  const end = Math.min(TIMELINE_END, r.end);
                  if (end <= start) return null;
                  const top = ((start - TIMELINE_START) / TIMELINE_SPAN) * 100;
                  const height = ((end - start) / TIMELINE_SPAN) * 100;
                  const pr = schedulePriority(item);
                  const z = pr * 8 + (item.layer === "weekly" ? 4 : 0);
                  return (
                    <div
                      key={`${item.id}-${item.layer}`}
                      className={`absolute left-1 right-1 overflow-hidden rounded-xl border px-2 py-1.5 text-left shadow-sm ${timelineBlockClasses(
                        item
                      )} ${checked ? "opacity-45" : ""}`}
                      style={{
                        top: `${top}%`,
                        height: `${Math.max(height, 8)}%`,
                        zIndex: z,
                      }}
                    >
                      <p className="truncate text-xs font-semibold leading-tight">
                        {pr >= 3 ? "🔥 " : ""}
                        {item.title}
                      </p>
                      <p className="truncate text-[10px] opacity-90">{formatScheduleTimeDisplay(item.time)}</p>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {schedulesForSelectedDay.some((s) => !parseTimeRange(s.time)) && (
            <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">
              <p className="font-medium">시간 형식 안내</p>
              <p className="mt-1 text-amber-900/90">
                타임라인에는 <span className="font-mono">14:00 ~ 16:00</span>처럼 시작·끝 시간이 있는 일정만 배치됩니다. 아래
                목록에서 확인하세요.
              </p>
            </div>
          )}

          <ul className="mt-4 space-y-2">
            {schedulesForSelectedDay.length === 0 ? (
              <li className="rounded-xl border border-dashed border-stone-200 bg-white/80 px-4 py-6 text-center text-sm text-stone-500">
                이 날짜에 아직 일정이 없어요. 아래에서 추가해 보세요.
              </li>
            ) : (
              [...schedulesForSelectedDay]
                .sort(compareSchedulesForDisplay)
                .map((item) => {
                  const pr = schedulePriority(item);
                  const checked = !!scheduleCheckedForSelectedDay[scheduleInstanceKey(item)];
                  return (
                    <li
                      key={`${item.id}-${item.layer}`}
                      className={`flex items-start justify-between gap-3 rounded-2xl border px-3 py-2.5 ${listRowClasses(item)}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${checked ? "line-through opacity-60" : ""}`}>
                          {pr >= 3 ? "🔥 " : ""}
                          {item.title}
                        </p>
                        <p className="mt-0.5 font-mono text-xs opacity-90">{formatScheduleTimeDisplay(item.time)}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-wide opacity-75">
                          {item.layer === "base"
                            ? item.type === "goal"
                              ? "고정 · 월간 목표 연계"
                              : "고정 · 일반 일정"
                            : item.type === "goal"
                            ? "월간 목표 연계"
                            : "일반 일정"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center">
                        <label className="inline-flex items-center gap-1.5 text-xs text-stone-500">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => onToggleScheduleChecked(item, e.target.checked)}
                            className="h-4 w-4 accent-emerald-600"
                          />
                          완료
                        </label>
                        <button
                          type="button"
                          aria-label="일정 편집"
                          onClick={() => {
                            if (item.layer === "base" && !isMasterMode) {
                              setIsMasterMode(true);
                            }
                            setEditingScheduleId(item.id);
                            setScheduleFormOpen(true);
                            if (item.layer === "base") {
                              setMasterSelectedDays([selectedWeekDayKey]);
                            } else {
                              setMasterSelectedDays([]);
                            }
                            setScheduleFormBump((b) => b + 1);
                          }}
                          className="rounded-lg border border-stone-200/90 bg-white px-2 py-1 text-xs text-stone-600 shadow-sm transition hover:bg-stone-50"
                        >
                          ✏️
                        </button>
                        {item.layer === "base" && !isMasterMode ? (
                          <span className="rounded-md bg-stone-200/80 px-2 py-1 text-[10px] font-semibold text-stone-500">
                            고정 일정
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (item.layer === "base") {
                                const nextBase = { ...baseWeeklySchedule };
                                const bundle = nextBase[selectedWeekDayKey] ?? { schedules: [] };
                                nextBase[selectedWeekDayKey] = {
                                  schedules: bundle.schedules.filter((s) => s.id !== item.id),
                                };
                                setBaseWeeklySchedule(nextBase);
                                writeBaseWeeklyScheduleStore(nextBase);
                              } else {
                                const next = { ...weeklySchedule };
                                const bundle = next[selectedDayKey] ?? { schedules: [] };
                                next[selectedDayKey] = {
                                  schedules: bundle.schedules.filter((s) => s.id !== item.id),
                                };
                                setWeeklySchedule(next);
                                writeWeeklyScheduleStore(next);
                              }
                              setEditingScheduleId(null);
                              setScheduleFormBump((b) => b + 1);
                              window.dispatchEvent(new Event("growth-sync"));
                            }}
                            className="text-xs text-stone-400 underline-offset-2 hover:text-stone-600"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })
            )}
          </ul>
        </div>

        <div
          ref={scheduleFormRef}
          className="pointer-events-auto relative z-30 border-t border-stone-100 bg-stone-50/80 px-3 py-4 pb-12 sm:px-5 sm:pb-14"
        >
          <button
            type="button"
            onClick={() => {
              setScheduleFormOpen((o) => {
                const next = !o;
                if (!next) setEditingScheduleId(null);
                return next;
              });
            }}
            className="mb-3 w-full rounded-2xl border border-emerald-300/70 bg-emerald-50/90 py-3 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100/90"
          >
            {scheduleFormOpen ? "입력 닫기" : "+ 시간표 채우기"}
          </button>
          {scheduleFormOpen ? (
            <p className="mb-3 text-xs text-stone-500">
              {editingScheduleId
                ? "일정을 수정 중입니다. 저장하면 같은 ID의 일정이 갱신됩니다."
                : isMasterMode
                ? "현재 마스터 모드입니다. 입력한 일정은 요일별 고정 시간표로 저장됩니다."
                : "현재 일반 모드입니다. 입력한 일정은 이번 주(선택 날짜)에만 저장됩니다."}
            </p>
          ) : null}

          {scheduleFormOpen && (
            <PlannerScheduleForm
              formKey={scheduleFormKey}
              onSubmit={onScheduleFormSubmit}
              scheduleFormDefaults={scheduleFormDefaults}
              scheduleFormTimeDefaults={scheduleFormTimeDefaults}
              scheduleFormPriorityDefault={scheduleFormPriorityDefault}
              isMasterMode={isMasterMode}
              editingScheduleId={editingScheduleId}
              masterSelectedDays={masterSelectedDays}
              setMasterSelectedDays={setMasterSelectedDays}
            />
          )}
        </div>
      </div>
    </div>
  );
}

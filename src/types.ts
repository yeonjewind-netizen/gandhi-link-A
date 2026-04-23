export type ViewMode = "month" | "week" | "day";
export type MissionStage = "alarm" | "mission";
export type SubTask = { id: string | number; text: string; isDone: boolean };
export type BigGoal = { id: string; title: string; subTasks: SubTask[] };
export type SharedState = { byDate: Record<string, { big3: BigGoal[] }> };

export type WeekDayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type SchedulePriority = 1 | 2 | 3;
export type ScheduleItem = {
  id: string;
  title: string;
  time: string;
  type: "goal" | "routine";
  priority?: SchedulePriority;
};

export type WeeklyScheduleStore = Record<string, { schedules: ScheduleItem[] }>;
export type BaseWeeklyScheduleStore = Partial<Record<WeekDayKey, { schedules: ScheduleItem[] }>>;
export type LayeredScheduleItem = ScheduleItem & { layer: "base" | "weekly" };
export type ScheduleCheckedStore = Record<string, Record<string, boolean>>;

export type PlannerPersistedState = {
  monthlyVision?: string;
  monthlyGoalDeadline?: string;
  weeklyGoals?: Record<string, string>;
};

export type MonthCell = {
  date: Date;
  inMonth: boolean;
  key: string;
  achievement: number;
  dailyEp: number;
};

export type MonthMeta = {
  title: string;
  cells: MonthCell[];
  todayKey: string;
  selectedKey: string;
};

export type KanbanColumnId = "todo" | "doing" | "done";
export type KanbanCard = {
  id: string;
  title: string;
  createdAt: number;
};
export type KanbanState = Record<KanbanColumnId, KanbanCard[]>;

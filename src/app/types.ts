export type SubTask = { id: number | string; text: string; isDone: boolean };
export type BigGoal = { id: string; title: string; subTasks: SubTask[] };
export type SharedData = { byDate: Record<string, { big3: BigGoal[] }> };
export type DailyRoutine = { id: number; text: string; isDone: boolean };

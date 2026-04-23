import { useMemo, useState, type DragEvent, type FormEvent } from "react";
import { getKanbanState, saveKanbanState } from "./storage";
import type { KanbanCard, KanbanColumnId } from "./types";

const COLUMN_META: Array<{ id: KanbanColumnId; title: string }> = [
  { id: "todo", title: "To Do" },
  { id: "doing", title: "Doing" },
  { id: "done", title: "Done" },
];

type DraggingCard = {
  cardId: string;
  fromColumn: KanbanColumnId;
};

export function KanbanBoard() {
  const [board, setBoard] = useState(() => getKanbanState());
  const [draftByColumn, setDraftByColumn] = useState<Record<KanbanColumnId, string>>({
    todo: "",
    doing: "",
    done: "",
  });
  const [dragging, setDragging] = useState<DraggingCard | null>(null);

  const totalCardCount = useMemo(
    () => board.todo.length + board.doing.length + board.done.length,
    [board.todo.length, board.doing.length, board.done.length]
  );

  function updateBoard(
    updater: (prev: ReturnType<typeof getKanbanState>) => ReturnType<typeof getKanbanState>
  ) {
    setBoard((prev) => {
      const next = updater(prev);
      saveKanbanState(next);
      return next;
    });
  }

  function addCard(column: KanbanColumnId, e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const title = draftByColumn[column].trim();
    if (!title) return;
    const nextCard: KanbanCard = {
      id: `kb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      createdAt: Date.now(),
    };
    updateBoard((prev) => ({
      ...prev,
      [column]: [...prev[column], nextCard],
    }));
    setDraftByColumn((prev) => ({ ...prev, [column]: "" }));
  }

  function removeCard(column: KanbanColumnId, cardId: string) {
    updateBoard((prev) => ({
      ...prev,
      [column]: prev[column].filter((card) => card.id !== cardId),
    }));
  }

  function moveCard(toColumn: KanbanColumnId) {
    if (!dragging) return;
    const { cardId, fromColumn } = dragging;
    if (fromColumn === toColumn) {
      setDragging(null);
      return;
    }

    updateBoard((prev) => {
      const movingCard = prev[fromColumn].find((card) => card.id === cardId);
      if (!movingCard) return prev;
      return {
        ...prev,
        [fromColumn]: prev[fromColumn].filter((card) => card.id !== cardId),
        [toColumn]: [...prev[toColumn], movingCard],
      };
    });
    setDragging(null);
  }

  function onCardDragStart(column: KanbanColumnId, cardId: string, e: DragEvent<HTMLLIElement>) {
    setDragging({ cardId, fromColumn: column });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", cardId);
  }

  return (
    <section className="mb-6 rounded-3xl bg-white/85 p-7 shadow-sm ring-1 ring-stone-200/60 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm tracking-wide text-stone-500">Kanban</p>
          <h2 className="font-display text-xl font-semibold text-stone-800">Task Flow Board</h2>
        </div>
        <div className="rounded-2xl bg-sage-light px-4 py-2 text-sage-deep">
          <p className="text-xs">전체 카드</p>
          <p className="text-lg font-semibold">{totalCardCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {COLUMN_META.map((column) => (
          <div
            key={column.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => moveCard(column.id)}
            className="rounded-2xl border border-stone-200/80 bg-cream/40 p-3"
          >
            <h3 className="mb-3 text-sm font-semibold text-stone-700">{column.title}</h3>

            <ul className="mb-3 min-h-[120px] space-y-2">
              {board[column.id].map((card) => (
                <li
                  key={card.id}
                  draggable
                  onDragStart={(e) => onCardDragStart(column.id, card.id, e)}
                  className="cursor-grab rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 shadow-sm active:cursor-grabbing"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="leading-relaxed">{card.title}</p>
                    <button
                      type="button"
                      onClick={() => removeCard(column.id, card.id)}
                      className="text-xs text-stone-400 hover:text-stone-700"
                    >
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <form onSubmit={(e) => addCard(column.id, e)} className="space-y-2">
              <input
                type="text"
                value={draftByColumn[column.id]}
                onChange={(e) => setDraftByColumn((prev) => ({ ...prev, [column.id]: e.target.value }))}
                placeholder="새 카드 입력"
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-sage-deep px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                카드 추가
              </button>
            </form>
          </div>
        ))}
      </div>
    </section>
  );
}

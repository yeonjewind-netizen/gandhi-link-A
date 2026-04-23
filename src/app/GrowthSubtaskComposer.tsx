import { useState } from "react";

export function GrowthSubtaskComposer({
  goalIndex,
  onAppendSubtask,
}: {
  goalIndex: number;
  onAppendSubtask: (goalIndex: number, text: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onAppendSubtask(goalIndex, text);
    setDraft("");
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="mt-2 flex items-center gap-2">
      <input
        type="text"
        autoComplete="off"
        placeholder="+ 소목표 추가"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        className="flex-1 rounded-xl border border-sage-light bg-white px-3 py-2 text-sm text-stone-700"
      />
      <button type="submit" className="rounded-xl bg-sage-deep px-4 py-2 text-sm text-white transition hover:bg-sage-deep/90">
        추가
      </button>
    </form>
  );
}

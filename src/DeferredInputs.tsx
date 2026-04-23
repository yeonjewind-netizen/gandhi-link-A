import { useEffect, useRef, useState } from "react";

/** 부모/스토리지 갱신은 blur·Enter에서만 — IME 조합 중 끊김 방지 */
export function DeferredTextInput({
  committedValue,
  onCommit,
  className,
  placeholder,
}: {
  committedValue: string;
  onCommit: (value: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(committedValue);
  const lastRemoteRef = useRef(committedValue);

  useEffect(() => {
    if (committedValue !== lastRemoteRef.current) {
      lastRemoteRef.current = committedValue;
      setDraft(committedValue);
    }
  }, [committedValue]);

  const flush = () => {
    if (draft === lastRemoteRef.current) return;
    lastRemoteRef.current = draft;
    onCommit(draft);
  };

  return (
    <input
      type="text"
      className={className}
      placeholder={placeholder}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={flush}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          flush();
          (e.currentTarget as HTMLInputElement).blur();
        }
      }}
    />
  );
}

export function DeferredTextArea({
  committedValue,
  onCommit,
  className,
  placeholder,
  rows = 3,
}: {
  committedValue: string;
  onCommit: (value: string) => void;
  className?: string;
  placeholder?: string;
  rows?: number;
}) {
  const [draft, setDraft] = useState(committedValue);
  const lastRemoteRef = useRef(committedValue);

  useEffect(() => {
    if (committedValue !== lastRemoteRef.current) {
      lastRemoteRef.current = committedValue;
      setDraft(committedValue);
    }
  }, [committedValue]);

  const flush = () => {
    if (draft === lastRemoteRef.current) return;
    lastRemoteRef.current = draft;
    onCommit(draft);
  };

  return (
    <textarea
      className={className}
      placeholder={placeholder}
      rows={rows}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={flush}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          flush();
          (e.currentTarget as HTMLTextAreaElement).blur();
        }
      }}
    />
  );
}

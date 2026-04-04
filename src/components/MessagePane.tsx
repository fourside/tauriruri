import { useEffect, useMemo, useRef } from "react";
import type { Message } from "../bindings.ts";

interface Props {
  messages: Message[];
  highlightId?: string;
}

function extractText(message: Message): string {
  if (message.text) return message.text;
  if (!message.content_json) return "";
  try {
    const contents: { type: string; text?: string }[] = JSON.parse(message.content_json);
    return contents
      .filter((c) => c.type === "text" && c.text)
      .map((c) => c.text)
      .join("\n");
  } catch {
    return "";
  }
}

export function MessagePane({ messages, highlightId }: Props) {
  const highlightRef = useRef<HTMLDivElement>(null);

  const rendered = useMemo(
    () => messages.map((m) => ({ id: m.id, sender: m.sender, text: extractText(m) })),
    [messages],
  );

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId, messages]);

  if (rendered.length === 0) {
    return <div className="empty-state">Select a conversation</div>;
  }

  return (
    <div className="message-pane">
      {rendered.map((m) => (
        <div
          key={m.id}
          ref={m.id === highlightId ? highlightRef : undefined}
          className={`message ${m.sender} ${m.id === highlightId ? "highlight" : ""}`}
        >
          <div className="sender">{m.sender}</div>
          {m.text}
        </div>
      ))}
    </div>
  );
}

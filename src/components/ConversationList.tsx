import type { Conversation } from "../bindings.ts";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

const dateFormat = new Intl.DateTimeFormat("ja-JP", { month: "short", day: "numeric" });

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return dateFormat.format(new Date(dateStr));
}

export function ConversationList({ conversations, activeId, onSelect }: Props) {
  return (
    <div className="conversation-list">
      {conversations.map((c) => (
        <div
          key={c.id}
          className={`conversation-item ${c.id === activeId ? "active" : ""}`}
          onClick={() => onSelect(c.id)}
        >
          <div className="name">{c.name ?? "Untitled"}</div>
          <div className="meta">
            {formatDate(c.updated_at)} &middot; {c.message_count} messages
          </div>
        </div>
      ))}
    </div>
  );
}

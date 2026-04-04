import type { SearchHit } from "../bindings.ts";

interface Props {
  hits: SearchHit[];
  onSelect: (conversationId: string, messageId: string) => void;
}

export function SearchResults({ hits, onSelect }: Props) {
  if (hits.length === 0) {
    return <div className="empty-state">No results</div>;
  }

  return (
    <div className="search-results">
      {hits.map((hit, i) => (
        <div
          key={`${hit.message_id}-${i}`}
          className="search-hit"
          onClick={() => onSelect(hit.conversation_id, hit.message_id)}
        >
          <div className="hit-conv">
            {hit.conversation_name ?? "Untitled"} &middot; {hit.sender}
          </div>
          <div
            className="hit-snippet"
            dangerouslySetInnerHTML={{ __html: hit.snippet }}
          />
        </div>
      ))}
    </div>
  );
}

import { useState, type FormEvent } from "react";
import type { SearchMode } from "../bindings.ts";

interface Props {
  onSearch: (query: string, mode: SearchMode, includeTool: boolean) => void;
  onClear: () => void;
}

export function SearchBar({ onSearch, onClear }: Props) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("fts");
  const [includeTool, setIncludeTool] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      onSearch(trimmed, mode, includeTool);
    } else {
      onClear();
    }
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Search messages..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select value={mode} onChange={(e) => setMode(e.target.value as SearchMode)}>
        <option value="fts">Full Text</option>
        <option value="semantic">Semantic</option>
      </select>
      <label>
        <input
          type="checkbox"
          checked={includeTool}
          onChange={(e) => setIncludeTool(e.target.checked)}
        />
        tool
      </label>
      <button type="submit">Search</button>
    </form>
  );
}

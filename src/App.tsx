import { useEffect, useState, useCallback } from "react";
import {
  getConversations,
  getMessages,
  searchFts,
  type Conversation,
  type Message,
  type SearchHit,
  type SearchMode,
} from "./bindings.ts";
import { SearchBar } from "./components/SearchBar.tsx";
import { ConversationList } from "./components/ConversationList.tsx";
import { MessagePane } from "./components/MessagePane.tsx";
import { SearchResults } from "./components/SearchResults.tsx";
import "./styles.css";

export function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchHits, setSearchHits] = useState<SearchHit[] | null>(null);
  const [highlightMsgId, setHighlightMsgId] = useState<string | undefined>();

  useEffect(() => {
    getConversations().then(setConversations).catch(console.error);
  }, []);

  const loadMessages = useCallback((id: string) => {
    setActiveConvId(id);
    getMessages(id).then(setMessages).catch(console.error);
  }, []);

  const selectConversation = useCallback(
    (id: string) => {
      if (id === activeConvId) return;
      setHighlightMsgId(undefined);
      loadMessages(id);
    },
    [activeConvId, loadMessages],
  );

  const handleSearch = useCallback(
    (query: string, mode: SearchMode, includeTool: boolean) => {
      if (mode === "fts") {
        searchFts(query, includeTool).then(setSearchHits).catch(console.error);
      }
      // TODO: semantic search
    },
    [],
  );

  const handleClear = useCallback(() => {
    setSearchHits(null);
    setHighlightMsgId(undefined);
  }, []);

  const handleHitSelect = useCallback(
    (conversationId: string, messageId: string) => {
      setHighlightMsgId(messageId);
      if (conversationId !== activeConvId) {
        loadMessages(conversationId);
      }
    },
    [activeConvId, loadMessages],
  );

  return (
    <div className="app">
      <SearchBar onSearch={handleSearch} onClear={handleClear} />
      <div className="main-content">
        {searchHits ? (
          <SearchResults hits={searchHits} onSelect={handleHitSelect} />
        ) : (
          <ConversationList
            conversations={conversations}
            activeId={activeConvId}
            onSelect={selectConversation}
          />
        )}
        <MessagePane messages={messages} highlightId={highlightMsgId} />
      </div>
    </div>
  );
}

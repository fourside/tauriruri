import { invoke } from "@tauri-apps/api/core";

export type SearchMode = "fts" | "semantic";
export type Sender = "human" | "assistant";
export type ChunkType = "text" | "tool";

export interface Conversation {
  id: string;
  name: string | null;
  summary: string | null;
  created_at: string | null;
  updated_at: string | null;
  message_count: number;
}

export interface Message {
  id: string;
  sender: Sender;
  text: string | null;
  content_json: string | null;
  attachments_json: string | null;
  files_json: string | null;
  created_at: string | null;
  sort_order: number;
}

export interface SearchHit {
  conversation_id: string;
  conversation_name: string | null;
  message_id: string;
  sender: Sender;
  chunk_type: ChunkType;
  snippet: string;
  rank: number;
}

export interface ChunkEmbedding {
  id: number;
  message_id: string;
  conversation_id: string;
  sender: Sender;
  chunk_type: ChunkType;
  text: string;
  embedding: number[];
}

export function getConversations(): Promise<Conversation[]> {
  return invoke("get_conversations");
}

export function getMessages(conversationId: string): Promise<Message[]> {
  return invoke("get_messages", { conversationId });
}

export function searchFts(
  query: string,
  includeTool: boolean,
): Promise<SearchHit[]> {
  return invoke("search_fts", { query, includeTool });
}

export function getAllEmbeddings(
  includeTool: boolean,
): Promise<ChunkEmbedding[]> {
  return invoke("get_all_embeddings", { includeTool });
}

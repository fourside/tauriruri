export interface ConversationExport {
  uuid: string;
  name: string;
  summary: string;
  created_at: string;
  updated_at: string;
  chat_messages: ChatMessage[];
}

export interface ChatMessage {
  uuid: string;
  text: string;
  content: Content[];
  sender: "human" | "assistant";
  created_at: string;
  attachments: Attachment[];
  files: FileRef[];
}

export type Content =
  | TextContent
  | ThinkingContent
  | ToolUseContent
  | ToolResultContent
  | TokenBudgetContent;

export interface TextContent {
  type: "text";
  text: string;
}

export interface ThinkingContent {
  type: "thinking";
  thinking: string;
}

export interface ToolUseContent {
  type: "tool_use";
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultContent {
  type: "tool_result";
  content: string | { type: string; text?: string }[];
  tool_use_id: string;
}

export interface TokenBudgetContent {
  type: "token_budget";
}

export interface Attachment {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
}

export interface FileRef {
  file_name: string;
  file_type: string;
  file_size: number;
}

export interface Chunk {
  messageId: string;
  conversationId: string;
  sender: ChatMessage["sender"];
  chunkType: "text" | "tool";
  text: string;
}

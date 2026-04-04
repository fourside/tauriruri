import type { ChatMessage, Chunk } from "./types.ts";

export function extractChunks(
  message: ChatMessage,
  conversationId: string,
): Chunk[] {
  const chunks: Chunk[] = [];

  if (message.sender === "human") {
    if (message.text) {
      chunks.push({
        messageId: message.uuid,
        conversationId,
        sender: message.sender,
        chunkType: "text",
        text: message.text,
      });
    }
    return chunks;
  }

  // assistant: split content by type
  const textParts: string[] = [];
  const toolParts: string[] = [];

  for (const content of message.content ?? []) {
    switch (content.type) {
      case "text":
        textParts.push(content.text);
        break;
      case "tool_use":
        toolParts.push(`Tool: ${content.name}\nInput: ${JSON.stringify(content.input)}`);
        break;
      case "tool_result": {
        const resultText =
          typeof content.content === "string"
            ? content.content
            : JSON.stringify(content.content);
        toolParts.push(`Result: ${resultText}`);
        break;
      }
      // thinking, token_budget: excluded from embedding
    }
  }

  if (textParts.length > 0) {
    chunks.push({
      messageId: message.uuid,
      conversationId,
      sender: message.sender,
      chunkType: "text",
      text: textParts.join("\n"),
    });
  }

  if (toolParts.length > 0) {
    chunks.push({
      messageId: message.uuid,
      conversationId,
      sender: message.sender,
      chunkType: "tool",
      text: toolParts.join("\n"),
    });
  }

  return chunks;
}

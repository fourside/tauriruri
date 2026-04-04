import { readFileSync } from "node:fs";
import Database from "better-sqlite3";
import type { Chunk, ConversationExport } from "./types.ts";
import { createSchema } from "./schema.ts";
import { extractChunks } from "./chunker.ts";
import { createEmbedder } from "./embedder.ts";

const BATCH_SIZE = 32;

async function main() {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath || !outputPath) {
    console.error("Usage: node src/index.ts <conversations.json> <output.db>");
    process.exit(1);
  }

  console.log(`Reading ${inputPath}...`);
  const conversations: ConversationExport[] = JSON.parse(
    readFileSync(inputPath, "utf-8"),
  );
  console.log(`Loaded ${conversations.length} conversations`);

  const db = new Database(outputPath);
  db.pragma("journal_mode = WAL");
  createSchema(db);

  const modelPath = process.env["RURI_MODEL_PATH"] ?? "cl-nagoya/ruri-v3-310m";
  console.log(`Loading model: ${modelPath}`);
  const embed = await createEmbedder(modelPath);
  console.log("Model loaded");

  const insertConversation = db.prepare(
    "INSERT INTO conversations (id, name, summary, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
  );
  const insertMessage = db.prepare(
    "INSERT INTO messages (id, conversation_id, sender, text, content_json, attachments_json, files_json, created_at, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  );
  const insertChunk = db.prepare(
    "INSERT INTO chunks (message_id, conversation_id, sender, chunk_type, text, embedding) VALUES (?, ?, ?, ?, ?, ?)",
  );

  const allChunks: Chunk[] = [];
  const insertConvBatch = db.transaction((conv: ConversationExport) => {
    insertConversation.run(conv.uuid, conv.name, conv.summary, conv.created_at, conv.updated_at);
    for (let i = 0; i < conv.chat_messages.length; i++) {
      const msg = conv.chat_messages[i];
      insertMessage.run(
        msg.uuid, conv.uuid, msg.sender, msg.text,
        JSON.stringify(msg.content), JSON.stringify(msg.attachments), JSON.stringify(msg.files),
        msg.created_at, i,
      );
      allChunks.push(...extractChunks(msg, conv.uuid));
    }
  });

  console.log("Inserting conversations and messages...");
  for (const conv of conversations) {
    insertConvBatch(conv);
  }
  console.log(`Collected ${allChunks.length} chunks`);

  const insertChunkBatch = db.transaction(
    (chunks: typeof allChunks, embeddings: Float32Array[]) => {
      for (let i = 0; i < chunks.length; i++) {
        const c = chunks[i];
        const buf = Buffer.from(embeddings[i].buffer, embeddings[i].byteOffset, embeddings[i].byteLength);
        insertChunk.run(c.messageId, c.conversationId, c.sender, c.chunkType, c.text, buf);
      }
    },
  );

  console.log("Generating embeddings...");
  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE);
    const embeddings = await embed(batch.map((c) => c.text));
    insertChunkBatch(batch, embeddings);
    console.log(`  ${Math.min(i + BATCH_SIZE, allChunks.length)}/${allChunks.length}`);
  }

  db.close();
  console.log("Done!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

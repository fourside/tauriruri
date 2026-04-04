import type Database from "better-sqlite3";

export function createSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE conversations (
      id TEXT PRIMARY KEY,
      name TEXT,
      summary TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      text TEXT,
      content_json TEXT,
      attachments_json TEXT,
      files_json TEXT,
      created_at TEXT,
      sort_order INTEGER,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    );

    CREATE TABLE chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id TEXT NOT NULL,
      conversation_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      chunk_type TEXT NOT NULL,
      text TEXT,
      embedding BLOB,
      FOREIGN KEY (message_id) REFERENCES messages(id)
    );

    CREATE VIRTUAL TABLE chunks_fts USING fts5(
      text,
      content='chunks',
      content_rowid='id'
    );

    CREATE TRIGGER chunks_ai AFTER INSERT ON chunks BEGIN
      INSERT INTO chunks_fts(rowid, text) VALUES (new.id, new.text);
    END;

    CREATE TABLE file_refs (
      attachment_id TEXT PRIMARY KEY,
      original_name TEXT,
      local_path TEXT
    );
  `);
}

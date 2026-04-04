use rusqlite::{Connection, OpenFlags};
use serde::Serialize;
use std::path::Path;
use std::sync::Mutex;

pub struct Db(pub Mutex<Connection>);

impl Db {
    pub fn open(path: &Path) -> rusqlite::Result<Self> {
        let conn = Connection::open_with_flags(path, OpenFlags::SQLITE_OPEN_READ_ONLY)?;
        Ok(Self(Mutex::new(conn)))
    }
}

#[derive(Debug, Serialize)]
pub struct Conversation {
    pub id: String,
    pub name: Option<String>,
    pub summary: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub message_count: i64,
}

#[derive(Debug, Serialize)]
pub struct Message {
    pub id: String,
    pub sender: String,
    pub text: Option<String>,
    pub content_json: Option<String>,
    pub attachments_json: Option<String>,
    pub files_json: Option<String>,
    pub created_at: Option<String>,
    pub sort_order: i64,
}

#[derive(Debug, Serialize)]
pub struct SearchHit {
    pub conversation_id: String,
    pub conversation_name: Option<String>,
    pub message_id: String,
    pub sender: String,
    pub chunk_type: String,
    pub snippet: String,
    pub rank: f64,
}

#[derive(Debug, Serialize)]
pub struct ChunkEmbedding {
    pub id: i64,
    pub message_id: String,
    pub conversation_id: String,
    pub sender: String,
    pub chunk_type: String,
    pub text: String,
    pub embedding: Vec<f32>,
}

pub fn get_conversations(conn: &Connection) -> rusqlite::Result<Vec<Conversation>> {
    let mut stmt = conn.prepare(
        "SELECT c.id, c.name, c.summary, c.created_at, c.updated_at,
                COALESCE(mc.cnt, 0) as message_count
         FROM conversations c
         LEFT JOIN (SELECT conversation_id, COUNT(*) as cnt FROM messages GROUP BY conversation_id) mc
           ON mc.conversation_id = c.id
         ORDER BY c.updated_at DESC",
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(Conversation {
            id: row.get(0)?,
            name: row.get(1)?,
            summary: row.get(2)?,
            created_at: row.get(3)?,
            updated_at: row.get(4)?,
            message_count: row.get(5)?,
        })
    })?;
    rows.collect()
}

pub fn get_messages(conn: &Connection, conversation_id: &str) -> rusqlite::Result<Vec<Message>> {
    let mut stmt = conn.prepare(
        "SELECT id, sender, text, content_json, attachments_json, files_json, created_at, sort_order
         FROM messages
         WHERE conversation_id = ?1
         ORDER BY sort_order ASC",
    )?;
    let rows = stmt.query_map([conversation_id], |row| {
        Ok(Message {
            id: row.get(0)?,
            sender: row.get(1)?,
            text: row.get(2)?,
            content_json: row.get(3)?,
            attachments_json: row.get(4)?,
            files_json: row.get(5)?,
            created_at: row.get(6)?,
            sort_order: row.get(7)?,
        })
    })?;
    rows.collect()
}

pub fn search_fts(
    conn: &Connection,
    query: &str,
    include_tool: bool,
) -> rusqlite::Result<Vec<SearchHit>> {
    let type_filter = if include_tool {
        ""
    } else {
        "AND ch.chunk_type = 'text'"
    };
    let sql = format!(
        "SELECT ch.conversation_id, c.name, ch.message_id, ch.sender, ch.chunk_type,
                snippet(chunks_fts, 0, '<mark>', '</mark>', '...', 40) as snippet,
                rank
         FROM chunks_fts
         JOIN chunks ch ON ch.id = chunks_fts.rowid
         JOIN conversations c ON c.id = ch.conversation_id
         WHERE chunks_fts MATCH ?1 {type_filter}
         ORDER BY rank
         LIMIT 50"
    );
    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map([query], |row| {
        Ok(SearchHit {
            conversation_id: row.get(0)?,
            conversation_name: row.get(1)?,
            message_id: row.get(2)?,
            sender: row.get(3)?,
            chunk_type: row.get(4)?,
            snippet: row.get(5)?,
            rank: row.get(6)?,
        })
    })?;
    rows.collect()
}

pub fn get_all_embeddings(
    conn: &Connection,
    include_tool: bool,
) -> rusqlite::Result<Vec<ChunkEmbedding>> {
    let type_filter = if include_tool {
        ""
    } else {
        "WHERE chunk_type = 'text'"
    };
    let sql = format!(
        "SELECT id, message_id, conversation_id, sender, chunk_type, text, embedding
         FROM chunks
         {type_filter}"
    );
    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map([], |row| {
        let blob: Vec<u8> = row.get(6)?;
        let embedding = blob
            .chunks_exact(4)
            .map(|b| f32::from_le_bytes([b[0], b[1], b[2], b[3]]))
            .collect();
        Ok(ChunkEmbedding {
            id: row.get(0)?,
            message_id: row.get(1)?,
            conversation_id: row.get(2)?,
            sender: row.get(3)?,
            chunk_type: row.get(4)?,
            text: row.get(5)?,
            embedding,
        })
    })?;
    rows.collect()
}

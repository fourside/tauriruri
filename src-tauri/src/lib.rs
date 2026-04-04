mod db;

use db::Db;
use rusqlite::Connection;
use std::path::PathBuf;

fn with_db<T>(
    state: &tauri::State<'_, Db>,
    f: impl FnOnce(&Connection) -> rusqlite::Result<T>,
) -> Result<T, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    f(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_conversations(state: tauri::State<'_, Db>) -> Result<Vec<db::Conversation>, String> {
    with_db(&state, db::get_conversations)
}

#[tauri::command]
fn get_messages(
    state: tauri::State<'_, Db>,
    conversation_id: String,
) -> Result<Vec<db::Message>, String> {
    with_db(&state, |conn| db::get_messages(conn, &conversation_id))
}

#[tauri::command]
fn search_fts(
    state: tauri::State<'_, Db>,
    query: String,
    include_tool: bool,
) -> Result<Vec<db::SearchHit>, String> {
    with_db(&state, |conn| db::search_fts(conn, &query, include_tool))
}

#[tauri::command]
fn get_all_embeddings(
    state: tauri::State<'_, Db>,
    include_tool: bool,
) -> Result<Vec<db::ChunkEmbedding>, String> {
    with_db(&state, |conn| {
        db::get_all_embeddings(conn, include_tool)
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db_path = std::env::var("CHATS_DB_PATH")
        .map(PathBuf::from)
        .unwrap_or_else(|_| {
            let exe_dir = std::env::current_exe()
                .ok()
                .and_then(|p| p.parent().map(|p| p.to_path_buf()))
                .unwrap_or_else(|| PathBuf::from("."));
            exe_dir.join("chats.db")
        });

    let db = Db::open(&db_path).unwrap_or_else(|e| {
        eprintln!("Failed to open database at {}: {}", db_path.display(), e);
        std::process::exit(1);
    });

    tauri::Builder::default()
        .manage(db)
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_conversations,
            get_messages,
            search_fts,
            get_all_embeddings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

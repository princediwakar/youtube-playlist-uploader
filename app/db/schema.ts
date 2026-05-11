import { sql } from '@vercel/postgres'

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS upload_history (
      id SERIAL PRIMARY KEY,
      video_id VARCHAR(255) NOT NULL,
      title TEXT NOT NULL,
      playlist_id VARCHAR(255),
      file_name TEXT,
      file_size BIGINT,
      media_type VARCHAR(50),
      uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `
}

export interface UploadHistoryRow {
  id: number
  video_id: string
  title: string
  playlist_id: string | null
  file_name: string | null
  file_size: number | null
  media_type: string | null
  uploaded_at: Date
}
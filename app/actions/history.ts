'use server'

import { auth } from '@/lib/auth'
import { sql } from '@vercel/postgres'
import { initDb } from '@/app/db/schema'
import type { UploadHistoryRow } from '@/app/db/schema'

export async function recordUpload(params: {
  videoId: string
  title: string
  playlistId?: string
  fileName?: string
  fileSize?: number
  mediaType?: string
}) {
  const session = await auth()
  if (!session?.accessToken) {
    throw new Error('Not authenticated')
  }

  await initDb()

  await sql`
    INSERT INTO upload_history (video_id, title, playlist_id, file_name, file_size, media_type)
    VALUES (
      ${params.videoId},
      ${params.title},
      ${params.playlistId || null},
      ${params.fileName || null},
      ${params.fileSize || null},
      ${params.mediaType || null}
    )
  `
}

export interface HistoryEntry {
  id: number
  videoId: string
  title: string
  playlistId: string | null
  fileName: string | null
  fileSize: number | null
  mediaType: string | null
  uploadedAt: Date
}

export interface GetUploadHistoryResult {
  success: true
  uploads: HistoryEntry[]
  total: number
}

export async function getUploadHistory(params?: {
  page?: number
  limit?: number
  search?: string
  playlistId?: string
}): Promise<GetUploadHistoryResult> {
  const session = await auth()
  if (!session?.accessToken) {
    throw new Error('Not authenticated')
  }

  const page = params?.page || 1
  const limit = params?.limit || 20
  const offset = (page - 1) * limit
  const playlistId = params?.playlistId

  await initDb()

  let rows;
  let countRows;

  if (playlistId) {
    const result = await sql<UploadHistoryRow>`
      SELECT id, video_id, title, playlist_id, file_name, file_size, media_type, uploaded_at
      FROM upload_history
      WHERE playlist_id = ${playlistId}
      ORDER BY uploaded_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `
    rows = result.rows
    const countResult = await sql`SELECT COUNT(*) as total FROM upload_history WHERE playlist_id = ${playlistId}`
    countRows = countResult.rows
  } else {
    const result = await sql<UploadHistoryRow>`
      SELECT id, video_id, title, playlist_id, file_name, file_size, media_type, uploaded_at
      FROM upload_history
      ORDER BY uploaded_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `
    rows = result.rows
    const countResult = await sql`SELECT COUNT(*) as total FROM upload_history`
    countRows = countResult.rows
  }

  const total = Number(countRows[0]?.total) || 0

  return {
    success: true,
    uploads: rows.map(row => ({
      id: row.id,
      videoId: row.video_id,
      title: row.title,
      playlistId: row.playlist_id,
      fileName: row.file_name,
      fileSize: row.file_size,
      mediaType: row.media_type,
      uploadedAt: row.uploaded_at
    })),
    total
  }
}

export interface UploadStats {
  totalUploads: number
  totalBytes: number
  byMediaType: Record<string, number>
}

export async function getUploadStats(): Promise<{ success: true; stats: UploadStats }> {
  const session = await auth()
  if (!session?.accessToken) {
    throw new Error('Not authenticated')
  }

  await initDb()

  const { rows } = await sql`
    SELECT
      COUNT(*) as total_uploads,
      COALESCE(SUM(file_size), 0) as total_bytes,
      media_type,
      COUNT(*) as type_count
    FROM upload_history
    GROUP BY media_type
  `

  const stats: UploadStats = {
    totalUploads: 0,
    totalBytes: 0,
    byMediaType: {}
  }

  for (const row of rows) {
    const count = Number(row.total_uploads) || 0
    stats.totalUploads += count
    stats.totalBytes += Number(row.total_bytes) || 0
    if (row.media_type) {
      stats.byMediaType[row.media_type] = count
    }
  }

  return { success: true, stats }
}
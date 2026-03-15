export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function parseFilePath(fullPath: string): {
  filename: string
  extension: string
  folder: string
  baseName: string
} {
  // Handle both forward and backslashes
  const normalizedPath = fullPath.replace(/\\/g, '/')
  const lastSlashIndex = normalizedPath.lastIndexOf('/')

  if (lastSlashIndex === -1) {
    // No folder path
    const extensionIndex = fullPath.lastIndexOf('.')
    const filename = fullPath
    const extension = extensionIndex !== -1 ? fullPath.substring(extensionIndex + 1) : ''
    const baseName = extensionIndex !== -1 ? fullPath.substring(0, extensionIndex) : fullPath

    return {
      filename,
      extension,
      folder: '',
      baseName
    }
  }

  const folder = normalizedPath.substring(0, lastSlashIndex)
  const filename = normalizedPath.substring(lastSlashIndex + 1)
  const extensionIndex = filename.lastIndexOf('.')
  const extension = extensionIndex !== -1 ? filename.substring(extensionIndex + 1) : ''
  const baseName = extensionIndex !== -1 ? filename.substring(0, extensionIndex) : filename

  return {
    filename,
    extension,
    folder,
    baseName
  }
}

export function getFolderNameFromPath(path: string): string {
  const parsed = parseFilePath(path)
  if (!parsed.folder) return ''

  // Extract last folder name
  const folderParts = parsed.folder.split('/').filter(part => part.trim() !== '')
  return folderParts.length > 0 ? folderParts[folderParts.length - 1] : ''
}

export function getRelativePath(basePath: string, fullPath: string): string {
  // Simple implementation: remove common prefix
  const baseParts = basePath.replace(/\\/g, '/').split('/').filter(p => p)
  const fullParts = fullPath.replace(/\\/g, '/').split('/').filter(p => p)

  // Find common prefix
  let commonLength = 0
  while (commonLength < baseParts.length &&
         commonLength < fullParts.length &&
         baseParts[commonLength] === fullParts[commonLength]) {
    commonLength++
  }

  // Return remaining path
  return fullParts.slice(commonLength).join('/')
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid Windows characters
    .replace(/\s+/g, ' ')          // Normalize spaces
    .trim()
}

export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - suffix.length) + suffix
}
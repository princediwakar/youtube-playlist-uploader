// app/utils/ffmpegWrapper.ts
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import os from 'os'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)
const unlink = promisify(fs.unlink)

export interface AudioConversionOptions {
  duration?: number
  frameRate?: number
  videoCodec?: string
  audioCodec?: string
  outputFormat?: string
  title?: string
  artist?: string
  album?: string
}

export interface AudioAnalysisResult {
  duration: number
  format: string
  bitrate: number // kbps
  sampleRate: number
  channels: number
  codec: string
  metadata?: {
    title?: string
    artist?: string
    album?: string
    genre?: string
    year?: string
    track?: string
  }
}

/**
 * Convert audio file + thumbnail image to video file for YouTube upload
 */
export async function convertAudioToVideo(
  audioBuffer: Buffer,
  thumbnailBuffer: Buffer,
  audioFileName: string,
  thumbnailFileName: string,
  options: AudioConversionOptions = {}
): Promise<Buffer> {
  const {
    duration = 10,
    frameRate = 1,
    videoCodec = 'libx264',
    audioCodec = 'aac',
    outputFormat = 'mp4'
  } = options

  // Create temporary file paths
  const tempDir = '/tmp'
  const audioTempPath = path.join(tempDir, `conv-audio-${Date.now()}-${audioFileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`)
  const thumbnailTempPath = path.join(tempDir, `conv-thumb-${Date.now()}-${thumbnailFileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`)
  const outputTempPath = path.join(tempDir, `conv-output-${Date.now()}.${outputFormat}`)

  try {
    // Write buffers to temp files
    await writeFile(audioTempPath, audioBuffer)
    await writeFile(thumbnailTempPath, thumbnailBuffer)

    // Convert using FFmpeg
    const videoBuffer = await new Promise<Buffer>((resolve, reject) => {
      const command = ffmpeg()
        .input(thumbnailTempPath)
        .inputOptions([
          '-loop 1',
          `-t ${duration}`,
          `-framerate ${frameRate}`
        ])
        .input(audioTempPath)
        .outputOptions([
          `-c:v ${videoCodec}`,
          `-c:a ${audioCodec}`,
          '-b:a 192k',
          '-pix_fmt yuv420p',
          '-shortest'
        ])
        .output(outputTempPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg conversion started:', commandLine)
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`Conversion progress: ${progress.percent}%`)
          }
        })
        .on('end', async () => {
          try {
            const buffer = await readFile(outputTempPath)
            resolve(buffer)
          } catch (readError) {
            reject(readError)
          }
        })
        .on('error', (err) => {
          reject(new Error(`FFmpeg conversion failed: ${err.message}`))
        })

      command.run()
    })

    return videoBuffer

  } finally {
    // Clean up temp files
    await Promise.allSettled([
      unlink(audioTempPath).catch(() => {}),
      unlink(thumbnailTempPath).catch(() => {}),
      unlink(outputTempPath).catch(() => {})
    ])
  }
}

export interface WaveformVideoOptions {
  width?: number
  height?: number
  waveformColor?: string      // Hex color for the waveform (e.g., '0xff0000')
  backgroundColor?: string    // Hex color for background (e.g., '0x0f0f0f')
  waveMode?: 'point' | 'line' | 'p2p' | 'cline'  // Waveform drawing mode
  fps?: number
  videoCodec?: string
  audioCodec?: string
  outputFormat?: string
  // Metadata display options
  showMetadata?: boolean
  metadata?: {
    title?: string
    artist?: string
    album?: string
    duration?: number
    format?: string
  }
  textColor?: string          // Hex color for text (e.g., '0xffffff')
  fontSize?: number           // Base font size
  showWaveformOnly?: boolean  // If true, only show waveform without metadata
  waveformWidthRatio?: number  // Ratio of waveform width to video width (default 0.6)
  waveformHeightRatio?: number // Ratio of waveform height to video height (default 0.3)
}

/**
 * Convert audio file to an animated waveform visualization video using FFmpeg's showwaves filter.
 * This generates a real animated waveform synced to the audio — not a static image.
 */
export async function convertAudioToWaveformVideo(
  audioBuffer: Buffer,
  audioFileName: string,
  options: WaveformVideoOptions = {}
): Promise<Buffer> {
  const {
    width = 1280,
    height = 720,
    waveformColor = '0xff3333',    
    backgroundColor = '0x0f0f0f',  
    waveMode = 'cline',            
    fps = 30, 
    videoCodec = 'libx264',
    audioCodec = 'aac',
    outputFormat = 'mp4',
    showMetadata = true,
    metadata = {},
    textColor = '0xffffff', // Hex consistency
    fontSize = 48 
  } = options

  const tempDir = '/tmp'
  const audioTempPath = path.join(tempDir, `waveform-audio-${Date.now()}-${audioFileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`)
  const outputTempPath = path.join(tempDir, `waveform-output-${Date.now()}.${outputFormat}`)
  
  // STRATEGIC FIX: Environmental Parity for Fonts
  // Always prefer a bundled font in your repo. Fall back to OS defaults ONLY if missing.
  let fontPath = process.env.FONT_PATH || path.join(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf');
  
  if (!fs.existsSync(fontPath)) {
    console.warn(`[WARNING] Bundled font not found at ${fontPath}. Falling back to system fonts.`);
    const platform = os.platform();
    if (platform === 'darwin') fontPath = '/System/Library/Fonts/Helvetica.ttc';
    else if (platform === 'win32') fontPath = 'C:\\\\Windows\\\\Fonts\\\\arial.ttf';
    else fontPath = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
  }

  try {
    await writeFile(audioTempPath, audioBuffer)

    const videoBuffer = await new Promise<Buffer>((resolve, reject) => {
      const waveformWidth = Math.floor(width * 0.7); 
      const waveformHeight = Math.floor(height * 0.25);
      const waveformX = Math.floor((width - waveformWidth) / 2);
      const waveformY = Math.floor(height * 0.55); 

      const titleText = metadata?.title || audioFileName.replace(/\.[^/.]+$/, '');
      
      // VITAL: Colons MUST be escaped in FFmpeg drawtext to prevent filter chain corruption.
      const escapedTitle = titleText
        .replace(/\\/g, '\\\\\\\\')
        .replace(/'/g, "\\\\?'")
        .replace(/:/g, '\\\\:');

      const filterComplex = [
        `[0:a]showwaves=s=${waveformWidth}x${waveformHeight}:mode=${waveMode}:rate=${fps}:colors=${waveformColor}:scale=cbrt[waves]`,
        `color=c=${backgroundColor}:s=${width}x${height}:r=${fps}[bg]`,
        `[bg][waves]overlay=x=${waveformX}:y=${waveformY}[with_wave]`,
        ...(showMetadata 
            ? [`[with_wave]drawtext=text='${escapedTitle}':fontfile='${fontPath}':fontcolor=${textColor}:fontsize=${fontSize}:shadowcolor=black:shadowx=2:shadowy=2:x=(w-text_w)/2:y=(h/3)[v]`] 
            : [`[with_wave]copy[v]`])
      ].join(';');

      const command = ffmpeg()
        .input(audioTempPath)
        .complexFilter(filterComplex)
        .outputOptions([
          '-map', '[v]',
          '-map', '0:a',
          `-c:v ${videoCodec}`,
          `-crf 18`,             
          `-preset fast`,        
          `-c:a ${audioCodec}`,
          `-b:a 320k`,           
          `-ar 48000`,           
          '-pix_fmt yuv420p',
          '-shortest',           
          '-movflags +faststart' 
        ])
        .output(outputTempPath)
        .on('start', (cmd) => {
          console.log(`[FFmpeg] Started: ${cmd}`);
        })
        .on('progress', (progress) => {
          // Restored progress logging to prevent blind spots
          if (progress.percent) {
             console.log(`[FFmpeg] Processing: ${progress.percent.toFixed(2)}% done`);
          }
        })
        .on('end', async () => resolve(await readFile(outputTempPath)))
        .on('error', (err) => reject(new Error(`FFmpeg failed: ${err.message}`)));

      command.run();
    })

    return videoBuffer

  } finally {
    await Promise.allSettled([
      unlink(audioTempPath).catch(() => {}),
      unlink(outputTempPath).catch(() => {})
    ])
  }
}

/**
 * Analyze audio file using FFprobe
 */
export async function analyzeAudioFile(
  audioBuffer: Buffer,
  audioFileName: string
): Promise<AudioAnalysisResult> {
  const tempDir = '/tmp'
  const audioTempPath = path.join(tempDir, `analyze-audio-${Date.now()}-${audioFileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`)

  try {
    await writeFile(audioTempPath, audioBuffer)

    const metadata = await new Promise<any>((resolve, reject) => {
      ffmpeg.ffprobe(audioTempPath, (err, metadata) => {
        if (err) {
          reject(err)
        } else {
          resolve(metadata)
        }
      })
    })

    const audioStream = metadata.streams.find((stream: any) => stream.codec_type === 'audio')
    const format = metadata.format

    if (!audioStream) {
      throw new Error('No audio stream found in audio file')
    }

    return {
      duration: format.duration || audioStream.duration || 0,
      format: format.format_name || 'unknown',
      bitrate: format.bit_rate ? Math.round(parseInt(format.bit_rate) / 1000) : 0,
      sampleRate: audioStream.sample_rate ? parseInt(audioStream.sample_rate) : 0,
      channels: audioStream.channels || 1,
      codec: audioStream.codec_name || 'unknown',
      metadata: {
        title: format.tags?.title || undefined,
        artist: format.tags?.artist || undefined,
        album: format.tags?.album || undefined,
        genre: format.tags?.genre || undefined,
        year: format.tags?.year || undefined,
        track: format.tags?.track || undefined
      }
    }

  } finally {
    await unlink(audioTempPath).catch(() => {})
  }
}

/**
 * Check if FFmpeg is available on the system
 */
export async function checkFfmpegAvailability(): Promise<boolean> {
  return new Promise((resolve) => {
    ffmpeg.getAvailableFormats((err) => {
      resolve(!err)
    })
  })
}

/**
 * Generate a simple thumbnail for audio files (fallback if no thumbnail provided)
 * Creates a PPM (Portable Pixmap) image that FFmpeg can read
 */
export async function generateSimpleAudioThumbnail(
  title: string,
  artist?: string,
  duration?: number,
  width = 1280,
  height = 720
): Promise<Buffer> {
  // Create a simple PPM (Portable Pixmap) image
  // P6 binary format: "P6\nwidth height\n255\n" followed by RGB bytes

  const bgColor = { r: 15, g: 15, b: 15 };     // #0f0f0f
  const accentColor = { r: 255, g: 51, b: 51 }; // #ff3333
  const textColor = { r: 255, g: 255, b: 255 }; // #ffffff

  // Create header
  const header = `P6\n${width} ${height}\n255\n`;
  const headerBuffer = Buffer.from(header, 'utf-8');

  // Create pixel buffer (width * height * 3 bytes)
  const pixelBuffer = Buffer.alloc(width * height * 3);

  // Fill with background color
  for (let i = 0; i < width * height * 3; i += 3) {
    pixelBuffer[i] = bgColor.r;     // R
    pixelBuffer[i + 1] = bgColor.g; // G
    pixelBuffer[i + 2] = bgColor.b; // B
  }

  // Draw a simple accent rectangle in the center (50% width, 20% height)
  const rectWidth = Math.floor(width * 0.5);
  const rectHeight = Math.floor(height * 0.2);
  const rectX = Math.floor((width - rectWidth) / 2);
  const rectY = Math.floor((height - rectHeight) / 2);

  for (let y = rectY; y < rectY + rectHeight; y++) {
    for (let x = rectX; x < rectX + rectWidth; x++) {
      const index = (y * width + x) * 3;
      pixelBuffer[index] = accentColor.r;
      pixelBuffer[index + 1] = accentColor.g;
      pixelBuffer[index + 2] = accentColor.b;
    }
  }

  // Draw simple text "AUDIO" as block letters (5x7 font)
  const text = "AUDIO";
  const charWidth = 5;
  const charHeight = 7;
  const spacing = 2;
  const textWidth = text.length * (charWidth + spacing) - spacing;
  const textX = Math.floor((width - textWidth) / 2);
  const textY = rectY + Math.floor(rectHeight / 2) - Math.floor(charHeight / 2);

  // Simple 5x7 bitmap font for uppercase letters
  const font: Record<string, number[]> = {
    'A': [0x0E, 0x11, 0x11, 0x1F, 0x11, 0x11, 0x11],
    'U': [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E],
    'D': [0x1E, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1E],
    'I': [0x0E, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0E],
    'O': [0x0E, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E],
  };

  for (let charIndex = 0; charIndex < text.length; charIndex++) {
    const char = text[charIndex];
    const bitmap = font[char] || font['A'];
    const charStartX = textX + charIndex * (charWidth + spacing);

    for (let row = 0; row < charHeight; row++) {
      const rowBits = bitmap[row];
      for (let col = 0; col < charWidth; col++) {
        if (rowBits & (1 << (charWidth - 1 - col))) {
          const x = charStartX + col;
          const y = textY + row;
          if (x >= 0 && x < width && y >= 0 && y < height) {
            const index = (y * width + x) * 3;
            pixelBuffer[index] = textColor.r;
            pixelBuffer[index + 1] = textColor.g;
            pixelBuffer[index + 2] = textColor.b;
          }
        }
      }
    }
  }

  // Combine header and pixel data
  return Buffer.concat([headerBuffer, pixelBuffer]);
}
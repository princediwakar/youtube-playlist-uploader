// app/utils/audioWorker.ts
/**
 * Web Worker for audio analysis to prevent UI blocking
 *
 * This worker handles CPU-intensive audio analysis tasks:
 * - Waveform extraction using Web Audio API
 * - Audio metadata analysis
 * - Large file processing
 */

// Worker message types
export type AudioWorkerMessage =
  | { type: 'ANALYZE_AUDIO'; id: string; arrayBuffer: ArrayBuffer; fileName: string; fileSize: number }
  | { type: 'CANCEL_ANALYZE'; id: string }
  | { type: 'PING' };

export type AudioWorkerResponse =
  | { type: 'ANALYZE_RESULT'; id: string; result: AudioAnalysisResult; error?: never }
  | { type: 'ANALYZE_ERROR'; id: string; error: string }
  | { type: 'ANALYZE_PROGRESS'; id: string; progress: number }
  | { type: 'PONG' };

export interface AudioAnalysisResult {
  duration: number
  waveform: number[]  // Array of amplitude values (100-200 samples)
  audioThumbnail?: string  // Canvas-generated "video frame" (optional, may be generated on main thread)
  artist?: string
  album?: string
  genre?: string
  audioFormat?: string
  bitrate?: number  // kbps
  sampleRate?: number
  channels?: number
}

// Inline worker code as string (to be used with Blob/URL.createObjectURL)
const workerCode = `
self.addEventListener('message', async (event) => {
  const message = event.data;

  if (message.type === 'ANALYZE_AUDIO') {
    const { id, arrayBuffer, fileName, fileSize } = message;

    try {
      // Send initial progress
      self.postMessage({ type: 'ANALYZE_PROGRESS', id, progress: 10 });

      // Feature detection for Web Audio API - use basic analysis if not available
      let result;
      if (!self.AudioContext && !self.webkitAudioContext) {
        // Web Audio API not available - use basic analysis
        self.postMessage({ type: 'ANALYZE_PROGRESS', id, progress: 30 });

        // Generate synthetic waveform
        const samples = 100;
        const waveform = [];
        for (let i = 0; i < samples; i++) {
          const t = i / samples * Math.PI * 4;
          waveform.push(0.3 + 0.2 * Math.sin(t));
        }

        self.postMessage({ type: 'ANALYZE_PROGRESS', id, progress: 50 });

        // Extract metadata from filename
        const metadata = extractAudioMetadata(fileName);

        self.postMessage({ type: 'ANALYZE_PROGRESS', id, progress: 70 });

        // Estimate duration based on file size and format
        const extension = fileName.toLowerCase().split('.').pop() || '';
        let estimatedBitrate = 128000; // 128 kbps default
        if (extension === 'wav' || extension === 'flac') {
          estimatedBitrate = 1411000; // 1411 kbps for lossless
        } else if (extension === 'm4a' || extension === 'aac') {
          estimatedBitrate = 128000;
        } else if (extension === 'ogg') {
          estimatedBitrate = 96000; // 96 kbps typical for OGG
        }

        const estimatedDuration = fileSize * 8 / estimatedBitrate;
        const bitrate = Math.round(estimatedBitrate / 1000);

        self.postMessage({ type: 'ANALYZE_PROGRESS', id, progress: 90 });

        result = {
          duration: estimatedDuration,
          waveform,
          // audioThumbnail will be generated on main thread
          audioFormat: getAudioFormat(fileName),
          bitrate,
          sampleRate: 44100, // Common default
          channels: 2, // Stereo default
          ...metadata
        };
      } else {
        // Web Audio API available - use standard analysis
        const audioContext = new (self.AudioContext || self.webkitAudioContext)();

        self.postMessage({ type: 'ANALYZE_PROGRESS', id, progress: 30 });

        // Decode audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        self.postMessage({ type: 'ANALYZE_PROGRESS', id, progress: 50 });

        // Extract waveform data
        const channelData = audioBuffer.getChannelData(0);
        const samples = 100; // Number of waveform points
        const waveform = extractWaveform(channelData, samples);

        self.postMessage({ type: 'ANALYZE_PROGRESS', id, progress: 70 });

        // Extract metadata
        const metadata = extractAudioMetadata(fileName);

        // Calculate approximate bitrate
        const bitrate = fileSize * 8 / audioBuffer.duration;

        // Clean up
        audioContext.close();

        self.postMessage({ type: 'ANALYZE_PROGRESS', id, progress: 90 });

        result = {
          duration: audioBuffer.duration,
          waveform,
          // audioThumbnail will be generated on main thread
          audioFormat: getAudioFormat(fileName),
          bitrate: Math.round(bitrate / 1000), // kbps
          sampleRate: audioBuffer.sampleRate,
          channels: audioBuffer.numberOfChannels,
          ...metadata
        };
      }

      self.postMessage({
        type: 'ANALYZE_RESULT',
        id,
        result
      });

    } catch (error) {
      self.postMessage({
        type: 'ANALYZE_ERROR',
        id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else if (message.type === 'PING') {
    self.postMessage({ type: 'PONG' });
  }
});

// Helper functions (copied from audioHelpers.ts but adapted for worker context)
function extractWaveform(channelData, samples) {
  const blockSize = Math.floor(channelData.length / samples);
  const waveform = [];

  for (let i = 0; i < samples; i++) {
    const blockStart = i * blockSize;
    const blockEnd = Math.min(blockStart + blockSize, channelData.length);

    if (blockStart >= blockEnd) {
      waveform.push(0);
      continue;
    }

    // Calculate RMS (root mean square) for better visualization
    let sumOfSquares = 0;
    for (let j = blockStart; j < blockEnd; j++) {
      sumOfSquares += channelData[j] * channelData[j];
    }

    const rms = Math.sqrt(sumOfSquares / (blockEnd - blockStart));
    waveform.push(rms);
  }

  return waveform;
}

function extractAudioMetadata(fileName) {
  const metadata = {};

  // Extract basic info from filename as fallback
  const nameWithoutExt = fileName.replace(/\\.[^/.]+$/, '');

  // Simple pattern: "Artist - Song" or "Artist - Album - Song"
  const parts = nameWithoutExt.split(' - ');
  if (parts.length >= 2) {
    metadata.artist = parts[0].trim();

    if (parts.length >= 3) {
      metadata.album = parts[1].trim();
    }
  }

  return metadata;
}

function getAudioFormat(fileName) {
  const extension = fileName.toLowerCase().split('.').pop() || '';

  const formatMap = {
    'mp3': 'MP3',
    'wav': 'WAV',
    'm4a': 'M4A/AAC',
    'flac': 'FLAC',
    'ogg': 'OGG/Vorbis',
    'aac': 'AAC',
    'wma': 'WMA',
    'opus': 'Opus',
    'aiff': 'AIFF',
    'alac': 'ALAC'
  };

  return formatMap[extension] || extension.toUpperCase();
}
`;

/**
 * AudioAnalyzer class that manages web worker for audio analysis
 */
export class AudioAnalyzer {
  private worker: Worker | null = null;
  private pendingRequests: Map<string, {
    resolve: (result: AudioAnalysisResult) => void;
    reject: (error: string) => void;
    onProgress?: (progress: number) => void;
  }> = new Map();

  constructor() {
    this.initializeWorker();
  }

  private initializeWorker(): void {
    try {
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(workerUrl);

      this.worker.onmessage = (event: MessageEvent<AudioWorkerResponse>) => {
        const message = event.data;

        switch (message.type) {
          case 'ANALYZE_RESULT': {
            const request = this.pendingRequests.get(message.id);
            if (request) {
              const result = message.result;
              request.resolve(result);
              this.pendingRequests.delete(message.id);
            }
            break;
          }

          case 'ANALYZE_ERROR': {
            const request = this.pendingRequests.get(message.id);
            if (request) {
              request.reject(message.error);
              this.pendingRequests.delete(message.id);
            }
            break;
          }

          case 'ANALYZE_PROGRESS': {
            const request = this.pendingRequests.get(message.id);
            if (request && request.onProgress) {
              request.onProgress(message.progress);
            }
            break;
          }

          case 'PONG':
            // Worker is alive
            break;
        }
      };

      this.worker.onerror = (error) => {
        console.error('Audio worker error:', error);
        for (const [id, request] of this.pendingRequests.entries()) {
          request.reject('Worker error');
        }
        this.pendingRequests.clear();
        this.worker?.terminate();
        this.worker = null;
      };

    } catch (error) {
      console.error('Failed to initialize audio worker:', error);
      this.worker = null;
    }
  }

  /**
   * Analyze audio file using web worker
   */
  async analyze(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<AudioAnalysisResult> {
    if (!this.worker) {
      throw new Error('Audio worker is not available. Falling back to main thread.');
    }

    const id = `analyze-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Read file as ArrayBuffer (transferable)
      const arrayBuffer = await file.arrayBuffer();

      return new Promise((resolve, reject) => {
        this.pendingRequests.set(id, { resolve, reject, onProgress });

        // Send arrayBuffer to worker (ArrayBuffer is Transferable)
        this.worker!.postMessage({
          type: 'ANALYZE_AUDIO',
          id,
          arrayBuffer,
          fileName: file.name,
          fileSize: file.size
        }, [arrayBuffer]);
      });
    } catch (error) {
      throw new Error(`Failed to read audio file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cancel a pending analysis
   */
  cancel(id: string): void {
    const request = this.pendingRequests.get(id);
    if (request) {
      request.reject('Analysis cancelled');
      this.pendingRequests.delete(id);
    }

    if (this.worker) {
      this.worker.postMessage({
        type: 'CANCEL_ANALYZE',
        id
      });
    }
  }

  /**
   * Check if worker is available
   */
  isAvailable(): boolean {
    return this.worker !== null;
  }

  /**
   * Test worker connection
   */
  async ping(): Promise<boolean> {
    if (!this.worker) {
      return false;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 1000);

      const listener = (event: MessageEvent<AudioWorkerResponse>) => {
        if (event.data.type === 'PONG') {
          clearTimeout(timeout);
          this.worker!.removeEventListener('message', listener);
          resolve(true);
        }
      };

      this.worker.addEventListener('message', listener);
      this.worker.postMessage({ type: 'PING' });
    });
  }

  /**
   * Clean up worker resources
   */
  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.clear();
  }
}

/**
 * Singleton instance for easy access
 */
let globalAnalyzer: AudioAnalyzer | null = null;

export function getAudioAnalyzer(): AudioAnalyzer {
  if (!globalAnalyzer) {
    globalAnalyzer = new AudioAnalyzer();
  }
  return globalAnalyzer;
}

/**
 * Fallback to main thread analysis if worker fails
 */
export async function analyzeAudioWithFallback(
  file: File,
  onProgress?: (progress: number) => void
): Promise<AudioAnalysisResult> {
  const analyzer = getAudioAnalyzer();

  if (analyzer.isAvailable()) {
    try {
      // Test worker connection first
      const isAlive = await analyzer.ping();
      if (isAlive) {
        return analyzer.analyze(file, onProgress);
      }
    } catch (error) {
      console.warn('Audio worker failed, falling back to main thread:', error);
    }
  }

  // Fallback to main thread analysis
  console.log('Using main thread for audio analysis');

  // Import the main thread analyzer
  const { analyzeAudio } = await import('./audioHelpers');
  return analyzeAudio(file);
}
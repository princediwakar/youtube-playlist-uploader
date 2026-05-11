import { NextResponse } from 'next/server'

export const runtime = 'edge'

const ENGINE_HTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body>
<script type="module">
let ffmpeg = null;
let loaded = false;

async function loadFfmpeg() {
  if (loaded) return;
  ffmpeg = new FFmpeg();
  ffmpeg.on('log', ({ message }) => console.log('[engine]', message));
  ffmpeg.on('progress', ({ progress }) => {
    try { parent.postMessage({ type: 'progress', progress: Math.round(progress * 100) }, '*'); } catch {}
  });
  try {
    await ffmpeg.load({
      coreURL: URL.createObjectURL(await fetch('https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js').then(r => r.blob())),
      wasmURL: URL.createObjectURL(await fetch('https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm').then(r => r.blob())),
    });
    loaded = true;
    parent.postMessage({ type: 'loaded' }, '*');
  } catch (err) {
    parent.postMessage({ type: 'error', error: 'ffmpeg-load:' + (err?.message || String(err)) }, '*');
  }
}

async function convert(data, opts) {
  const input = 'input.mp3';
  const output = 'output.mp4';
  const width = opts?.width ?? 1280;
  const height = opts?.height ?? 720;
  const fontSize = opts?.fontSize ?? 28;
  const textColor = opts?.textColor ?? '0xffffff';
  const bgColor = opts?.backgroundColor ?? '0x0f0f0f';
  const waveColor = opts?.waveformColor ?? '0xff3333';
  const showMeta = opts?.showMetadata ?? true;
  const fps = opts?.fps ?? 25;
  const meta = opts?.metadata ?? {};

  await ffmpeg.writeFile(input, new Uint8Array(data));

  let filter;
  if (showMeta && meta?.title) {
    const escaped = meta.title.replace(/'/g, "'\\''").replace(/:/g, '\\:');
    filter = '[0:a]showwaves=s=' + width + 'x' + height + ':mode=cline:colors=' + waveColor + ':fps=' + fps + '[v];[v]drawtext=text=\\'' + escaped + '\\':fontsize=' + fontSize + ':fontcolor=' + textColor + ':x=(w-text_w)/2:y=' + (height - fontSize * 2) + ':borderw=2:bordercolor=0x000000@0.5';
  } else {
    filter = '[0:a]showwaves=s=' + width + 'x' + height + ':mode=cline:colors=' + waveColor + ':fps=' + fps + '[v]';
  }

  try {
    await ffmpeg.exec([
      '-i', input,
      '-filter_complex', filter,
      '-map', '[v]',
      '-frames:v', '150',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '28',
      '-pix_fmt', 'yuv420p',
      '-an',
      output,
    ]);
  } catch (primaryErr) {
    console.warn('[engine] primary filter failed, trying fallback:', primaryErr?.message);
    try {
      await ffmpeg.exec([
        '-i', input,
        '-filter_complex', '[0:a]showwaves=s=' + width + 'x' + height + ':mode=cline:colors=' + waveColor + ':fps=' + fps + '[v]',
        '-map', '[v]',
        '-frames:v', '300',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '28',
        '-pix_fmt', 'yuv420p',
        '-an',
        output,
      ]);
    } catch (fallbackErr) {
      parent.postMessage({ type: 'error', id: opts._id, error: 'convert-failed:' + (fallbackErr?.message || String(fallbackErr)) }, '*');
      return;
    }
  }

  try {
    const out = await ffmpeg.readFile(output);
    await ffmpeg.deleteFile(input);
    await ffmpeg.deleteFile(output);
    parent.postMessage({ type: 'done', id: opts._id, blob: Array.from(new Uint8Array(out)), blobSize: out.byteLength }, '*');
  } catch (readErr) {
    parent.postMessage({ type: 'error', id: opts._id, error: 'read:' + (readErr?.message || String(readErr)) }, '*');
  }
}

self.addEventListener('message', async (e) => {
  const { type, id, file, options } = e.data;
  if (type === 'init') {
    await loadFfmpeg();
    return;
  }
  if (type === 'convert') {
    const opts = Object.assign({}, options, { _id: id });
    await convert(file, opts);
  }
});

parent.postMessage({ type: 'boot' }, '*');
<\/script>
</body>
</html>`

export async function GET() {
  return new NextResponse(ENGINE_HTML, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}
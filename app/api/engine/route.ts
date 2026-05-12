// app/api/engine/route.ts
import { NextResponse } from 'next/server'

export const runtime = 'edge'

const ENGINE_HTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body>
<script src="/ffmpeg/ffmpeg.js"></script>
<script>
(function() {
  let ffmpeg = null;
  let loaded = false;
  let isLoading = false;

  async function loadFfmpeg() {
    if (loaded || isLoading) return;
    isLoading = true;

    try {
      const { FFmpeg } = FFmpegWASM;
      ffmpeg = new FFmpeg();
      
      ffmpeg.on('log', ({ message }) => console.log('[engine]', message));

      // Point to your LOCAL /public/ffmpeg folder
      await ffmpeg.load({
        coreURL: '/ffmpeg/ffmpeg-core.js',
        wasmURL: '/ffmpeg/ffmpeg-core.wasm',
        workerURL: '/ffmpeg/ffmpeg-core.worker.js'
      });
      
      loaded = true;
      isLoading = false;
      parent.postMessage({ type: 'loaded' }, '*');
    } catch (err) {
      isLoading = false;
      parent.postMessage({ type: 'error', error: 'ffmpeg-load:' + err.message }, '*');
    }
  }

  async function convert(data, opts) {
    const input = 'input.mp3';
    const output = 'output.mp4';
    const width = opts && opts.width ? opts.width : 1280;
    const height = opts && opts.height ? opts.height : 720;
    const fontSize = opts && opts.fontSize ? opts.fontSize : 28;
    const textColor = opts && opts.textColor ? opts.textColor : '0xffffff';
    const waveColor = opts && opts.waveformColor ? opts.waveformColor : '0xff3333';
    const showMeta = opts && opts.showMetadata !== false;
    const fps = opts && opts.fps ? opts.fps : 25;
    const meta = opts && opts.metadata ? opts.metadata : {};
    const id = opts && opts._id;

    try {
      await ffmpeg.writeFile(input, new Uint8Array(data));

      let filter;
      if (showMeta && meta && meta.title) {
        const escaped = meta.title.replace(/'/g, "'\\\\'").replace(/:/g, '\\\\:');
        filter = '[0:a]showwaves=s=' + width + 'x' + height + ':mode=cline:colors=' + waveColor + ':fps=' + fps + '[v];[v]drawtext=text=\\'' + escaped + '\\':fontsize=' + fontSize + ':fontcolor=' + textColor + ':x=(w-text_w)/2:y=' + (height - fontSize * 2) + ':borderw=2:bordercolor=0x000000@0.5';
      } else {
        filter = '[0:a]showwaves=s=' + width + 'x' + height + ':mode=cline:colors=' + waveColor + ':fps=' + fps + '[v]';
      }

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

      const out = await ffmpeg.readFile(output);
      
      // TRANSFERABLE LOGIC: Move the buffer, don't copy it.
      const buffer = out.buffer; 
      parent.postMessage({ type: 'done', id: id, buffer: buffer, blobSize: out.byteLength }, '*', [buffer]);
      
      ffmpeg.deleteFile(input);
      ffmpeg.deleteFile(output);
    } catch (primaryErr) {
      console.warn('[engine] primary filter failed, trying fallback:', primaryErr && primaryErr.message);
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

        const out = await ffmpeg.readFile(output);
        const buffer = out.buffer;
        parent.postMessage({ type: 'done', id: id, buffer: buffer, blobSize: out.byteLength }, '*', [buffer]);
        
        ffmpeg.deleteFile(input);
        ffmpeg.deleteFile(output);
      } catch (fallbackErr) {
        parent.postMessage({ type: 'error', id: id, error: 'convert-failed:' + (fallbackErr && fallbackErr.message || String(fallbackErr)) }, '*');
      }
    }
  }

  window.addEventListener('message', (e) => {
    const data = e.data;
    if (!data) return;
    if (data.type === 'init') loadFfmpeg();
    if (data.type === 'convert') {
      const opts = Object.assign({}, data.options, { _id: data.id });
      convert(data.file, opts);
    }
  });

  parent.postMessage({ type: 'boot' }, '*');
})();
</script>
</body>
</html>`

export async function GET() {
  return new NextResponse(ENGINE_HTML, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}
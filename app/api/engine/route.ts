// app/api/engine/route.ts
import { NextResponse } from 'next/server'

export const runtime = 'edge'

const ENGINE_HTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body>
<script src="https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/umd/ffmpeg.js"></script>
<script>
(function() {
  'use strict';
  var ffmpeg = null;
  var loaded = false;

  function waitForFFmpeg(callback) {
    var interval = setInterval(function() {
      if (typeof FFmpegWASM !== 'undefined') {
        clearInterval(interval);
        callback(FFmpegWASM);
      }
    }, 50);
    setTimeout(function() {
      clearInterval(interval);
      parent.postMessage({ type: 'error', error: 'ffmpeg-timeout' }, '*');
    }, 10000);
  }

  var isLoading = false;
function loadFfmpeg() {
    if (loaded || isLoading) return;
    isLoading = true;
    
    // In 0.12.x, the constructor is FFmpegWASM.FFmpeg
    const { FFmpeg } = FFmpegWASM; 
    ffmpeg = new FFmpeg();

    ffmpeg.on('log', ({ message }) => console.log('[engine]', message));
    
    // Direct loading is more stable in the edge runtime/iframe context
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    ffmpeg.load({
        coreURL: baseURL + '/ffmpeg-core.js',
        wasmURL: baseURL + '/ffmpeg-core.wasm',
    }).then(() => {
        loaded = true;
        isLoading = false;
        parent.postMessage({ type: 'loaded' }, '*');
    }).catch(err => {
        isLoading = false;
        parent.postMessage({ type: 'error', error: 'ffmpeg-load:' + err.message }, '*');
    });
  }

  function convert(data, opts) {
    var input = 'input.mp3';
    var output = 'output.mp4';
    var width = opts && opts.width ? opts.width : 1280;
    var height = opts && opts.height ? opts.height : 720;
    var fontSize = opts && opts.fontSize ? opts.fontSize : 28;
    var textColor = opts && opts.textColor ? opts.textColor : '0xffffff';
    var waveColor = opts && opts.waveformColor ? opts.waveformColor : '0xff3333';
    var showMeta = opts && opts.showMetadata !== false;
    var fps = opts && opts.fps ? opts.fps : 25;
    var meta = opts && opts.metadata ? opts.metadata : {};
    var id = opts && opts._id;

    ffmpeg.writeFile(input, new Uint8Array(data)).then(function() {
      var filter;
      if (showMeta && meta && meta.title) {
        var escaped = meta.title.replace(/'/g, "'\\''").replace(/:/g, '\\:');
        filter = '[0:a]showwaves=s=' + width + 'x' + height + ':mode=cline:colors=' + waveColor + ':fps=' + fps + '[v];[v]drawtext=text=\\'' + escaped + '\\':fontsize=' + fontSize + ':fontcolor=' + textColor + ':x=(w-text_w)/2:y=' + (height - fontSize * 2) + ':borderw=2:bordercolor=0x000000@0.5';
      } else {
        filter = '[0:a]showwaves=s=' + width + 'x' + height + ':mode=cline:colors=' + waveColor + ':fps=' + fps + '[v]';
      }

      ffmpeg.exec([
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
      ]).then(function() {
        return ffmpeg.readFile(output);
      }).then(function(out) {
        ffmpeg.deleteFile(input);
        ffmpeg.deleteFile(output);
        parent.postMessage({ type: 'done', id: id, blob: Array.from(new Uint8Array(out)), blobSize: out.byteLength }, '*');
      }).catch(function(readErr) {
        parent.postMessage({ type: 'error', id: id, error: 'read:' + (readErr && readErr.message || String(readErr)) }, '*');
      });
    }).catch(function(primaryErr) {
      console.warn('[engine] primary filter failed, trying fallback:', primaryErr && primaryErr.message);
      ffmpeg.exec([
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
      ]).then(function() {
        return ffmpeg.readFile(output);
      }).then(function(out) {
        ffmpeg.deleteFile(input);
        ffmpeg.deleteFile(output);
        parent.postMessage({ type: 'done', id: id, blob: Array.from(new Uint8Array(out)), blobSize: out.byteLength }, '*');
      }).catch(function(fallbackErr) {
        parent.postMessage({ type: 'error', id: id, error: 'convert-failed:' + (fallbackErr && fallbackErr.message || String(fallbackErr)) }, '*');
      });
    });
  }

self.addEventListener('message', function(e) {
  var data = e.data;
  var type = data && data.type;
  var id = data && data.id;
  var file = data && data.file;
  var options = data && data.options;
  if (type === 'init') {
    loadFfmpeg();
    return;
  }
  if (type === 'convert') {
    var opts = Object.assign({}, options, { _id: id });
    convert(file, opts);
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
# squoosh-mini-starter (PNG → MozJPEG, Squoosh-style)

A minimal, zip‑ready starter that mirrors Squoosh’s architecture for **PNG → MozJPEG**:
- **WebAssembly codec** compiled with **Emscripten** (mozjpeg).
- **Web Worker** that loads the WASM and performs encoding off the main thread.
- **Preact** UI that decodes PNG → `ImageData`, sends to the worker, and downloads the JPEG.
- **Rollup** bundles the UI.
- **COOP/COEP headers** (via `serve.json`) so you can enable threads/SAB later.

> No Next.js. No jsquash. Same style as Squoosh: UI → Worker → WASM codec.

## Prereqs
- Node.js 18+
- pnpm (or npm/yarn)
- Docker (to run Emscripten for building the codec)

## Quick start

```bash
pnpm i
pnpm run build:codec:mozjpeg   # builds mozjpeg_enc.js/mozjpeg_enc.wasm and copies them to /public/codecs/mozjpeg_enc
pnpm run build                 # bundles the UI and copies the worker to /public/dist
pnpm run dev                   # serves public/ with COOP/COEP headers
# open http://localhost:5173
```

### What you should see
- Upload a PNG (or any image the browser can decode).
- Adjust JPEG quality (10–95).
- It downloads a `.jpg` produced by mozjpeg **WASM**.

## Project Layout

```
squoosh-mini-starter/
├─ codecs/
│  └─ mozjpeg_enc/
│     ├─ mozjpeg_enc.cpp     # C++ glue: RGBA → JPEG through mozjpeg
│     ├─ build.sh            # Docker/Emscripten build; outputs JS+WASM and copies to /public
│     └─ README.md
├─ public/
│  ├─ index.html             # Preact mount + loads /dist/main.js
│  └─ codecs/mozjpeg_enc/    # (populated by build.sh)
├─ src/
│  ├─ worker/
│  │  └─ encode.worker.js    # Worker that loads mozjpeg_enc.js and encodes
│  └─ ui/
│     ├─ App.tsx             # UI logic
│     └─ main.tsx            # mount
├─ scripts/
│  └─ copy-worker.mjs        # copies worker → /public/dist
├─ rollup.config.js          # bundles UI (ESM)
├─ serve.json                # COOP/COEP headers
├─ package.json
└─ tsconfig.json
```

## Notes
- This starter passes the pixel buffer to WASM and gets a `Uint8Array` back—same shape Squoosh uses.
- `serve.json` sets COOP/COEP; this is required for high‑perf WASM features (threads, SAB). You can keep it on early.
- The mozjpeg options are minimal (quality, progressive, optimizeCoding, chroma subsampling). You can extend the C++ glue to expose more mozjpeg knobs (trellis, scan optimization, etc.).

## Troubleshooting
- If Docker can’t access your project folder, ensure **file sharing** is enabled for that path.
- For very large images, the browser may need more memory; the build enables `ALLOW_MEMORY_GROWTH`.
- If the worker can’t import the WASM wrapper, confirm that `/public/codecs/mozjpeg_enc/mozjpeg_enc.js` exists after `build:codec:mozjpeg`.

Happy hacking!

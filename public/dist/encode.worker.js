// Web Worker: loads mozjpeg WASM module and encodes ImageData → JPEG bytes.
// The Emscripten module is built to run in a worker (ENVIRONMENT=worker).

async function loadModule() {
  // The build script copies mozjpeg_enc.js/wasm to this public path:
  //   /public/codecs/mozjpeg_enc/mozjpeg_enc.{js,wasm}
  // Emscripten ES6 wrapper exports default factory function.
  const module = await import('/codecs/mozjpeg/enc/mozjpeg_enc.js');
  return module.default();
}

let ModulePromise = null;
onmessage = async (e) => {
  const { type, payload } = e.data || {};
  if (type !== 'ENCODE_JPEG') return;

  try {
    if (!ModulePromise) ModulePromise = loadModule();
    const mod = await ModulePromise;

    const { imageData, opts } = payload;
    const quality = (opts && opts.quality) || 75;
    const progressive = true;
    const optimize_coding = true;
    const chroma_subsample = 2; // 4:2:0

    // Copy ImageData RGBA into a Uint8Array so we can pass it to embind
    const rgba = new Uint8Array(imageData.data.buffer);

    // embind function signature: encode(Uint8Array rgba, width, height, options)
    const res = mod.encode(rgba, imageData.width, imageData.height, {
      ...opts,
      quality,
      // progressive,
      // optimize_coding,
      // chroma_subsample,
    });

    // res is a Uint8Array
    postMessage({ type: 'DONE', payload: res }, [res.buffer]);
  } catch (err) {
    console.log(err);
    postMessage({
      type: 'ERROR',
      payload: String((err && err.message) || err),
    });
  }
};

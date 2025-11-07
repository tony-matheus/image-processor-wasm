/** @jsxImportSource preact */
import { useEffect, useRef, useState } from 'preact/hooks';

export const enum MozJpegColorSpace {
  GRAYSCALE = 1,
  RGB,
  YCbCr,
}

export interface EncodeOptions {
  quality: number;
  baseline: boolean;
  arithmetic: boolean;
  progressive: boolean;
  optimize_coding: boolean;
  smoothing: number;
  color_space: MozJpegColorSpace;
  quant_table: number;
  trellis_multipass: boolean;
  trellis_opt_zero: boolean;
  trellis_opt_table: boolean;
  trellis_loops: number;
  auto_subsample: boolean;
  chroma_subsample: number;
  separate_chroma_quality: boolean;
  chroma_quality: number;
}

export const defaultOptions: EncodeOptions = {
  quality: 75,
  baseline: false,
  arithmetic: false,
  progressive: true,
  optimize_coding: true,
  smoothing: 0,
  color_space: MozJpegColorSpace.YCbCr,
  quant_table: 3,
  trellis_multipass: false,
  trellis_opt_zero: false,
  trellis_opt_table: false,
  trellis_loops: 1,
  auto_subsample: true,
  chroma_subsample: 2,
  separate_chroma_quality: false,
  chroma_quality: 75,
};

export default function App() {
  const workerRef = useRef<Worker | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [quality, setQuality] = useState(75);

  useEffect(() => {
    workerRef.current = new Worker('/dist/encode.worker.js', {
      type: 'module',
    });
    return () => workerRef.current?.terminate();
  }, []);

  const onFile = async (f: File) => {
    if (!f && !canvasRef.current) return;
    const imgBitmap = await createImageBitmap(f);

    const canvas = canvasRef.current!;
    canvas.width = imgBitmap.width;
    canvas.height = imgBitmap.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(imgBitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const w = workerRef.current!;
    const result: Uint8Array = await new Promise((resolve) => {
      const handler = (e: MessageEvent) => {
        if (e.data?.type === 'DONE') {
          w.removeEventListener('message', handler);
          resolve(new Uint8Array(e.data.payload));
        }
      };
      w.addEventListener('message', handler);
      w.postMessage({
        type: 'ENCODE_JPEG',
        payload: { imageData, opts: { ...defaultOptions, quality } },
      });
    });

    let blobUrl: string = '';

    if (processedCanvasRef.current) {
      const processedCanvas = processedCanvasRef.current;
      // Assume original image dimensions
      processedCanvas.width = canvas.width;
      processedCanvas.height = canvas.height;
      const ctx = processedCanvas.getContext('2d');
      if (ctx) {
        // Create a Blob and Image for decoding
        const blob = new Blob([result], { type: 'image/jpeg' });
        blobUrl = URL.createObjectURL(blob);
        const img = new window.Image();
        img.onload = () => {
          ctx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
          ctx.drawImage(
            img,
            0,
            0,
            processedCanvas.width,
            processedCanvas.height
          );
          URL.revokeObjectURL(blobUrl);
        };
        img.onerror = () => {
          URL.revokeObjectURL(blobUrl);
        };
        img.src = blobUrl;
      }
    }
    // console.log(result);
    const blob = new Blob([result], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = f.name.replace(/\.[^/.]+$/, '') + '.jpg';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 16, fontFamily: 'ui-sans-serif, system-ui' }}>
      <h1 style={{ margin: '8px 0' }}>PNG → MozJPEG (WASM)</h1>
      <p style={{ margin: '4px 0 12px' }}>
        Drop a PNG, pick quality, get a real mozjpeg-compressed JPEG.
      </p>
      <input
        type='file'
        accept='image/*'
        onChange={(e) =>
          e.currentTarget.files && onFile(e.currentTarget.files[0])
        }
      />
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          maxWidth: '50vw',
        }}
      >
        <canvas ref={canvasRef} style={{ width: '100%', height: 'auto' }} />
        <canvas
          ref={processedCanvasRef}
          style={{ width: '100%', height: 'auto' }}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={{ display: 'block', marginBottom: 4 }}>
          Quality: {quality}
        </label>
        <input
          type='range'
          min={10}
          max={95}
          value={quality}
          onInput={(e) =>
            setQuality(Number((e.target as HTMLInputElement).value))
          }
        />
      </div>
    </div>
  );
}

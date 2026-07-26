import { useEffect, useRef, useState, useCallback } from 'react';
import { X, AlertCircle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';
pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();

interface Props {
  isOpen: boolean;
  title: string;
  data: ArrayBuffer;
  onClose: () => void;
}

export default function SheetViewer({ isOpen, title, data, onClose }: Props) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !data) return;
    let cancelled = false;

    async function load() {
      setError('');
      setLoading(true);
      setPages([]);

      if (data.byteLength === 0) {
        setError('No sheet music attached.');
        setLoading(false);
        return;
      }

      try {
        const pdf = await pdfjsLib.getDocument({ data: data.slice(0) }).promise;
        if (cancelled) return;
        const urls: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d')!;
          await page.render({ canvasContext: ctx, viewport }).promise;
          urls.push(canvas.toDataURL());
        }
        if (!cancelled) setPages(urls);
      } catch (e: any) {
        if (!cancelled) setError('Failed to load PDF: ' + (e.message || 'Unknown error'));
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [isOpen, data]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      backgroundColor: 'rgba(0,0,0,0.95)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', backgroundColor: '#1a1a2e', color: '#fff',
        flexShrink: 0,
      }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}>
          <X className="w-5 h-5" />
        </button>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{title}</span>
        <span style={{ fontSize: 12, color: '#666' }}>{pages.length > 0 ? `${pages.length} page${pages.length > 1 ? 's' : ''}` : ''}</span>
      </div>

      <div
        ref={containerRef}
        style={{
          flex: 1, overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {loading ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            Loading sheet music...
          </div>
        ) : error ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
            <div style={{ textAlign: 'center' }}>
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-400" />
              <p style={{ fontSize: 14 }}>{error}</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0' }}>
            {pages.map((url, i) => (
              <img
                key={i}
                src={url}
                draggable={false}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

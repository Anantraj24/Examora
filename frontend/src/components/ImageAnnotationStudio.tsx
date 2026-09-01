import React, { useRef, useState, useEffect } from 'react';
import { 
  Square, CheckCircle2, XCircle, Type, RotateCcw, 
  Trash2, PenTool, Sparkles, Download
} from 'lucide-react';

interface ImageAnnotationStudioProps {
  imageSrc?: string;
  onSaveAnnotations?: (annotations: any[]) => void;
}

type AnnoTool = 'rect' | 'check' | 'cross' | 'pen' | 'text';

export const ImageAnnotationStudio: React.FC<ImageAnnotationStudioProps> = ({
  imageSrc,
  onSaveAnnotations,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<AnnoTool>('rect');
  const [color, setColor] = useState<string>('#10B981');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [annotations, setAnnotations] = useState<any[]>([]);

  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const snapshot = useRef<ImageData | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 640;
    canvas.height = 360;

    // Draw background placeholder or student diagram
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw simulated B-tree diagram or grid if no image
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let j = 0; j < canvas.height; j += 40) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(canvas.width, j);
      ctx.stroke();
    }

    // Student diagram mockup lines
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#0F172A';
    // Root node
    ctx.fillRect(260, 40, 120, 40);
    ctx.strokeRect(260, 40, 120, 40);
    ctx.fillStyle = '#FFF';
    ctx.font = '14px monospace';
    ctx.fillText('Root: [10]', 285, 65);

    // Left child
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(140, 140, 120, 40);
    ctx.strokeRect(140, 140, 120, 40);
    ctx.fillStyle = '#FFF';
    ctx.fillText('Left: [5, 6]', 160, 165);

    // Right child
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(380, 140, 140, 40);
    ctx.strokeRect(380, 140, 140, 40);
    ctx.fillStyle = '#FFF';
    ctx.fillText('Right: [12, 20, 30]', 390, 165);

    // Connectors
    ctx.strokeStyle = '#94A3B8';
    ctx.beginPath();
    ctx.moveTo(300, 80);
    ctx.lineTo(200, 140);
    ctx.moveTo(340, 80);
    ctx.lineTo(450, 140);
    ctx.stroke();
  }, [imageSrc]);

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    startPos.current = { x, y };
    snapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setIsDrawing(true);

    if (tool === 'check') {
      ctx.fillStyle = '#10B981';
      ctx.font = '24px sans-serif';
      ctx.fillText('✓ Correct', x - 10, y + 8);
      setIsDrawing(false);
    } else if (tool === 'cross') {
      ctx.fillStyle = '#EF4444';
      ctx.font = '24px sans-serif';
      ctx.fillText('✗ Needs split', x - 10, y + 8);
      setIsDrawing(false);
    } else if (tool === 'text') {
      ctx.fillStyle = '#FBBF24';
      ctx.font = '13px sans-serif';
      ctx.fillText('+2.5 pts: Valid balance', x, y);
      setIsDrawing(false);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || (tool !== 'rect' && tool !== 'pen')) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    if (snapshot.current && tool === 'rect') {
      ctx.putImageData(snapshot.current, 0, 0);
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    if (tool === 'rect') {
      const w = x - startPos.current.x;
      const h = y - startPos.current.y;
      ctx.strokeRect(startPos.current.x, startPos.current.y, w, h);
    } else if (tool === 'pen') {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDraw = () => {
    setIsDrawing(false);
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: '12px',
      border: '1px solid var(--border-subtle)',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    }}>
      {/* Examiner Annotation Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className={`btn ${tool === 'rect' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 10px', fontSize: '0.75rem' }}
            onClick={() => { setTool('rect'); setColor('#10B981'); }}
          >
            <Square size={13} />
            Highlight Box
          </button>

          <button
            className={`btn ${tool === 'check' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 10px', fontSize: '0.75rem', color: '#6EE7B7' }}
            onClick={() => { setTool('check'); setColor('#10B981'); }}
          >
            <CheckCircle2 size={13} />
            Mark Correct
          </button>

          <button
            className={`btn ${tool === 'cross' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 10px', fontSize: '0.75rem', color: '#FCA5A5' }}
            onClick={() => { setTool('cross'); setColor('#EF4444'); }}
          >
            <XCircle size={13} />
            Mark Error
          </button>

          <button
            className={`btn ${tool === 'text' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 10px', fontSize: '0.75rem', color: '#FCD34D' }}
            onClick={() => { setTool('text'); setColor('#F59E0B'); }}
          >
            <Type size={13} />
            Sticky Note
          </button>
        </div>

        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Click or drag on image to annotate student diagram
        </span>
      </div>

      {/* Canvas */}
      <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair' }}
        />
      </div>
    </div>
  );
};

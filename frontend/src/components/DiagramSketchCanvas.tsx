import React, { useRef, useState, useEffect } from 'react';
import { 
  PenTool, Eraser, Square, Circle, Minus, RotateCcw, 
  Trash2, Download, CheckCircle, Grid, Palette, Sparkles
} from 'lucide-react';

interface DiagramSketchCanvasProps {
  initialImage?: string;
  onSave: (base64Image: string) => void;
}

type ToolType = 'pen' | 'line' | 'rect' | 'circle' | 'eraser';

export const DiagramSketchCanvas: React.FC<DiagramSketchCanvasProps> = ({ initialImage, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState<string>('#6366F1');
  const [lineWidth, setLineWidth] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);

  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const snapshot = useRef<ImageData | null>(null);

  // Colors available
  const colors = ['#6366F1', '#38BDF8', '#10B981', '#F59E0B', '#EF4444', '#FFFFFF'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high DPI canvas
    canvas.width = 800;
    canvas.height = 420;

    // Initial white or transparent background
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save initial state to history
    saveState();
  }, []);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-15), imgData]);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    newHistory.pop(); // Remove current state
    const previousState = newHistory[newHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setHistory(newHistory);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
    setHasDrawn(false);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
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

    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.strokeStyle = '#0F172A';
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === 'pen') {
      ctx.strokeStyle = color;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      // Shape tools need snapshot restore to avoid trails
      if (snapshot.current) {
        ctx.putImageData(snapshot.current, 0, 0);
      }
      ctx.strokeStyle = color;

      if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startPos.current.x, startPos.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (tool === 'rect') {
        const w = x - startPos.current.x;
        const h = y - startPos.current.y;
        ctx.beginPath();
        ctx.strokeRect(startPos.current.x, startPos.current.y, w, h);
      } else if (tool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(x - startPos.current.x, 2) + Math.pow(y - startPos.current.y, 2)
        );
        ctx.beginPath();
        ctx.arc(startPos.current.x, startPos.current.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setHasDrawn(true);
    saveState();

    // Auto-propagate base64 image answer
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '12px',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        {/* Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            className={`btn ${tool === 'pen' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => setTool('pen')}
          >
            <PenTool size={14} />
            Pen
          </button>

          <button
            type="button"
            className={`btn ${tool === 'line' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => setTool('line')}
          >
            <Minus size={14} />
            Line
          </button>

          <button
            type="button"
            className={`btn ${tool === 'rect' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => setTool('rect')}
          >
            <Square size={14} />
            Box
          </button>

          <button
            type="button"
            className={`btn ${tool === 'circle' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => setTool('circle')}
          >
            <Circle size={14} />
            Circle
          </button>

          <button
            type="button"
            className={`btn ${tool === 'eraser' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => setTool('eraser')}
          >
            <Eraser size={14} />
            Eraser
          </button>
        </div>

        {/* Color Palette */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setColor(c);
                if (tool === 'eraser') setTool('pen');
              }}
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: c,
                border: color === c ? '2px solid #FFF' : '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                transform: color === c ? 'scale(1.2)' : 'none',
                transition: 'all 0.15s ease'
              }}
            />
          ))}
        </div>

        {/* Stroke width */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span>Width:</span>
          <input
            type="range"
            min="2"
            max="12"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            style={{ width: '70px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
            onClick={handleUndo}
            title="Undo"
          >
            <RotateCcw size={14} />
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#F87171' }}
            onClick={handleClear}
            title="Clear Diagram"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Canvas Area with Grid */}
      <div style={{
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
        background: '#0F172A',
        backgroundImage: showGrid 
          ? 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)' 
          : 'none',
        backgroundSize: '20px 20px',
        cursor: tool === 'eraser' ? 'cell' : 'crosshair'
      }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />

        {!hasDrawn && (
          <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.2)',
            fontSize: '0.9rem',
            gap: '8px'
          }}>
            <Sparkles size={16} />
            <span>Draw or sketch your handwritten diagram directly on this canvas</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span>Status: {hasDrawn ? 'Diagram snapshot saved with answer payload' : 'Blank canvas'}</span>
        <span style={{ color: '#10B981' }}>High-Res Vector Snap Ready</span>
      </div>
    </div>
  );
};

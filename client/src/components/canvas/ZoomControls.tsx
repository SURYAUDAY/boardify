import { Minus, Plus, Maximize2 } from 'lucide-react';
import { useWhiteboardStore } from '../../store/whiteboardStore';

export default function ZoomControls() {
  const zoom = useWhiteboardStore((s) => s.zoom);
  const setZoom = useWhiteboardStore((s) => s.setZoom);
  const resetViewport = useWhiteboardStore((s) => s.resetViewport);

  return (
    <div className="fixed bottom-6 right-6 z-20 bg-white rounded-full shadow flex items-center">
      <button
        onClick={() => setZoom(zoom - 0.1)}
        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-l-full"
        title="Zoom out"
      >
        <Minus className="w-4 h-4" />
      </button>
      <button
        onClick={resetViewport}
        className="w-14 text-center text-[13px] text-gray-700 hover:bg-gray-50 h-8"
        title="Reset zoom and pan"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        onClick={() => setZoom(zoom + 0.1)}
        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100"
        title="Zoom in"
      >
        <Plus className="w-4 h-4" />
      </button>
      <button
        onClick={resetViewport}
        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-r-full border-l border-gray-200"
        title="Reset viewport"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

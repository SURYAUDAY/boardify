import { Minus, Plus } from 'lucide-react';
import { useWhiteboardStore } from '../../store/whiteboardStore';

export default function ZoomControls() {
  const zoom = useWhiteboardStore((s) => s.zoom);
  const setZoom = useWhiteboardStore((s) => s.setZoom);

  return (
    <div className="fixed bottom-6 right-6 z-20 bg-white rounded-full shadow flex items-center">
      <button
        onClick={() => setZoom(Math.max(0.25, zoom - 0.1))}
        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-l-full"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="w-14 text-center text-[13px] text-gray-700">{Math.round(zoom * 100)}%</span>
      <button
        onClick={() => setZoom(Math.min(4, zoom + 0.1))}
        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-r-full"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

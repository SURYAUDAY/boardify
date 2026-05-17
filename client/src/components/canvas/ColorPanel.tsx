import { useWhiteboardStore } from '../../store/whiteboardStore';

const COLORS = [
  '#000000', '#4B5563', '#EF4444', '#F97316', '#EAB308',
  '#22C55E', '#3B82F6', '#A855F7', '#EC4899', '#FFFFFF',
];

const WIDTHS = [
  { width: 1, h: 1 },
  { width: 3, h: 3 },
  { width: 6, h: 6 },
];

export default function ColorPanel() {
  const activeTool = useWhiteboardStore((s) => s.activeTool);
  const activeColor = useWhiteboardStore((s) => s.activeColor);
  const strokeWidth = useWhiteboardStore((s) => s.strokeWidth);
  const setColor = useWhiteboardStore((s) => s.setColor);
  const setStrokeWidth = useWhiteboardStore((s) => s.setStrokeWidth);

  const shouldShow = ['pen', 'line', 'arrow', 'rect', 'circle', 'text'].includes(activeTool);
  if (!shouldShow) return null;

  return (
    <div className="fixed left-12 top-1/2 -translate-y-1/2 z-20 bg-white rounded-xl shadow p-4 w-[180px]">
      <p className="text-[11px] uppercase text-gray-500 tracking-wider mb-2">Color</p>
      <div className="grid grid-cols-5 gap-2">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`w-5 h-5 rounded-full border border-gray-200 transition ${
              activeColor === c ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
            }`}
            style={{ background: c }}
            aria-label={c}
          />
        ))}
      </div>
      <p className="text-[11px] uppercase text-gray-500 tracking-wider mt-4 mb-2">Stroke width</p>
      <div className="flex items-center justify-around">
        {WIDTHS.map((w) => (
          <button
            key={w.width}
            onClick={() => setStrokeWidth(w.width)}
            className={`flex-1 h-8 mx-0.5 flex items-center justify-center rounded transition ${
              strokeWidth === w.width ? 'bg-indigo-50' : 'hover:bg-gray-100'
            }`}
          >
            <div className="w-8 rounded-full bg-gray-800" style={{ height: w.h }} />
          </button>
        ))}
      </div>
    </div>
  );
}

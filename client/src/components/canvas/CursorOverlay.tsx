import { useWhiteboardStore } from '../../store/whiteboardStore';

export default function CursorOverlay() {
  const cursors = useWhiteboardStore((s) => s.cursors);
  const zoom = useWhiteboardStore((s) => s.zoom);
  // Counter-scale the cursor visuals so they stay at constant screen size
  // even when the parent wrapper is scaled by zoom.
  const invZoom = 1 / zoom;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Object.values(cursors).map((c) => (
        <div
          key={c.userId}
          className="absolute"
          style={{
            left: 0,
            top: 0,
            transformOrigin: '0 0',
            transform: `translate(${c.x}px, ${c.y}px) scale(${invZoom})`,
            transition: 'transform 50ms linear',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" style={{ display: 'block' }}>
            <path d="M1 1 L1 11 L4 8 L7 13 L9 12 L6 7 L11 7 Z" fill={c.avatar} stroke="#000" strokeWidth="0.5" />
          </svg>
          <div
            className="absolute left-3 top-3 px-2 h-6 flex items-center text-white text-[12px] rounded-full whitespace-nowrap"
            style={{ background: c.avatar }}
          >
            {c.name}
          </div>
        </div>
      ))}
    </div>
  );
}

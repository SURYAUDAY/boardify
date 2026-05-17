import { useWhiteboardStore } from '../../store/whiteboardStore';

export default function DrawingIndicators() {
  const indicators = useWhiteboardStore((s) => s.drawingIndicators);
  const list = Object.values(indicators);

  if (list.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 flex flex-col gap-2 z-20">
      {list.map((d) => (
        <div
          key={d.userId}
          className="bg-[#1E293B] rounded-lg shadow-lg px-3 py-1.5 flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full" style={{ background: d.avatar }} />
          <span className="text-white text-[13px]">{d.name} is drawing...</span>
        </div>
      ))}
    </div>
  );
}

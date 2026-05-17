import {
  MousePointer, PenLine, Eraser, Minus, MoveRight, Square, Circle,
  Type, StickyNote, Hand,
} from 'lucide-react';
import type { Tool } from '@shared/types';
import { useWhiteboardStore } from '../../store/whiteboardStore';

const TOOLS: { tool: Tool; icon: React.ElementType; label: string; shortcut: string }[] = [
  { tool: 'select', icon: MousePointer, label: 'Select', shortcut: 'V' },
  { tool: 'pen', icon: PenLine, label: 'Pen', shortcut: 'P' },
  { tool: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E' },
  { tool: 'line', icon: Minus, label: 'Line', shortcut: 'L' },
  { tool: 'arrow', icon: MoveRight, label: 'Arrow', shortcut: 'A' },
  { tool: 'rect', icon: Square, label: 'Rectangle', shortcut: 'R' },
  { tool: 'circle', icon: Circle, label: 'Circle', shortcut: 'C' },
  { tool: 'text', icon: Type, label: 'Text', shortcut: 'T' },
  { tool: 'sticky', icon: StickyNote, label: 'Sticky note', shortcut: 'S' },
  { tool: 'pan', icon: Hand, label: 'Pan', shortcut: 'H' },
];

const DIVIDERS_AFTER = new Set<Tool>(['select', 'eraser', 'circle', 'sticky']);

interface Props {
  readOnly?: boolean;
  onReadOnlyClick?: () => void;
}

export default function CanvasToolbar({ readOnly = false, onReadOnlyClick }: Props = {}) {
  const activeTool = useWhiteboardStore((s) => s.activeTool);
  const setActiveTool = useWhiteboardStore((s) => s.setActiveTool);

  return (
    <div
      className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-20 bg-white rounded-full shadow-xl p-2 flex items-center gap-0.5 ${
        readOnly ? 'opacity-50' : ''
      }`}
    >
      {TOOLS.map((t) => {
        const Icon = t.icon;
        const isActive = activeTool === t.tool;
        return (
          <div key={t.tool} className="flex items-center">
            <button
              title={`${t.label} (${t.shortcut})`}
              onClick={() => {
                if (readOnly) {
                  onReadOnlyClick?.();
                  return;
                }
                setActiveTool(t.tool);
              }}
              className={`w-9 h-9 flex items-center justify-center rounded transition ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${readOnly ? 'cursor-not-allowed' : ''}`}
            >
              <Icon className="w-4 h-4" />
            </button>
            {DIVIDERS_AFTER.has(t.tool) && <div className="w-px h-6 bg-gray-200 mx-1" />}
          </div>
        );
      })}
    </div>
  );
}

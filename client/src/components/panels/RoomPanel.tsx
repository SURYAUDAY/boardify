import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWhiteboardStore } from '../../store/whiteboardStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

export default function RoomPanel({ isOpen, onClose }: Props) {
  const participants = useWhiteboardStore((s) => s.participants);
  const board = useWhiteboardStore((s) => s.board);
  const [copyState, setCopyState] = useState(false);

  const shareUrl =
    board?.shareToken && typeof window !== 'undefined'
      ? `${window.location.origin}/board/${board.shareToken}`
      : '';

  function copyLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopyState(true);
    toast.success('Link copied!');
    setTimeout(() => setCopyState(false), 2000);
  }

  return (
    <div
      className={`fixed top-[52px] right-0 bottom-0 w-[280px] bg-[#1E293B] border-l border-[#334155] rounded-l-xl shadow-xl z-30 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="h-[52px] px-4 border-b border-[#334155] flex items-center justify-between">
        <span className="text-white text-[14px] font-semibold">In this board</span>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100% - 220px)' }}>
        {participants.length === 0 && (
          <div className="px-4 py-6 text-[13px] text-gray-400 text-center">
            Just you here right now.
          </div>
        )}
        {participants.map((p) => (
          <div
            key={p.userId}
            className="h-[52px] px-3 flex items-center gap-3 hover:bg-white/5"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-semibold flex-shrink-0"
              style={{ background: p.avatar }}
            >
              {initials(p.name)}
            </div>
            <div className="flex-grow min-w-0">
              <div className="text-white text-[14px] truncate">
                {p.name}
                {p.isCurrentUser && (
                  <span className="ml-2 text-[11px] text-gray-400">You</span>
                )}
              </div>
            </div>
            <div
              className={`w-2 h-2 rounded-full ${
                p.status === 'online'
                  ? 'bg-green-500'
                  : p.status === 'idle'
                  ? 'bg-yellow-500'
                  : 'bg-gray-500'
              }`}
            />
          </div>
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#334155]">
        <div className="text-[13px] font-semibold text-white mb-2">Invite others</div>
        <div className="flex gap-2">
          <input
            readOnly
            value={shareUrl}
            className="flex-grow bg-[#0F172A] text-[12px] text-gray-400 rounded-lg px-2 py-1.5 outline-none truncate"
          />
          <button
            onClick={copyLink}
            className="bg-indigo-500 hover:bg-indigo-600 text-white text-[12px] px-3 rounded-lg font-medium"
          >
            {copyState ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}

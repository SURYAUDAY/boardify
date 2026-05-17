import { useWhiteboardStore } from '../../store/whiteboardStore';
import StickyNote from './StickyNote';
import type { StickyNote as StickyNoteType } from '@shared/types';

interface Props {
  onUpdate?: (id: string, partial: Partial<StickyNoteType>) => void;
  onDelete?: (id: string) => void;
}

export default function StickyNotesLayer({ onUpdate, onDelete }: Props) {
  const stickyNotes = useWhiteboardStore((s) => s.stickyNotes);
  const updateStickyNote = useWhiteboardStore((s) => s.updateStickyNote);
  const removeStickyNote = useWhiteboardStore((s) => s.removeStickyNote);
  const user = useWhiteboardStore((s) => s.user);

  function handleUpdate(id: string, partial: Partial<StickyNoteType>) {
    updateStickyNote(id, partial);
    onUpdate?.(id, partial);
  }

  function handleDelete(id: string) {
    removeStickyNote(id);
    onDelete?.(id);
  }

  if (!user) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {stickyNotes.map((note) => (
        <StickyNote
          key={note.id}
          note={note}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          currentUserId={user.id}
        />
      ))}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Grid, Users, Clock, LogOut, Search, Plus, X,
  Share2, MoreVertical, Presentation, Sparkles,
} from 'lucide-react';
import api from '../lib/api';
import { useWhiteboardStore } from '../store/whiteboardStore';
import BoardCardSkeleton from '../components/ui/BoardCardSkeleton';
import EmptyState from '../components/ui/EmptyState';

interface BoardItem {
  _id: string;
  title: string;
  description?: string;
  updatedAt: string;
  collaborators: { user: string; role: string }[];
  owner: string | { _id: string; name: string };
}

type Filter = 'all' | 'recent' | 'shared';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function NewBoardModal({ onClose, onCreate }: { onClose: () => void; onCreate: (b: BoardItem) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/boards', { title, description, isPublic });
      onCreate(res.data);
      toast.success('Board created');
      onClose();
    } catch {
      toast.error('Failed to create board');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-[#1E293B] rounded-2xl w-[440px] max-w-full p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-white">Create new board</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled board"
              className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white placeholder-[#64748B] focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={3}
              className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white placeholder-[#64748B] focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white">{isPublic ? 'Public' : 'Private'}</span>
            <button
              type="button"
              onClick={() => setIsPublic((v) => !v)}
              className={`w-11 h-6 rounded-full relative transition ${isPublic ? 'bg-indigo-500' : 'bg-gray-600'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition ${isPublic ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-white hover:bg-white/5 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white font-semibold rounded-lg transition"
            >
              Create board
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useWhiteboardStore((s) => s.user);
  const token = useWhiteboardStore((s) => s.token);
  const logout = useWhiteboardStore((s) => s.logout);

  const [boards, setBoards] = useState<BoardItem[] | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    api.get('/boards')
      .then((res) => setBoards(res.data))
      .catch(() => setBoards([]));
  }, [token, navigate]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this board?')) return;
    try {
      await api.delete(`/boards/${id}`);
      setBoards((bs) => (bs || []).filter((b) => b._id !== id));
      toast.success('Board deleted');
    } catch {
      toast.error('Failed to delete');
    }
    setMenuOpenFor(null);
  }

  function startRename(b: BoardItem) {
    setRenamingId(b._id);
    setRenameValue(b.title);
    setMenuOpenFor(null);
  }

  async function commitRename() {
    if (!renamingId) return;
    const newTitle = renameValue.trim();
    if (!newTitle) {
      setRenamingId(null);
      return;
    }
    try {
      const res = await api.patch(`/boards/${renamingId}`, { title: newTitle });
      setBoards((bs) =>
        (bs || []).map((b) => (b._id === renamingId ? { ...b, title: res.data.title } : b))
      );
      toast.success('Renamed');
    } catch {
      toast.error('Failed to rename');
    } finally {
      setRenamingId(null);
    }
  }

  const filterTitle = filter === 'shared' ? 'Shared with me' : filter === 'recent' ? 'Recent' : 'My Boards';

  const filtered = (boards || [])
    .filter((b) => b.title.toLowerCase().includes(query.toLowerCase()))
    .filter((b) => {
      if (filter === 'shared') {
        const ownerId = typeof b.owner === 'string' ? b.owner : b.owner._id;
        return user && ownerId !== user.id;
      }
      return true;
    })
    .sort((a, b) => {
      if (filter === 'recent') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return 0;
    });

  const navItems: { icon: typeof Grid; label: string; value: Filter }[] = [
    { icon: Grid, label: 'My Boards', value: 'all' },
    { icon: Users, label: 'Shared with me', value: 'shared' },
    { icon: Clock, label: 'Recent', value: 'recent' },
  ];

  return (
    <div className="min-h-screen flex bg-[#0F172A] font-sans">
      {/* Sidebar */}
      <aside className="w-60 bg-[#1E293B] flex flex-col">
        <div className="p-5 flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-white">Boardify</span>
        </div>
        <nav className="px-3 flex-grow">
          {navItems.map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={`w-full flex items-center gap-3 h-11 px-3 rounded-lg mb-1 transition ${
                filter === item.value
                  ? 'bg-indigo-500/10 text-indigo-400'
                  : 'text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 flex items-center gap-2 border-t border-[#334155]">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
            style={{ background: user?.avatar || '#6366F1' }}
          >
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-grow min-w-0">
            <div className="text-sm text-white truncate">{user?.name || 'User'}</div>
            <div className="text-xs text-[#94A3B8]">Free plan</div>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-white" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-grow p-8">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-white">{filterTitle}</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search boards"
                className="w-60 bg-[#1E293B] text-white rounded-lg pl-9 pr-3 h-10 placeholder-[#64748B] focus:ring-2 focus:ring-indigo-500 focus:outline-none border border-[#334155]"
              />
            </div>
            <button
              onClick={() => setShowNewBoard(true)}
              className="h-10 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-semibold">New Board</span>
            </button>
          </div>
        </div>

        {boards === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <BoardCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16">
            <EmptyState
              size="large"
              icon={<Presentation className="w-16 h-16" />}
              title={
                filter === 'shared'
                  ? 'Nothing shared with you yet'
                  : filter === 'recent'
                    ? 'No recent boards'
                    : 'No boards yet'
              }
              description={
                filter === 'shared'
                  ? 'Boards others share with you will appear here.'
                  : 'Create your first board and start collaborating with your team.'
              }
              action={
                filter === 'all'
                  ? {
                      label: 'Create first board',
                      onClick: () => setShowNewBoard(true),
                      variant: 'primary',
                    }
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((b) => (
              <div
                key={b._id}
                onClick={() => renamingId !== b._id && navigate(`/board/${b._id}`)}
                className="bg-[#1E293B] rounded-2xl border border-[#334155] hover:border-indigo-500 transition cursor-pointer overflow-hidden group"
              >
                <div className="h-40 bg-[#0F172A] relative">
                  <svg className="w-full h-full">
                    <path d="M 30 60 Q 60 40 100 60 T 160 55" fill="none" stroke="#334155" strokeWidth="2" />
                    <path d="M 40 100 Q 80 80 130 100 T 200 95" fill="none" stroke="#334155" strokeWidth="2" />
                    <path d="M 50 140 Q 90 120 140 140 T 220 130" fill="none" stroke="#334155" strokeWidth="2" />
                  </svg>
                </div>
                <div className="p-5">
                  {renamingId === b._id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      className="w-full text-sm font-semibold bg-[#0F172A] text-white border border-indigo-500 rounded px-2 py-1 outline-none"
                    />
                  ) : (
                    <h3 className="text-sm font-semibold text-white truncate">{b.title}</h3>
                  )}
                  <p className="text-xs text-[#94A3B8] mt-1">Last edited {timeAgo(b.updatedAt)}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex">
                      {b.collaborators.slice(0, 3).map((_, i) => (
                        <div
                          key={i}
                          className="w-5 h-5 rounded-full border-2 border-[#1E293B] -ml-1 first:ml-0"
                          style={{ background: ['#EF4444', '#F59E0B', '#10B981'][i] }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2 relative" onClick={(e) => e.stopPropagation()}>
                      <button className="text-[#94A3B8] hover:text-white" title="Share">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setMenuOpenFor(menuOpenFor === b._id ? null : b._id)}
                        className="text-[#94A3B8] hover:text-white"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {menuOpenFor === b._id && (
                        <div className="absolute right-0 top-6 bg-white rounded-lg shadow-xl w-32 py-1 z-10">
                          <button
                            onClick={() => startRename(b)}
                            className="w-full px-3 py-2 text-sm text-left text-[#374151] hover:bg-gray-50"
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => handleDelete(b._id)}
                            className="w-full px-3 py-2 text-sm text-left text-red-500 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showNewBoard && (
          <NewBoardModal
            onClose={() => setShowNewBoard(false)}
            onCreate={(b) => setBoards((bs) => [b, ...(bs || [])])}
          />
        )}
      </main>
    </div>
  );
}

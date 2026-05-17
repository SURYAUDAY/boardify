import { useEffect, useState } from 'react';
import { X, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import type { User } from '@shared/types';

type Role = 'editor' | 'viewer';
type ShareMode = 'none' | 'view' | 'edit';

interface Collaborator {
  user: User;
  role: Role;
}

interface BoardData {
  _id: string;
  title: string;
  owner: User | string;
  collaborators: Array<{ user: User | string; role: Role }>;
  shareToken: string;
  shareMode: ShareMode;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
}

function isUserObject(u: User | string): u is User {
  return typeof u === 'object' && u !== null && 'email' in u;
}

function initials(name?: string): string {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

export default function ShareModal({ isOpen, onClose, boardId }: Props) {
  const [board, setBoard] = useState<BoardData | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('editor');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    api.get<BoardData>(`/boards/${boardId}`).then((res) => setBoard(res.data));
  }, [isOpen, boardId]);

  if (!isOpen) return null;

  const ownerData = board && isUserObject(board.owner) ? board.owner : null;
  const collaborators: Collaborator[] = (board?.collaborators || [])
    .filter((c): c is { user: User; role: Role } => isUserObject(c.user))
    .map((c) => ({ user: c.user, role: c.role }));

  const shareUrl = board?.shareToken
    ? `${window.location.origin}/board/${board.shareToken}`
    : '';

  async function sendInvite() {
    if (!inviteEmail.trim()) return;
    setInviteError(null);
    try {
      const res = await api.post(`/boards/${boardId}/invite`, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      const newCollab = res.data.collaborator;
      setBoard((b) =>
        b
          ? {
              ...b,
              collaborators: [
                ...b.collaborators,
                { user: newCollab.user, role: newCollab.role },
              ],
            }
          : b
      );
      setInviteEmail('');
      toast.success('Invite sent');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { error?: string } } })
        ?.response?.status;
      if (status === 404) setInviteError('No user found with that email');
      else if (status === 409) setInviteError('User is already a collaborator');
      else setInviteError('Could not send invite');
    }
  }

  async function changeRole(userId: string, role: Role) {
    try {
      await api.patch(`/boards/${boardId}/collaborators/${userId}`, { role });
      setBoard((b) =>
        b
          ? {
              ...b,
              collaborators: b.collaborators.map((c) =>
                isUserObject(c.user) && c.user.id === userId ? { ...c, role } : c
              ),
            }
          : b
      );
      toast.success('Role updated');
    } catch {
      toast.error('Could not update role');
    }
  }

  async function removeCollab(userId: string) {
    const prev = board;
    setBoard((b) =>
      b
        ? {
            ...b,
            collaborators: b.collaborators.filter(
              (c) => !(isUserObject(c.user) && c.user.id === userId)
            ),
          }
        : b
    );
    try {
      await api.delete(`/boards/${boardId}/collaborators/${userId}`);
      toast.success('Removed');
    } catch {
      setBoard(prev);
      toast.error('Could not remove');
    }
  }

  async function changeShareMode(mode: ShareMode) {
    if (!board) return;
    const prev = board.shareMode;
    setBoard({ ...board, shareMode: mode });
    try {
      await api.patch(`/boards/${boardId}/share`, { shareMode: mode });
    } catch {
      setBoard({ ...board, shareMode: prev });
      toast.error('Could not update share mode');
    }
  }

  function copyLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[480px] p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <h3 className="text-[18px] font-semibold text-[#1E293B] truncate pr-4">
            Share '{board?.title || ''}'
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invite */}
        <div>
          <div className="text-[13px] font-semibold text-gray-700 mb-2">Invite people</div>
          <div className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Add people by email..."
              className="flex-grow h-10 border border-gray-300 rounded-lg px-3 text-[14px] outline-none focus:border-indigo-500"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Role)}
              className="w-[120px] h-10 border border-gray-300 rounded-lg px-2 text-[14px] bg-white text-gray-700"
            >
              <option value="editor">Can edit</option>
              <option value="viewer">Can view</option>
            </select>
            <button
              onClick={sendInvite}
              className="bg-indigo-500 hover:bg-indigo-600 text-white text-[14px] h-10 px-4 rounded-lg"
            >
              Send invite
            </button>
          </div>
          {inviteError && (
            <div className="text-[12px] text-red-500 mt-2">{inviteError}</div>
          )}
        </div>

        {/* Collaborators */}
        <div className="mt-5 pt-5 border-t border-gray-200">
          <div className="text-[13px] font-semibold text-gray-700 mb-3">People with access</div>
          <div className="space-y-1">
            {ownerData && (
              <div className="h-12 px-2 rounded-lg flex items-center gap-3 hover:bg-gray-50">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] font-semibold"
                  style={{ background: ownerData.avatar }}
                >
                  {initials(ownerData.name)}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="text-[14px] text-[#1E293B] truncate">{ownerData.name}</div>
                  <div className="text-[12px] text-gray-500 truncate">{ownerData.email}</div>
                </div>
                <span className="bg-gray-100 text-gray-500 text-[11px] px-2 py-0.5 rounded">
                  Owner
                </span>
                <Crown className="w-4 h-4 text-gray-400" />
              </div>
            )}
            {collaborators.map(({ user, role }) => (
              <div
                key={user.id}
                className="h-12 px-2 rounded-lg flex items-center gap-3 hover:bg-gray-50"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] font-semibold"
                  style={{ background: user.avatar }}
                >
                  {initials(user.name)}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="text-[14px] text-[#1E293B] truncate">{user.name}</div>
                  <div className="text-[12px] text-gray-500 truncate">{user.email}</div>
                </div>
                <select
                  value={role}
                  onChange={(e) => changeRole(user.id, e.target.value as Role)}
                  className="w-[90px] h-8 text-[12px] border border-gray-300 rounded text-gray-700 bg-white"
                >
                  <option value="editor">Can edit</option>
                  <option value="viewer">Can view</option>
                </select>
                <button
                  onClick={() => removeCollab(user.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {collaborators.length === 0 && (
              <div className="text-[12px] text-gray-400 px-2 py-2">
                No other collaborators yet.
              </div>
            )}
          </div>
        </div>

        {/* Share link */}
        <div className="mt-5 pt-5 border-t border-gray-200">
          <div className="text-[13px] font-semibold text-gray-700 mb-2">Share link</div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] text-gray-700">Anyone with the link can...</span>
            <select
              value={board?.shareMode || 'none'}
              onChange={(e) => changeShareMode(e.target.value as ShareMode)}
              className="h-8 text-[13px] border border-gray-300 rounded px-2 bg-white text-gray-700"
            >
              <option value="none">No access</option>
              <option value="view">view only</option>
              <option value="edit">edit</option>
            </select>
          </div>
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg bg-gray-50 p-3">
            <span className="flex-grow text-[13px] text-gray-500 truncate">{shareUrl}</span>
            <button
              onClick={copyLink}
              className="text-indigo-600 text-[13px] font-semibold hover:text-indigo-700"
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="text-[12px] text-gray-400 text-center mt-6">
          Changes are saved automatically
        </div>
      </div>
    </div>
  );
}

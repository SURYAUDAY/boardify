import mongoose from 'mongoose';
import Board from '../Board';
import User from '../User';

async function makeUser() {
  return User.create({
    name: 'Owner',
    email: `owner-${Date.now()}-${Math.random()}@example.com`,
    password: 'Secret123!',
  });
}

describe('Board model', () => {
  it('creates a board with default shareToken (10 chars)', async () => {
    const user = await makeUser();
    const board = await Board.create({ title: 'Test Board', owner: user._id });
    expect(board.shareToken).toBeDefined();
    expect(board.shareToken.length).toBe(10);
  });

  it('requires title and owner', async () => {
    await expect(Board.create({} as any)).rejects.toThrow();
  });

  it('saves embedded strokes and stickyNotes', async () => {
    const user = await makeUser();
    const userId = String(user._id);
    const board = await Board.create({
      title: 'With Strokes',
      owner: user._id,
      strokes: [
        {
          id: 'stroke-1',
          tool: 'pen',
          points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
          color: '#000000',
          strokeWidth: 3,
          userId,
          timestamp: Date.now(),
        },
      ],
      stickyNotes: [
        {
          id: 'sticky-1',
          text: 'Hello',
          x: 100,
          y: 100,
          width: 200,
          height: 160,
          color: '#FEF9C3',
          userId,
          timestamp: Date.now(),
        },
      ],
    });
    expect(board.strokes.length).toBe(1);
    expect(board.stickyNotes.length).toBe(1);
    expect(board.strokes[0].tool).toBe('pen');
    expect(board.stickyNotes[0].text).toBe('Hello');
  });

  it('defaults shareMode to none and isPublic to false', async () => {
    const user = await makeUser();
    const board = await Board.create({ title: 'Defaults', owner: user._id });
    expect(board.shareMode).toBe('none');
    expect(board.isPublic).toBe(false);
  });

  it('auto-populates createdAt and updatedAt', async () => {
    const user = await makeUser();
    const board = await Board.create({ title: 'Timed', owner: user._id });
    expect(board.createdAt).toBeInstanceOf(Date);
    expect(board.updatedAt).toBeInstanceOf(Date);
  });
});

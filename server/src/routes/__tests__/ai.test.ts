import request from 'supertest';

process.env.JWT_SECRET = 'test-secret';

// Mock the openai client BEFORE importing the app
jest.mock('../../lib/openai', () => {
  return {
    __esModule: true,
    default: {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    },
  };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const openai = require('../../lib/openai').default as {
  chat: { completions: { create: jest.Mock } };
};

import { app } from '../../index';
import Board from '../../models/Board';

async function createUserAndToken(email = 'ai-user@example.com') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'AI Tester', email, password: 'Secret123!' });
  return { token: res.body.token, userId: res.body.user.id };
}

async function createBoard(userId: string) {
  const board = await Board.create({ title: 'AI Board', owner: userId });
  return String(board._id);
}

describe('POST /api/ai/diagram', () => {
  beforeEach(() => {
    openai.chat.completions.create.mockReset();
  });

  it('returns shapes + connections + generationId on valid prompt', async () => {
    const { token, userId } = await createUserAndToken();
    const boardId = await createBoard(userId);

    openai.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              shapes: [
                {
                  id: 's1',
                  type: 'rect',
                  x: 300,
                  y: 100,
                  width: 160,
                  height: 60,
                  label: 'Start',
                  color: '#FFFFFF',
                  borderColor: '#6366F1',
                },
              ],
              connections: [],
            }),
          },
        },
      ],
    });

    const res = await request(app)
      .post('/api/ai/diagram')
      .set('Authorization', `Bearer ${token}`)
      .send({ prompt: 'draw a login flow', boardId });

    expect(res.status).toBe(200);
    expect(res.body.shapes).toHaveLength(1);
    expect(res.body.connections).toEqual([]);
    expect(typeof res.body.generationId).toBe('string');
  });

  it('returns 502 when OpenAI returns invalid JSON', async () => {
    const { token, userId } = await createUserAndToken();
    const boardId = await createBoard(userId);

    openai.chat.completions.create.mockResolvedValue({
      choices: [{ message: { content: 'not-json{{' } }],
    });

    const res = await request(app)
      .post('/api/ai/diagram')
      .set('Authorization', `Bearer ${token}`)
      .send({ prompt: 'draw a thing', boardId });

    expect(res.status).toBe(502);
  });

  it('rejects missing prompt', async () => {
    const { token, userId } = await createUserAndToken();
    const boardId = await createBoard(userId);

    const res = await request(app)
      .post('/api/ai/diagram')
      .set('Authorization', `Bearer ${token}`)
      .send({ boardId });

    expect(res.status).toBe(400);
  });

  it('rejects prompt over 500 chars', async () => {
    const { token, userId } = await createUserAndToken();
    const boardId = await createBoard(userId);

    const res = await request(app)
      .post('/api/ai/diagram')
      .set('Authorization', `Bearer ${token}`)
      .send({ prompt: 'x'.repeat(501), boardId });

    expect(res.status).toBe(400);
  });

  it('rejects missing boardId', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app)
      .post('/api/ai/diagram')
      .set('Authorization', `Bearer ${token}`)
      .send({ prompt: 'draw a flow' });

    expect(res.status).toBe(400);
  });

  it('rejects invalid boardId format', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app)
      .post('/api/ai/diagram')
      .set('Authorization', `Bearer ${token}`)
      .send({ prompt: 'draw a flow', boardId: 'not-an-objectid' });

    expect(res.status).toBe(400);
  });

  it('rejects unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/ai/diagram')
      .send({ prompt: 'draw a flow', boardId: '507f1f77bcf86cd799439011' });

    expect(res.status).toBe(401);
  });

  it('returns 502 when OpenAI throws rate limit error', async () => {
    const { token, userId } = await createUserAndToken();
    const boardId = await createBoard(userId);

    openai.chat.completions.create.mockRejectedValue(new Error('Rate limit exceeded'));

    const res = await request(app)
      .post('/api/ai/diagram')
      .set('Authorization', `Bearer ${token}`)
      .send({ prompt: 'draw a flow', boardId });

    expect(res.status).toBe(502);
    expect(res.body.error.toLowerCase()).toContain('rate');
  });
});

describe('POST /api/ai/summarise', () => {
  beforeEach(() => {
    openai.chat.completions.create.mockReset();
  });

  it('returns summary when board has 3+ items', async () => {
    const { token, userId } = await createUserAndToken('summ@example.com');
    const board = await Board.create({
      title: 'Summarise board',
      owner: userId,
      stickyNotes: [
        { id: 'n1', text: 'Buy groceries', x: 0, y: 0, width: 200, height: 160, color: '#FEF9C3', userId, timestamp: 0 },
        { id: 'n2', text: 'Plan vacation', x: 0, y: 0, width: 200, height: 160, color: '#FEF9C3', userId, timestamp: 0 },
        { id: 'n3', text: 'Call mom', x: 0, y: 0, width: 200, height: 160, color: '#FEF9C3', userId, timestamp: 0 },
      ],
    });

    openai.chat.completions.create.mockResolvedValue({
      choices: [{ message: { content: 'A personal task list with errands and family.' } }],
    });

    const res = await request(app)
      .post('/api/ai/summarise')
      .set('Authorization', `Bearer ${token}`)
      .send({ boardId: String(board._id) });

    expect(res.status).toBe(200);
    expect(res.body.summary).toContain('personal task list');
  });

  it('returns null summary when board has fewer than 3 items', async () => {
    const { token, userId } = await createUserAndToken('few@example.com');
    const board = await Board.create({
      title: 'Sparse board',
      owner: userId,
      stickyNotes: [
        { id: 'n1', text: 'just one', x: 0, y: 0, width: 200, height: 160, color: '#FEF9C3', userId, timestamp: 0 },
      ],
    });

    const res = await request(app)
      .post('/api/ai/summarise')
      .set('Authorization', `Bearer ${token}`)
      .send({ boardId: String(board._id) });

    expect(res.status).toBe(200);
    expect(res.body.summary).toBeNull();
    expect(res.body.reason).toBeDefined();
  });
});

describe('POST /api/ai/organise', () => {
  beforeEach(() => {
    openai.chat.completions.create.mockReset();
  });

  it('returns themes for valid notes', async () => {
    const { token } = await createUserAndToken('org@example.com');
    openai.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              themes: [
                { name: 'Errands', color: '#FEF9C3', noteIds: ['n1', 'n2'] },
              ],
            }),
          },
        },
      ],
    });

    const res = await request(app)
      .post('/api/ai/organise')
      .set('Authorization', `Bearer ${token}`)
      .send({
        notes: [
          { id: 'n1', text: 'buy milk' },
          { id: 'n2', text: 'buy bread' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.themes).toHaveLength(1);
    expect(res.body.themes[0].name).toBe('Errands');
  });

  it('rejects fewer than 2 notes', async () => {
    const { token } = await createUserAndToken('org2@example.com');
    const res = await request(app)
      .post('/api/ai/organise')
      .set('Authorization', `Bearer ${token}`)
      .send({ notes: [{ id: 'n1', text: 'only' }] });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/ai/ocr', () => {
  beforeEach(() => {
    openai.chat.completions.create.mockReset();
  });

  it('returns text from valid image', async () => {
    const { token, userId } = await createUserAndToken('ocr@example.com');
    const boardId = await createBoard(userId);

    openai.chat.completions.create.mockResolvedValue({
      choices: [{ message: { content: 'hello world' } }],
    });

    const res = await request(app)
      .post('/api/ai/ocr')
      .set('Authorization', `Bearer ${token}`)
      .send({
        imageBase64: 'data:image/png;base64,iVBORw0KGgo=',
        boardId,
      });

    expect(res.status).toBe(200);
    expect(res.body.text).toBe('hello world');
    expect(res.body.confidence).toBeGreaterThan(0);
  });

  it('rejects invalid image format', async () => {
    const { token, userId } = await createUserAndToken('ocr2@example.com');
    const boardId = await createBoard(userId);

    const res = await request(app)
      .post('/api/ai/ocr')
      .set('Authorization', `Bearer ${token}`)
      .send({ imageBase64: 'not-an-image', boardId });

    expect(res.status).toBe(400);
  });
});

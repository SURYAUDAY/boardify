import request from 'supertest';
import { app } from '../../index';

process.env.JWT_SECRET = 'test-secret';

describe('POST /api/auth/register', () => {
  it('registers a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@example.com', password: 'Secret123!' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.user.password).toBeUndefined();
  });

  it('rejects duplicate email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'dup@example.com', password: 'Secret123!' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice2', email: 'dup@example.com', password: 'Secret123!' });
    expect(res.status).toBe(409);
  });

  it('rejects invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'not-an-email', password: 'Secret123!' });
    expect(res.status).toBe(400);
  });

  it('rejects password under 8 chars', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'short@example.com', password: '123' });
    expect(res.status).toBe(400);
  });

  it('rejects missing name', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'noname@example.com', password: 'Secret123!' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob', email: 'bob@example.com', password: 'Secret123!' });
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@example.com', password: 'Secret123!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@example.com', password: 'WrongPass!' });
    expect(res.status).toBe(401);
  });

  it('rejects non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'Secret123!' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns user data with valid token', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Carol', email: 'carol@example.com', password: 'Secret123!' });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${reg.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('carol@example.com');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer garbage');
    expect(res.status).toBe(401);
  });
});

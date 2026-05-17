import request from 'supertest';
import { app } from '../../index';
import User from '../../models/User';
import Board from '../../models/Board';

process.env.JWT_SECRET = 'test-secret';

async function createUserAndToken(email = 'user@example.com') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test', email, password: 'Secret123!' });
  return { token: res.body.token, userId: res.body.user.id };
}

describe('GET /api/boards', () => {
  it('returns empty array for new user', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app).get('/api/boards').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns user's own boards", async () => {
    const { token, userId } = await createUserAndToken();
    await Board.create({ title: 'Mine', owner: userId });
    const res = await request(app).get('/api/boards').set('Authorization', `Bearer ${token}`);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe('Mine');
  });

  it('returns boards where user is collaborator', async () => {
    const owner = await User.create({ name: 'O', email: 'owner@example.com', password: 'Secret123!' });
    const { token, userId } = await createUserAndToken('me@example.com');
    await Board.create({
      title: 'Shared',
      owner: owner._id,
      collaborators: [{ user: userId, role: 'editor' }],
    });
    const res = await request(app).get('/api/boards').set('Authorization', `Bearer ${token}`);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe('Shared');
  });

  it("does not return other users' private boards", async () => {
    const stranger = await User.create({ name: 'X', email: 'x@example.com', password: 'Secret123!' });
    await Board.create({ title: 'Private', owner: stranger._id });
    const { token } = await createUserAndToken();
    const res = await request(app).get('/api/boards').set('Authorization', `Bearer ${token}`);
    expect(res.body).toEqual([]);
  });

  it('requires auth', async () => {
    const res = await request(app).get('/api/boards');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/boards', () => {
  it('creates board with title', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'New Board' });
    expect(res.status).toBe(201);
    expect(res.body.shareToken).toBeDefined();
    expect(res.body.shareToken.length).toBe(10);
  });

  it('rejects empty title', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '' });
    expect(res.status).toBe(400);
  });

  it('requires auth', async () => {
    const res = await request(app).post('/api/boards').send({ title: 'X' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/boards/:id', () => {
  it('owner gets full board', async () => {
    const { token, userId } = await createUserAndToken();
    const board = await Board.create({ title: 'Mine', owner: userId });
    const res = await request(app)
      .get(`/api/boards/${board._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Mine');
  });

  it('non-collaborator on private board → 403', async () => {
    const stranger = await User.create({ name: 'X', email: 'x@example.com', password: 'Secret123!' });
    const board = await Board.create({ title: 'Private', owner: stranger._id });
    const { token } = await createUserAndToken();
    const res = await request(app)
      .get(`/api/boards/${board._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('non-existent id → 404', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app)
      .get('/api/boards/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/boards/:id', () => {
  it('owner updates title', async () => {
    const { token, userId } = await createUserAndToken();
    const board = await Board.create({ title: 'Old', owner: userId });
    const res = await request(app)
      .patch(`/api/boards/${board._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'New' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('New');
  });

  it('viewer collaborator cannot update', async () => {
    const owner = await User.create({ name: 'O', email: 'owner@example.com', password: 'Secret123!' });
    const { token, userId } = await createUserAndToken('viewer@example.com');
    const board = await Board.create({
      title: 'ViewOnly',
      owner: owner._id,
      collaborators: [{ user: userId, role: 'viewer' }],
    });
    const res = await request(app)
      .patch(`/api/boards/${board._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Hacked' });
    expect(res.status).toBe(403);
  });

  it('editor collaborator can update', async () => {
    const owner = await User.create({ name: 'O', email: 'owner@example.com', password: 'Secret123!' });
    const { token, userId } = await createUserAndToken('editor@example.com');
    const board = await Board.create({
      title: 'Editable',
      owner: owner._id,
      collaborators: [{ user: userId, role: 'editor' }],
    });
    const res = await request(app)
      .patch(`/api/boards/${board._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Edited' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Edited');
  });
});

describe('DELETE /api/boards/:id', () => {
  it('owner deletes', async () => {
    const { token, userId } = await createUserAndToken();
    const board = await Board.create({ title: 'Doomed', owner: userId });
    const res = await request(app)
      .delete(`/api/boards/${board._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('non-owner cannot delete', async () => {
    const owner = await User.create({ name: 'O', email: 'owner@example.com', password: 'Secret123!' });
    const board = await Board.create({ title: 'Safe', owner: owner._id });
    const { token } = await createUserAndToken();
    const res = await request(app)
      .delete(`/api/boards/${board._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('Sharing routes', () => {
  it('POST /:id/invite adds collaborator', async () => {
    const { token, userId } = await createUserAndToken('owner1@example.com');
    const target = await User.create({ name: 'Tgt', email: 'tgt@example.com', password: 'Secret123!' });
    const board = await Board.create({ title: 'Share me', owner: userId });
    const res = await request(app)
      .post(`/api/boards/${board._id}/invite`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'tgt@example.com', role: 'editor' });
    expect(res.status).toBe(200);
    expect(String(res.body.collaborator.user.id)).toBe(String(target._id));
  });

  it('POST /:id/invite returns 404 if user not found', async () => {
    const { token, userId } = await createUserAndToken('owner2@example.com');
    const board = await Board.create({ title: 'Share', owner: userId });
    const res = await request(app)
      .post(`/api/boards/${board._id}/invite`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'nobody@example.com', role: 'editor' });
    expect(res.status).toBe(404);
  });

  it('POST /:id/invite returns 409 if already a collaborator', async () => {
    const { token, userId } = await createUserAndToken('owner3@example.com');
    const target = await User.create({ name: 'X', email: 'x@example.com', password: 'Secret123!' });
    const board = await Board.create({
      title: 'Already',
      owner: userId,
      collaborators: [{ user: target._id, role: 'editor' }],
    });
    const res = await request(app)
      .post(`/api/boards/${board._id}/invite`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'x@example.com', role: 'editor' });
    expect(res.status).toBe(409);
  });

  it('PATCH /:id/collaborators/:userId updates role', async () => {
    const { token, userId } = await createUserAndToken('owner4@example.com');
    const target = await User.create({ name: 'X', email: 'role@example.com', password: 'Secret123!' });
    const board = await Board.create({
      title: 'Role',
      owner: userId,
      collaborators: [{ user: target._id, role: 'viewer' }],
    });
    const res = await request(app)
      .patch(`/api/boards/${board._id}/collaborators/${target._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'editor' });
    expect(res.status).toBe(200);
    expect(res.body.updated.role).toBe('editor');
  });

  it('DELETE /:id/collaborators/:userId removes collaborator', async () => {
    const { token, userId } = await createUserAndToken('owner5@example.com');
    const target = await User.create({ name: 'X', email: 'rem@example.com', password: 'Secret123!' });
    const board = await Board.create({
      title: 'Remove',
      owner: userId,
      collaborators: [{ user: target._id, role: 'editor' }],
    });
    const res = await request(app)
      .delete(`/api/boards/${board._id}/collaborators/${target._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
    const fresh = await Board.findById(board._id);
    expect(fresh!.collaborators).toHaveLength(0);
  });

  it('PATCH /:id/share updates shareMode', async () => {
    const { token, userId } = await createUserAndToken('owner6@example.com');
    const board = await Board.create({ title: 'Mode', owner: userId });
    const res = await request(app)
      .patch(`/api/boards/${board._id}/share`)
      .set('Authorization', `Bearer ${token}`)
      .send({ shareMode: 'view' });
    expect(res.status).toBe(200);
    expect(res.body.shareMode).toBe('view');
  });

  it('Anonymous can GET board with shareMode != none', async () => {
    const owner = await User.create({ name: 'O', email: 'open-owner@example.com', password: 'Secret123!' });
    const board = await Board.create({ title: 'Public', owner: owner._id, shareMode: 'view' });
    const res = await request(app).get(`/api/boards/${board._id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Public');
  });

  it('Anonymous PATCH allowed when shareMode is edit', async () => {
    const owner = await User.create({ name: 'O', email: 'edit-owner@example.com', password: 'Secret123!' });
    const board = await Board.create({ title: 'Editable', owner: owner._id, shareMode: 'edit' });
    const res = await request(app)
      .patch(`/api/boards/${board._id}`)
      .send({ title: 'Updated by anon' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated by anon');
  });

  it('Anonymous PATCH rejected when shareMode is view only', async () => {
    const owner = await User.create({ name: 'O', email: 'view-owner@example.com', password: 'Secret123!' });
    const board = await Board.create({ title: 'View only', owner: owner._id, shareMode: 'view' });
    const res = await request(app)
      .patch(`/api/boards/${board._id}`)
      .send({ title: 'Hacked' });
    expect(res.status).toBe(403);
  });
});

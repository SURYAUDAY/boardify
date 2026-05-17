import User from '../User';

describe('User model', () => {
  it('hashes password on save', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Secret123!',
    });
    expect(user.password).not.toBe('Secret123!');
    expect(user.password.length).toBeGreaterThan(20);
  });

  it('comparePassword returns true for correct password', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Secret123!',
    });
    const ok = await user.comparePassword('Secret123!');
    expect(ok).toBe(true);
  });

  it('comparePassword returns false for wrong password', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Secret123!',
    });
    const ok = await user.comparePassword('WrongPass123');
    expect(ok).toBe(false);
  });

  it('enforces unique email', async () => {
    await User.create({
      name: 'User One',
      email: 'same@example.com',
      password: 'Secret123!',
    });
    await expect(
      User.create({
        name: 'User Two',
        email: 'same@example.com',
        password: 'Secret123!',
      })
    ).rejects.toThrow();
  });

  it('requires name, email, password', async () => {
    await expect(User.create({} as any)).rejects.toThrow();
  });
});

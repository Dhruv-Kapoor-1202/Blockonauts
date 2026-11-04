import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestApp } from './helpers/test-app.js';

describe('POST /api/players', () => {
  it('registers a player with a trimmed, upper-cased callsign', async () => {
    const { app } = createTestApp();
    const res = await request(app)
      .post('/api/players')
      .send({ callsign: '  nova_1  ' })
      .expect(201);
    expect(res.body).toEqual({
      playerId: expect.stringMatching(/^[0-9a-f-]{36}$/),
      callsign: 'NOVA_1',
    });
  });

  it('accepts the maximum length and allowed characters', async () => {
    const { app } = createTestApp();
    await request(app).post('/api/players').send({ callsign: 'AB CD-12_xyz' }).expect(201);
  });

  it.each([
    ['empty', { callsign: '' }],
    ['blank', { callsign: '   ' }],
    ['too long', { callsign: 'ABCDEFGHIJKLM' }],
    ['bad characters', { callsign: 'NOVA!' }],
    ['not a string', { callsign: 42 }],
    ['missing', {}],
    ['unknown key', { callsign: 'NOVA', admin: true }],
  ])('rejects a %s callsign with 400', async (_name, body) => {
    const { app } = createTestApp();
    const res = await request(app).post('/api/players').send(body).expect(400);
    expect(res.body).toEqual({
      error: { code: 'VALIDATION_ERROR', message: expect.stringContaining('body') },
    });
  });

  it('rejects a missing body with 400', async () => {
    const { app } = createTestApp();
    await request(app).post('/api/players').expect(400);
  });
});

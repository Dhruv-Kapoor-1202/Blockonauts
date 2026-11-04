import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { buildMiniContentFiles } from '../../packages/engine/test/fixtures/mini-content.js';
import { TEST_ORIGIN, createTestApp, loadMiniBundle } from './helpers/test-app.js';

const ERROR_SHAPE = { error: { code: expect.any(String), message: expect.any(String) } };

describe('GET /api/health', () => {
  it('reports status, uptime and storage driver', async () => {
    const { app } = createTestApp();
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body).toEqual({ status: 'ok', uptime: expect.any(Number), storage: 'memory' });
  });
});

describe('CORS', () => {
  it('allows the configured origin and answers preflight', async () => {
    const { app } = createTestApp();
    const res = await request(app).get('/api/health').set('Origin', TEST_ORIGIN);
    expect(res.headers['access-control-allow-origin']).toBe(TEST_ORIGIN);
    const preflight = await request(app)
      .options('/api/progress/x/y')
      .set('Origin', TEST_ORIGIN)
      .set('Access-Control-Request-Method', 'PUT');
    expect(preflight.status).toBe(204);
    expect(preflight.headers['access-control-allow-methods']).toContain('PUT');
  });

  it('does not allow other origins', async () => {
    const { app } = createTestApp();
    const res = await request(app).get('/api/health').set('Origin', 'http://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('supports several comma separated origins via config', async () => {
    const { app } = createTestApp({ config: { corsOrigins: ['http://a.test', 'http://b.test'] } });
    const res = await request(app).get('/api/health').set('Origin', 'http://b.test');
    expect(res.headers['access-control-allow-origin']).toBe('http://b.test');
  });
});

describe('error handling', () => {
  it('answers unknown routes with a 404 error shape', async () => {
    const { app } = createTestApp();
    const res = await request(app).get('/api/nope').expect(404);
    expect(res.body).toEqual(ERROR_SHAPE);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });

  it('answers malformed JSON with 400 INVALID_JSON', async () => {
    const { app } = createTestApp();
    const res = await request(app)
      .post('/api/players')
      .set('Content-Type', 'application/json')
      .send('{"callsign": ');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('answers oversized bodies with 413', async () => {
    const { app } = createTestApp();
    const res = await request(app)
      .post('/api/players')
      .send({ callsign: 'A'.repeat(1_200_000) });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });
});

describe('GET /api/content', () => {
  it('serves the validated bundle as raw ContentData JSON', async () => {
    const { app } = createTestApp();
    const res = await request(app).get('/api/content').expect(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.body).toEqual(JSON.parse(JSON.stringify(loadMiniBundle().toJSON())));
    expect(res.body.worlds.map((w: { id: string }) => w.id)).toEqual(
      expect.arrayContaining(['moon', 'mars']),
    );
  });

  it('supports ETag and If-None-Match (304)', async () => {
    const { app } = createTestApp();
    const first = await request(app).get('/api/content').expect(200);
    const etag = first.headers.etag;
    expect(etag).toBeTruthy();
    const second = await request(app).get('/api/content').set('If-None-Match', etag).expect(304);
    expect(second.text).toBe('');
  });

  it('caches the bundle after the first load', async () => {
    const { app, source } = createTestApp();
    const first = await request(app).get('/api/content').expect(200);
    source.setFiles({});
    const second = await request(app).get('/api/content').expect(200);
    expect(second.headers.etag).toBe(first.headers.etag);
  });

  it('refuses invalid content with 500 CONTENT_INVALID and logs the issues', async () => {
    const files = buildMiniContentFiles();
    delete files['campaign/campaign.json'];
    const { app, logger } = createTestApp({ files });
    const res = await request(app).get('/api/content').expect(500);
    expect(res.body).toEqual(ERROR_SHAPE);
    expect(res.body.error.code).toBe('CONTENT_INVALID');
    expect(logger.messages.some((m) => m.level === 'error')).toBe(true);
  });

  it('refuses content that fails cross-file validation', async () => {
    const files = buildMiniContentFiles();
    const campaign = files['campaign/campaign.json'] as { sequences: Record<string, string[]> };
    campaign.sequences.moon = [...campaign.sequences.moon!, 'missing-chapter'];
    const { app, logger } = createTestApp({ files });
    const res = await request(app).get('/api/content').expect(500);
    expect(res.body.error.code).toBe('CONTENT_INVALID');
    expect(logger.messages.map((m) => m.message).join('\n')).toContain('missing-chapter');
  });

  it('recovers once the content is fixed (failures are not cached)', async () => {
    const { app, source } = createTestApp({ files: {} });
    await request(app).get('/api/content').expect(500);
    source.setFiles(buildMiniContentFiles());
    await request(app).get('/api/content').expect(200);
  });

  it('warmUp logs failures without throwing', async () => {
    const { deps, logger } = createTestApp({ files: {} });
    await expect(deps.services.content.warmUp()).resolves.toBeUndefined();
    expect(logger.messages.some((m) => m.level === 'error')).toBe(true);
  });
});

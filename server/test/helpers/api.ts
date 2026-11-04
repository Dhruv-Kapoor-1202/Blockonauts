/**
 * Small HTTP helpers shared by route tests.
 */
import type { Express } from 'express';
import request from 'supertest';

/** Registers a player and returns its id. */
export async function registerPlayer(app: Express, callsign = 'NOVA'): Promise<string> {
  const res = await request(app).post('/api/players').send({ callsign }).expect(201);
  return res.body.playerId as string;
}

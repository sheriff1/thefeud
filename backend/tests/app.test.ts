import request from 'supertest';
import app from '../index.js';
import { describe, it, expect } from 'vitest';

describe('GET /api/answers-library', () => {
  it('should return a list of CSV files', async () => {
    const res = await request(app).get('/api/answers-library');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

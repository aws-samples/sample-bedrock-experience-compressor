import { describe, it, expect, vi } from 'vitest';
import { extractUser, AuthRequest } from '../middleware/auth';
import { Response, NextFunction } from 'express';

function createMockRequest(authorizer?: Record<string, string>): AuthRequest {
  const req = {
    requestContext: authorizer ? { authorizer } : undefined,
  } as AuthRequest & { requestContext?: { authorizer?: Record<string, string> } };
  return req;
}

function createMockResponse(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe('extractUser middleware', () => {
  it('should extract user from authorizer context', () => {
    const req = createMockRequest({
      sub: 'user-123',
      technicianId: 'tech-456',
      email: 'alice@example.com',
      givenName: 'Alice',
      familyName: 'Smith',
    });
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;

    extractUser(req, res, next);

    expect(req.user).toEqual({
      userId: 'user-123',
      technicianId: 'tech-456',
      email: 'alice@example.com',
      name: 'Alice Smith',
    });
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 when authorizer context is missing', () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;

    extractUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing authorizer context' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when sub is missing', () => {
    const req = createMockRequest({ email: 'test@example.com' });
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;

    extractUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle missing optional fields gracefully', () => {
    const req = createMockRequest({ sub: 'user-789' });
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;

    extractUser(req, res, next);

    expect(req.user).toEqual({
      userId: 'user-789',
      technicianId: '',
      email: '',
      name: '',
    });
    expect(next).toHaveBeenCalled();
  });

  it('should handle first name only', () => {
    const req = createMockRequest({ sub: 'user-1', givenName: 'Bob' });
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;

    extractUser(req, res, next);

    expect(req.user?.name).toBe('Bob');
  });
});

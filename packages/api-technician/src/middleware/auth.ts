import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    technicianId: string;
    email: string;
    name: string;
  };
}

/**
 * Extracts user info from the API Gateway Lambda Authorizer context.
 * JWT verification is handled by the authorizer — this middleware only maps the context to req.user.
 */
export const extractUser = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authorizer = (req as any).requestContext?.authorizer;

  if (!authorizer?.sub) {
    return res.status(401).json({ error: 'Missing authorizer context' });
  }

  req.user = {
    userId: authorizer.sub,
    technicianId: authorizer.technicianId || '',
    email: authorizer.email || '',
    name: [authorizer.givenName, authorizer.familyName].filter(Boolean).join(' '),
  };

  next();
};

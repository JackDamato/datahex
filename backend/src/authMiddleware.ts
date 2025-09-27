import { Request, Response, NextFunction } from 'express';
import { validateTokenAndGetUser, AuthUser } from './authServiceSimple';

// Extend the Request type to include a 'user' property
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized - Missing or invalid authorization header',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Unauthorized - No token provided',
        code: 'NO_TOKEN'
      });
    }

    // Validate token and get user
    const user = await validateTokenAndGetUser(token);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Unauthorized - Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Set user in request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Internal server error during authentication',
      code: 'AUTH_ERROR'
    });
  }
};

// Optional auth middleware (doesn't fail if no token)
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      if (token) {
        const user = await validateTokenAndGetUser(token);
        if (user) {
          req.user = user;
        }
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // Don't fail on optional auth errors
    next();
  }
};
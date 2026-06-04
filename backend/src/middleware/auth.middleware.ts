import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { AuthTokenPayload } from '@pooja-vegetables/types'

// Extend Express Request to carry the decoded token
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization']
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    res.status(401).json({ success: false, error: 'No token provided', code: 'UNAUTHORIZED' })
    return
  }

  try {
    const secret = process.env['JWT_SECRET']
    if (!secret) throw new Error('JWT_SECRET not configured')

    const decoded = jwt.verify(token, secret) as AuthTokenPayload
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token', code: 'TOKEN_INVALID' })
  }
}

// Use this on admin-only routes (Dad's dashboard)
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin access required', code: 'FORBIDDEN' })
    return
  }
  next()
}

// Use this on B2B-only routes
export const requireB2B = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.clientType !== 'b2b') {
    res.status(403).json({ success: false, error: 'B2B access required', code: 'FORBIDDEN' })
    return
  }
  next()
}

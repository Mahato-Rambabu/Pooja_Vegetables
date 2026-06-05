import { Router, Request, Response } from 'express'
import jwt, { SignOptions } from 'jsonwebtoken'
import { B2BClientModel, UserModel } from '../models/user.model'

const router = Router()

const signToken = (payload: object): string => {
  const secret = process.env['JWT_SECRET']
  if (!secret) throw new Error('JWT_SECRET not set')

  // expiresIn must satisfy jsonwebtoken's StringValue type — cast explicitly
  const options: SignOptions = {
    expiresIn: (process.env['JWT_EXPIRES_IN'] ?? '7d') as SignOptions['expiresIn'],
  }
  return jwt.sign(payload, secret, options)
}

// ── POST /api/auth/b2b/login ──────────────────
router.post('/b2b/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string }

  try {
    const client = await B2BClientModel.findOne({ email }).select('+password')
    if (!client || !(await client.comparePassword(password))) {
      res.status(401).json({ success: false, error: 'Invalid email or password' })
      return
    }
    if (!client.isActive) {
      res.status(403).json({ success: false, error: 'Account is inactive. Contact the shop.' })
      return
    }

    const token = signToken({ id: client._id, role: 'b2b', clientType: 'b2b' })
    const { password: _, ...safeClient } = client.toObject()

    res.json({ success: true, data: { token, user: safeClient, role: 'b2b' } })
  } catch {
    res.status(500).json({ success: false, error: 'Login failed' })
  }
})

// ── POST /api/auth/customer/register ──────────
router.post('/customer/register', async (req: Request, res: Response) => {
  try {
    const existing = await UserModel.findOne({ phone: req.body.phone })
    if (existing) {
      res.status(409).json({ success: false, error: 'Phone number already registered' })
      return
    }
    const user = await UserModel.create(req.body)
    const token = signToken({ id: user._id, role: 'customer', clientType: 'local' })
    res.status(201).json({ success: true, data: { token, user, role: 'customer' } })
  } catch {
    res.status(500).json({ success: false, error: 'Registration failed' })
  }
})

// ── POST /api/auth/customer/login ─────────────
// Simple phone-based login (no password for local users — OTP later)
router.post('/customer/login', async (req: Request, res: Response) => {
  const { phone } = req.body as { phone: string }

  try {
    const user = await UserModel.findOne({ phone })
    if (!user) {
      res.status(404).json({ success: false, error: 'Phone number not registered' })
      return
    }
    const token = signToken({ id: user._id, role: 'customer', clientType: 'local' })
    res.json({ success: true, data: { token, user, role: 'customer' } })
  } catch {
    res.status(500).json({ success: false, error: 'Login failed' })
  }
})

export default router
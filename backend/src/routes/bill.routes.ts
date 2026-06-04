import { Router, Request, Response } from 'express'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

// ── POST /api/bills/generate/:orderId ─────────
// Generates a PDF bill, uploads to Cloudinary, saves URL on order
// Full implementation in Phase 3 — stub returns placeholder for now
router.post('/generate/:orderId', authenticate, async (req: Request, res: Response) => {
  // TODO Phase 3: implement pdf-lib generation + Cloudinary upload
  res.json({
    success: true,
    data: {
      billUrl: `https://placeholder.cloudinary.com/bill-${req.params['orderId']}.pdf`,
      whatsappLink: `https://wa.me/?text=Your Pooja Vegetables bill is ready!`,
    },
    message: 'Bill generation coming in Phase 3',
  })
})

export default router

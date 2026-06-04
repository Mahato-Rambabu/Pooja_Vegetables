import { Router, Request, Response } from 'express'
import { OrderModel } from '../models/order.model'
import { authenticate, requireAdmin } from '../middleware/auth.middleware'
import { geoFenceCheck } from '../middleware/geoFence.middleware'
import { minOrderCheck } from '../middleware/minOrder.middleware'

const router = Router()

// ── POST /api/orders/local ────────────────────
// Local customer order — geo-fence + min ₹150 enforced
router.post('/local', authenticate, geoFenceCheck, minOrderCheck, async (req: Request, res: Response) => {
  try {
    const order = await OrderModel.create({ ...req.body, clientType: 'local' })
    res.status(201).json({ success: true, data: order })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to place order' })
  }
})

// ── POST /api/orders/b2b ──────────────────────
// B2B bulk order — no geo or min-order check
router.post('/b2b', authenticate, async (req: Request, res: Response) => {
  try {
    const order = await OrderModel.create({ ...req.body, clientType: 'b2b' })
    res.status(201).json({ success: true, data: order })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to place B2B order' })
  }
})

// ── GET /api/orders ───────────────────────────
// Admin — all orders, filterable by clientType and status
router.get('/', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { clientType, status, page = '1', limit = '20' } = req.query as Record<string, string>

    const filter: Record<string, string> = {}
    if (clientType) filter['clientType'] = clientType
    if (status) filter['status'] = status

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [orders, total] = await Promise.all([
      OrderModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      OrderModel.countDocuments(filter),
    ])

    res.json({ success: true, data: { orders, total, page: parseInt(page) } })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch orders' })
  }
})

// ── GET /api/orders/my ────────────────────────
// Customer/B2B — their own order history
router.get('/my', authenticate, async (req: Request, res: Response) => {
  try {
    const orders = await OrderModel.find({ clientId: req.user?.id }).sort({ createdAt: -1 })
    res.json({ success: true, data: orders })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch orders' })
  }
})

// ── PATCH /api/orders/:id/status ──────────────
// Admin — update order status
router.patch('/:id/status', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.body as { status: string }
    const order = await OrderModel.findByIdAndUpdate(
      req.params['id'],
      { status },
      { new: true }
    )
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' })
      return
    }
    res.json({ success: true, data: order })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update order status' })
  }
})

export default router

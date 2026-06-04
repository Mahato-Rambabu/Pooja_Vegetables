import { Router, Request, Response } from 'express'
import { OrderModel } from '../models/order.model'
import { authenticate, requireAdmin } from '../middleware/auth.middleware'

const router = Router()

// ── GET /api/dashboard/stats ──────────────────
router.get('/stats', authenticate, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [todayOrders, pendingOrders] = await Promise.all([
      OrderModel.find({ createdAt: { $gte: today } }),
      OrderModel.countDocuments({ status: 'pending' }),
    ])

    const stats = {
      totalOrdersToday: todayOrders.length,
      totalRevenueToday: todayOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      pendingOrders,
      localOrdersToday: todayOrders.filter((o) => o.clientType === 'local').length,
      b2bOrdersToday: todayOrders.filter((o) => o.clientType === 'b2b').length,
    }

    res.json({ success: true, data: stats })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' })
  }
})

export default router

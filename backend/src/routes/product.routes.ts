import { Router, Request, Response } from 'express'
import { ProductModel } from '../models/product.model'
import { PriceHistoryModel } from '../models/priceHistory.model'
import { authenticate, requireAdmin } from '../middleware/auth.middleware'
import type { ProductPriceUpdate } from '@pooja-vegetables/types'

const router = Router()

// ── GET /api/products ─────────────────────────
// Public — used by customer app and B2B portal
// Query: ?type=retail|bulk to get the right price field
router.get('/', async (req: Request, res: Response) => {
  try {
    const products = await ProductModel.find({ isAvailable: true }).sort({ category: 1, name: 1 })
    res.json({ success: true, data: products })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch products' })
  }
})

// ── PUT /api/products/bulk-price-update ───────
// Admin only — Dad's daily price update
// Auto-logs a snapshot to price_history
router.put('/bulk-price-update', authenticate, requireAdmin, async (req: Request, res: Response) => {
  const { updates } = req.body as { updates: ProductPriceUpdate[] }

  if (!Array.isArray(updates) || updates.length === 0) {
    res.status(400).json({ success: false, error: 'No price updates provided' })
    return
  }

  try {
    // 1. Bulk update products
    const bulkOps = updates.map(({ _id, priceRetail, priceBulk }) => ({
      updateOne: {
        filter: { _id },
        update: { $set: { priceRetail, priceBulk } },
      },
    }))
    await ProductModel.bulkWrite(bulkOps)

    // 2. Auto-log price_history snapshot for every updated product
    const updatedProducts = await ProductModel.find({
      _id: { $in: updates.map((u) => u._id) },
    })

    const historyEntries = updatedProducts.map((product) => ({
      productId: product._id.toString(),
      productName: product.name,
      priceRetail: product.priceRetail,
      priceBulk: product.priceBulk,
      recordedAt: new Date(),
      recordedBy: req.user?.id ?? 'admin',
    }))

    await PriceHistoryModel.insertMany(historyEntries)

    res.json({
      success: true,
      data: null,
      message: `Updated prices for ${updates.length} products`,
    })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update prices' })
  }
})

// ── POST /api/products ────────────────────────
// Admin only — add a new product
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const product = await ProductModel.create(req.body)
    res.status(201).json({ success: true, data: product })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to create product' })
  }
})

// ── GET /api/products/price-history/:productId
// Admin only — see price history for a specific product
router.get('/price-history/:productId', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const history = await PriceHistoryModel.find({ productId: req.params['productId'] })
      .sort({ recordedAt: -1 })
      .limit(30)
    res.json({ success: true, data: history })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch price history' })
  }
})

export default router

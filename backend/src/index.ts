import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { connectDB } from './utils/db'

// Routes
import authRoutes from './routes/auth.routes'
import productRoutes from './routes/product.routes'
import orderRoutes from './routes/order.routes'
import dashboardRoutes from './routes/dashboard.routes'
import billRoutes from './routes/bill.routes'

dotenv.config()

const app = express()
const PORT = process.env['PORT'] ?? 5000

// ── Security middleware ───────────────────────
app.use(helmet())
app.use(cors({
  origin: (process.env['ALLOWED_ORIGINS'] ?? '').split(','),
  credentials: true,
}))

// ── Request parsing ───────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Logging (dev only) ────────────────────────
if (process.env['NODE_ENV'] === 'development') {
  app.use(morgan('dev'))
}

// ── Health check — Railway uses this ─────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── API routes ────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/bills', billRoutes)

// ── 404 handler ───────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' })
})

// ── Global error handler ──────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.message)
  res.status(500).json({ success: false, error: 'Internal server error' })
})

// ── Start ─────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🥦 Pooja Vegetables API running on port ${PORT}`)
  })
})

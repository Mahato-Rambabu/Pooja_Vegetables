import { Request, Response, NextFunction } from 'express'

export const minOrderCheck = (req: Request, res: Response, next: NextFunction): void => {
  const { totalAmount } = req.body as { totalAmount?: number }
  const minimum = parseFloat(process.env['MIN_ORDER_AMOUNT'] ?? '150')

  if (!totalAmount || totalAmount < minimum) {
    res.status(400).json({
      success: false,
      error: `Minimum order amount is ₹${minimum} for free delivery. Your cart total is ₹${totalAmount ?? 0}.`,
      code: 'MIN_ORDER_NOT_MET',
    })
    return
  }

  next()
}

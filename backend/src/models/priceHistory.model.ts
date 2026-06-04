import mongoose, { Schema, Document } from 'mongoose'
import type { PriceHistoryEntry } from '@pooja-vegetables/types'

export interface PriceHistoryDocument extends Omit<PriceHistoryEntry, '_id'>, Document {}

const PriceHistorySchema = new Schema<PriceHistoryDocument>(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true }, // denormalized
    priceRetail: { type: Number, required: true },
    priceBulk: { type: Number, required: true },
    recordedAt: { type: Date, default: Date.now },
    recordedBy: { type: String, required: true },  // admin user id
  },
  { timestamps: false } // recordedAt is our timestamp here
)

// Index for querying "what was the price of X on date Y?"
PriceHistorySchema.index({ productId: 1, recordedAt: -1 })

export const PriceHistoryModel = mongoose.model<PriceHistoryDocument>('PriceHistory', PriceHistorySchema)

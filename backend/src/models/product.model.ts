import mongoose, { Schema, Document } from 'mongoose'
import type { Product } from '@pooja-vegetables/types'

export interface ProductDocument extends Omit<Product, '_id'>, Document {}

const ProductSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ['fruit', 'vegetable'], required: true },
    unit: { type: String, enum: ['kg', 'piece', 'dozen'], required: true },
    priceRetail: { type: Number, required: true, min: 0 },
    priceBulk: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    imageUrl: { type: String },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const ProductModel = mongoose.model<ProductDocument>('Product', ProductSchema)

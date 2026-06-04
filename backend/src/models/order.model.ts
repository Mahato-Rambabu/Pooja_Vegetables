import mongoose, { Schema, Document } from 'mongoose'
import type { Order, OrderItem } from '@pooja-vegetables/types'

export interface OrderDocument extends Omit<Order, '_id'>, Document {}

const OrderItemSchema = new Schema<OrderItem>(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },       // denormalized
    qty: { type: Number, required: true, min: 0.1 },
    unit: { type: String, enum: ['kg', 'piece', 'dozen'], required: true },
    priceAtOrder: { type: Number, required: true }, // FROZEN — never update this
    subtotal: { type: Number, required: true },
  },
  { _id: false }
)

const OrderSchema = new Schema<OrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true },
    clientType: { type: String, enum: ['local', 'b2b'], required: true },
    clientId: { type: String, required: true },
    clientName: { type: String, required: true },   // denormalized
    clientPhone: { type: String, required: true },  // denormalized for WhatsApp
    items: { type: [OrderItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending',
    },
    deliveryAddress: { type: String, required: true },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    billUrl: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
)

// Auto-generate order number: PV-YYYY-XXXX
OrderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('Order').countDocuments()
    const year = new Date().getFullYear()
    this.orderNumber = `PV-${year}-${String(count + 1).padStart(4, '0')}`
  }
  next()
})

// Index for fast dashboard queries
OrderSchema.index({ clientType: 1, createdAt: -1 })
OrderSchema.index({ status: 1 })

export const OrderModel = mongoose.model<OrderDocument>('Order', OrderSchema)

import mongoose, { Schema, Document } from 'mongoose'
import bcrypt from 'bcryptjs'
import type { B2BClient, User } from '@pooja-vegetables/types'

// ── B2B Client ────────────────────────────────

export interface B2BClientDocument extends Omit<B2BClient, '_id'>, Document {
  password: string
  comparePassword(candidate: string): Promise<boolean>
}

const B2BClientSchema = new Schema<B2BClientDocument>(
  {
    businessName: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    type: { type: String, enum: ['restaurant', 'canteen'], required: true },
    address: { type: String, required: true },
    password: { type: String, required: true, select: false }, // never sent to client
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

B2BClientSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

B2BClientSchema.methods['comparePassword'] = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password as string)
}

export const B2BClientModel = mongoose.model<B2BClientDocument>('B2BClient', B2BClientSchema)

// ── Local User ────────────────────────────────

export interface UserDocument extends Omit<User, '_id'>, Document {}

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  },
  { timestamps: true }
)

export const UserModel = mongoose.model<UserDocument>('User', UserSchema)

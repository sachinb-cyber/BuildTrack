import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  type: { type: String, enum: ['daily', 'temporary', 'supplier', 'generated'], required: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  items: [invoiceItemSchema],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['draft', 'pending', 'paid', 'overdue', 'cancelled'], default: 'pending' },
  dueDate: { type: Date },
  paidDate: { type: Date },
  paidAmount: { type: Number, default: 0 },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);

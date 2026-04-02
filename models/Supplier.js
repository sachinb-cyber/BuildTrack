import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  company: { type: String },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  gstNumber: { type: String },
  materials: [{ type: String }],
  totalBusiness: { type: Number, default: 0 },
  pendingAmount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Supplier || mongoose.model('Supplier', supplierSchema);

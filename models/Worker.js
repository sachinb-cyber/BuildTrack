import mongoose from 'mongoose';

const paymentEntrySchema = new mongoose.Schema({
  weekStartDate: { type: Date, required: true },
  weekEndDate: { type: Date, required: true },
  daysWorked: { type: Number, required: true, min: 0, max: 7 },
  dailyWage: { type: Number, required: true },
  overtime: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'paid', 'partial'], default: 'pending' },
  paidAmount: { type: Number, default: 0 },
  paidDate: { type: Date },
  notes: { type: String }
}, { timestamps: true });

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String },
  aadhar: { type: String },
  dailyWage: { type: Number, required: true },
  skill: { type: String, enum: ['mason', 'helper', 'carpenter', 'plumber', 'electrician', 'painter', 'other'], default: 'helper' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  isActive: { type: Boolean, default: true },
  joiningDate: { type: Date, default: Date.now },
  payments: [paymentEntrySchema]
}, { timestamps: true });

workerSchema.virtual('totalPaid').get(function () {
  return this.payments.reduce((sum, p) => sum + p.paidAmount, 0);
});
workerSchema.virtual('totalPending').get(function () {
  return this.payments.filter(p => p.status !== 'paid').reduce((sum, p) => sum + (p.totalAmount - p.paidAmount), 0);
});
workerSchema.set('toJSON', { virtuals: true });

export default mongoose.models.Worker || mongoose.model('Worker', workerSchema);

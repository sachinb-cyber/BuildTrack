import mongoose from 'mongoose';

const salaryEntrySchema = new mongoose.Schema({
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  baseSalary: { type: Number, required: true },
  allowances: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  netSalary: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'paid', 'partial'], default: 'pending' },
  paidAmount: { type: Number, default: 0 },
  paidDate: { type: Date },
  notes: { type: String }
}, { timestamps: true });

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String },
  phone: { type: String },
  role: { type: String, required: true },
  department: { type: String, enum: ['engineering', 'accounts', 'admin', 'procurement', 'management', 'other'], default: 'engineering' },
  baseSalary: { type: Number, required: true },
  joiningDate: { type: Date, default: Date.now },
  bankAccount: { type: String },
  isActive: { type: Boolean, default: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  salaryHistory: [salaryEntrySchema]
}, { timestamps: true });

export default mongoose.models.Staff || mongoose.model('Staff', staffSchema);

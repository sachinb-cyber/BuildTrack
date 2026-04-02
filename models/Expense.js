import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, enum: ['labor', 'material', 'transport', 'equipment', 'office', 'salary', 'utility', 'miscellaneous'], required: true },
  amount: { type: Number, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  date: { type: Date, default: Date.now },
  paymentMethod: { type: String, enum: ['cash', 'bank', 'upi', 'cheque'], default: 'cash' },
  reference: { type: String },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.models.Expense || mongoose.model('Expense', expenseSchema);

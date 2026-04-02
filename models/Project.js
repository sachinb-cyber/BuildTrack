import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  location: { type: String, required: true },
  client: { type: String },
  startDate: { type: Date, required: true },
  expectedEndDate: { type: Date },
  actualEndDate: { type: Date },
  budget: { type: Number, default: 0 },
  spent: { type: Number, default: 0 },
  status: { type: String, enum: ['planning', 'active', 'on-hold', 'completed'], default: 'planning' },
  description: { type: String },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  workers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }],
  staff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }]
}, { timestamps: true });

projectSchema.virtual('budgetUsedPercent').get(function () {
  if (!this.budget) return 0;
  return Math.round((this.spent / this.budget) * 100);
});
projectSchema.set('toJSON', { virtuals: true });

export default mongoose.models.Project || mongoose.model('Project', projectSchema);

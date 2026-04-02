import mongoose from 'mongoose';

const stockLogSchema = new mongoose.Schema({
  type: { type: String, enum: ['in', 'out'], required: true },
  quantity: { type: Number, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  unitPrice: { type: Number },
  totalCost: { type: Number },
  date: { type: Date, default: Date.now },
  notes: { type: String },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const materialSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, enum: ['cement', 'steel', 'sand', 'aggregate', 'bricks', 'wood', 'paint', 'electrical', 'plumbing', 'hardware', 'tiles', 'other'], required: true },
  unit: { type: String, enum: ['kg', 'bags', 'pieces', 'meters', 'sqft', 'cft', 'liters', 'tons', 'bundles'], required: true },
  currentStock: { type: Number, default: 0 },
  minStock: { type: Number, default: 10 },
  unitPrice: { type: Number, default: 0 },
  location: { type: String },
  stockLog: [stockLogSchema]
}, { timestamps: true });

materialSchema.virtual('isLowStock').get(function () {
  return this.currentStock <= this.minStock;
});
materialSchema.set('toJSON', { virtuals: true });

export default mongoose.models.Material || mongoose.model('Material', materialSchema);

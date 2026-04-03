import mongoose from 'mongoose';

const deliveryItemSchema = new mongoose.Schema({
  material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', default: null },
  materialName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: '' },
  unitPrice: { type: Number, default: 0 },
});

const deliverySchema = new mongoose.Schema({
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  phase: { type: String, enum: ['Foundation', 'Structure', 'Finishing', 'Handover', ''], default: '' },
  items: [deliveryItemSchema],
  deliveryDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'delivered', 'partial', 'cancelled'], default: 'pending' },
  notes: { type: String },
  geo: {
    lat: { type: Number },
    lng: { type: Number },
    accuracy: { type: Number },
    address: { type: String },
  },
  photo: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.models.Delivery || mongoose.model('Delivery', deliverySchema);

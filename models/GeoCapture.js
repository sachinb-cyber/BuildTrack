import mongoose from 'mongoose';

const geoCaptureSchema = new mongoose.Schema({
  imageUrl:    { type: String },
  imageData:   { type: String }, // base64 fallback (Vercel)
  lat:         { type: Number, required: true },
  lng:         { type: Number, required: true },
  accuracy:    { type: Number },
  timestamp:   { type: Date, required: true },
  project:     { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  projectName: { type: String },
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName:    { type: String },
  notes:       { type: String },
}, { timestamps: true });

export default mongoose.models.GeoCapture || mongoose.model('GeoCapture', geoCaptureSchema);

import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subscription: { type: Object, required: true }, // { endpoint, keys: { p256dh, auth } }
}, { timestamps: true });

pushSubscriptionSchema.index({ user: 1 });

export default mongoose.models.PushSubscription || mongoose.model('PushSubscription', pushSubscriptionSchema);

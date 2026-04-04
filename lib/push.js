import webpush from 'web-push';
import { connectDB } from './db';
import PushSubscription from '@/models/PushSubscription';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Send a push notification to specific user(s) or all users.
 * @param {string|string[]|null} userIds - ObjectId(s) to target, or null for all
 * @param {{ title: string, body: string, icon?: string, url?: string }} payload
 */
export async function sendPush(userIds, payload) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;
  await connectDB();

  const filter = userIds
    ? { user: { $in: Array.isArray(userIds) ? userIds : [userIds] } }
    : {};

  const subs = await PushSubscription.find(filter);
  if (!subs.length) return;

  const notification = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icon.svg',
    badge: '/icon.svg',
    url: payload.url || '/',
    timestamp: Date.now(),
  });

  await Promise.allSettled(
    subs.map(s =>
      webpush.sendNotification(s.subscription, notification).catch(async err => {
        // Remove expired/invalid subscriptions (410 = Gone)
        if (err.statusCode === 410) await PushSubscription.findByIdAndDelete(s._id);
      })
    )
  );
}

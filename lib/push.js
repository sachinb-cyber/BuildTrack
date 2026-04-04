import { connectDB } from './db';
import PushSubscription from '@/models/PushSubscription';

/**
 * Send a push notification to specific user(s) or all users.
 * web-push is imported lazily so build doesn't fail when VAPID env vars are absent.
 */
export async function sendPush(userIds, payload) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;
  await connectDB();

  const webpush = (await import('web-push')).default;
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@samarthdevelopers.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

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
        if (err.statusCode === 410) await PushSubscription.findByIdAndDelete(s._id);
      })
    )
  );
}

import { DeviceToken } from '../models';
import { NotificationData } from '../types';

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: NotificationData
): Promise<boolean> {
  try {
    const tokens = await DeviceToken.find({ userId, isActive: true });

    if (tokens.length === 0) {
      return false;
    }

    // Firebase Admin SDK would be used here
    // For now, just log and return true
    console.log(`Sending push to ${tokens.length} devices for user ${userId}`);
    console.log('Notification:', { title, body, data });

    // Example Firebase implementation:
    // const admin = require('firebase-admin');
    // const messages = tokens.map(t => ({
    //   notification: { title, body },
    //   data: data || {},
    //   token: t.token,
    // }));
    // await admin.messaging().sendAll(messages);

    return true;
  } catch (error) {
    console.error('Push notification error:', error);
    return false;
  }
}

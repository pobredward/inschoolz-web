/**
 * 웹에서 서버 측 푸시 알림을 발송하기 위한 유틸리티 함수들
 * 관리자 패널이나 백엔드 API에서 사용할 수 있습니다.
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { NotificationType } from '@/types';

interface ExpoMessage {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
  // Android 특화 설정
  android?: {
    channelId?: string;
    sound?: boolean | string;
    priority?: 'min' | 'low' | 'default' | 'high' | 'max';
    vibrate?: boolean | number[];
    color?: string;
  };
  // iOS 특화 설정
  ios?: {
    sound?: boolean | string;
    badge?: number;
    _displayInForeground?: boolean;
  };
}

/**
 * Expo Push API를 사용하여 푸시 알림 발송
 */
export async function sendExpoPushNotification(message: ExpoMessage): Promise<{
  success: boolean;
  error?: string;
  receipt?: any;
}> {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
        // 필요시 Access Token 추가
        // 'Authorization': `Bearer ${process.env.EXPO_ACCESS_TOKEN}`
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    
    if (response.ok) {
      return { success: true, receipt: result };
    } else {
      return { success: false, error: result.errors?.[0]?.message || 'Unknown error' };
    }
  } catch (error) {
    console.error('푸시 알림 발송 실패:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    };
  }
}

/**
 * 단일 사용자에게 푸시 알림 발송 (웹에서 사용)
 */
export async function sendPushNotificationToUser(
  userId: string,
  notificationType: NotificationType,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    // 사용자의 푸시 토큰 가져오기
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const pushTokens = userData.pushTokens;

    if (!pushTokens) {
      return { success: false, error: 'No push tokens found' };
    }

    // 모든 플랫폼의 토큰에 알림 발송
    const sendPromises: Promise<any>[] = [];
    
    Object.entries(pushTokens).forEach(([platform, tokenData]: [string, any]) => {
      if (tokenData?.token) {
        const channelId = getChannelIdForNotificationType(notificationType);
        const message: ExpoMessage = {
          to: tokenData.token,
          title,
          body,
          data: {
            type: notificationType,
            userId,
            ...data,
          },
          sound: 'default',
          priority: 'high',
          channelId,
          // Android 특화 설정 - 화면 꺼져있을 때도 소리와 진동
          android: {
            channelId,
            sound: true,
            priority: 'high',
            vibrate: true,
            color: '#FF231F7C', // 인스쿨즈 브랜드 컬러
          },
          // iOS 특화 설정 - 백그라운드에서도 소리
          ios: {
            sound: true,
            _displayInForeground: true,
          },
        };

        sendPromises.push(sendExpoPushNotification(message));
      }
    });

    if (sendPromises.length === 0) {
      return { success: false, error: 'No valid push tokens found' };
    }

    // 모든 토큰에 발송
    const results = await Promise.allSettled(sendPromises);
    
    // 최소 하나라도 성공하면 성공으로 처리
    const hasSuccess = results.some(result => 
      result.status === 'fulfilled' && result.value.success
    );

    if (hasSuccess) {
      return { success: true };
    } else {
      const errors = results
        .filter(result => result.status === 'rejected' || !result.value.success)
        .map(result => 
          result.status === 'rejected' 
            ? result.reason 
            : result.value.error
        )
        .join(', ');
      
      return { success: false, error: errors };
    }
  } catch (error) {
    console.error('사용자 푸시 알림 발송 실패:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * 여러 사용자에게 동시에 푸시 알림 발송 (웹에서 사용)
 */
export async function sendPushNotificationToMultipleUsers(
  userIds: string[],
  notificationType: NotificationType,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<{
  success: boolean;
  successCount: number;
  failureCount: number;
  errors: string[];
}> {
  const results = {
    success: true,
    successCount: 0,
    failureCount: 0,
    errors: [] as string[],
  };

  // 배치 크기 설정 (동시에 너무 많은 요청을 보내지 않도록)
  const batchSize = 10;
  
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    
    const batchPromises = batch.map(userId =>
      sendPushNotificationToUser(userId, notificationType, title, body, data)
        .then(result => ({ userId, ...result }))
        .catch(error => ({ userId, success: false, error: error.message }))
    );

    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach(result => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          results.successCount++;
        } else {
          results.failureCount++;
          results.errors.push(`${result.value.userId}: ${result.value.error}`);
        }
      } else {
        results.failureCount++;
        results.errors.push(`Unknown user: ${result.reason}`);
      }
    });

    // 배치 간 짧은 딜레이
    if (i + batchSize < userIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  results.success = results.successCount > 0;
  return results;
}

/**
 * 알림 타입에 따른 Android 채널 ID 반환
 */
function getChannelIdForNotificationType(type: NotificationType): string {
  const channelMap: Record<NotificationType, string> = {
    post_comment: 'comments',
    comment_reply: 'comments',
    system: 'system',
    referral: 'referral',
    warning: 'system',
    suspension: 'system',
    report_received: 'system',
    report_resolved: 'default',
  };

  return channelMap[type] || 'default';
}

/**
 * 즉시 테스트 푸시 알림 발송 (개발/테스트용)
 */
export async function sendTestPushNotification(
  userId: string,
  title: string = '웹에서 보내는 테스트 알림',
  body: string = '웹 관리자 패널에서 발송된 푸시 알림입니다.'
): Promise<{ success: boolean; error?: string }> {
  return sendPushNotificationToUser(
    userId,
    'system',
    title,
    body,
    {
      test: true,
      source: 'web-admin',
      timestamp: Date.now(),
    }
  );
}

/**
 * 알림 설정에 따른 필터링
 */
export async function shouldSendNotificationToUser(
  userId: string,
  notificationType: NotificationType
): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return false;
    }

    const userData = userDoc.data();
    const notificationSettings = userData.notificationSettings || {};

    // 기본적으로 모든 알림 허용
    const defaultSettings = {
      post_comment: true,
      comment_reply: true,
      system: true,
      referral: true,
      warning: true,
      suspension: true,
      report_received: true,
      report_resolved: true,
    };

    const settings = { ...defaultSettings, ...notificationSettings };
    return settings[notificationType] !== false;
  } catch (error) {
    console.error('알림 설정 확인 실패:', error);
    // 에러가 발생하면 기본적으로 알림 허용
    return true;
  }
}

/**
 * 웹에서 사용할 수 있는 통합 알림 발송 함수
 */
export async function sendNotificationWithChecks(
  userId: string,
  notificationType: NotificationType,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
  try {
    // 사용자가 해당 알림을 허용했는지 확인
    const shouldSend = await shouldSendNotificationToUser(userId, notificationType);
    
    if (!shouldSend) {
      return { success: true, skipped: true };
    }

    // 푸시 알림 발송
    return await sendPushNotificationToUser(userId, notificationType, title, body, data);
  } catch (error) {
    console.error('알림 발송 체크 실패:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * 직접 Expo Push Token으로 발송 (토큰을 직접 알고 있을 때)
 */
export async function sendDirectPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  const message: ExpoMessage = {
    to: expoPushToken,
    title,
    body,
    data: data || {},
    sound: 'default',
    priority: 'high',
    android: {
      channelId: 'default',
      sound: true,
      priority: 'high',
      vibrate: true,
      color: '#FF231F7C',
    },
    ios: {
      sound: true,
      _displayInForeground: true,
    },
  };

  const result = await sendExpoPushNotification(message);
  return {
    success: result.success,
    error: result.error,
  };
}

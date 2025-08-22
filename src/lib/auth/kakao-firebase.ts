import { getAdminAuth } from '@/lib/firebase-admin';
import { User } from '@/types';

/**
 * 카카오 사용자 정보로 Firebase 커스텀 토큰 생성
 */
export async function createKakaoFirebaseToken(
  kakaoUserId: string,
  userInfo: {
    email?: string;
    nickname?: string;
    profileImage?: string;
  }
): Promise<string> {
  try {
    console.log('🔧 getAdminAuth() 호출 중...');
    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      console.error('❌ Firebase Admin SDK 초기화 실패 - adminAuth가 null');
      throw new Error('Firebase Admin SDK가 초기화되지 않았습니다.');
    }
    console.log('✅ Firebase Admin Auth 객체 획득 성공');

    // Firebase Auth에서 카카오 ID를 기반으로 사용자 확인
    const firebaseUid = `kakao_${kakaoUserId}`;
    
    let firebaseUser;
    try {
      // 기존 Firebase Auth 사용자 확인
      firebaseUser = await adminAuth.getUser(firebaseUid);
      console.log('기존 Firebase Auth 사용자 발견:', firebaseUid);
    } catch (error) {
      // 사용자가 없으면 새로 생성
      firebaseUser = await adminAuth.createUser({
        uid: firebaseUid,
        email: userInfo.email,
        displayName: userInfo.nickname,
        photoURL: userInfo.profileImage,
        emailVerified: true, // 카카오에서 인증된 사용자로 간주
      });
      console.log('새 Firebase Auth 사용자 생성:', firebaseUid);
    }

    // 커스텀 클레임 설정 (필요에 따라)
    const customClaims = {
      provider: 'kakao',
      kakaoId: kakaoUserId,
      role: 'student', // 기본 역할
    };

    // 커스텀 토큰 생성
    const customToken = await adminAuth.createCustomToken(firebaseUid, customClaims);
    
    console.log('커스텀 토큰 생성 완료:', { uid: firebaseUid, provider: 'kakao' });
    
    return customToken;
  } catch (error) {
    console.error('커스텀 토큰 생성 실패:', error);
    throw new Error('Firebase 커스텀 토큰 생성에 실패했습니다.');
  }
}

/**
 * Firebase Auth 사용자 정보 업데이트
 */
export async function updateFirebaseUser(
  firebaseUid: string,
  updateData: {
    email?: string;
    displayName?: string;
    photoURL?: string;
  }
): Promise<void> {
  try {
    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      throw new Error('Firebase Admin SDK가 초기화되지 않았습니다.');
    }
    
    await adminAuth.updateUser(firebaseUid, updateData);
    console.log('Firebase Auth 사용자 정보 업데이트 완료:', firebaseUid);
  } catch (error) {
    console.error('Firebase Auth 사용자 정보 업데이트 실패:', error);
    throw new Error('Firebase Auth 사용자 정보 업데이트에 실패했습니다.');
  }
}

/**
 * Firebase Auth 사용자 삭제 (필요시)
 */
export async function deleteFirebaseUser(firebaseUid: string): Promise<void> {
  try {
    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      throw new Error('Firebase Admin SDK가 초기화되지 않았습니다.');
    }
    
    await adminAuth.deleteUser(firebaseUid);
    console.log('Firebase Auth 사용자 삭제 완료:', firebaseUid);
  } catch (error) {
    console.error('Firebase Auth 사용자 삭제 실패:', error);
    throw new Error('Firebase Auth 사용자 삭제에 실패했습니다.');
  }
}

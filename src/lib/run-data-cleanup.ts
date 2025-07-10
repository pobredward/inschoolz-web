// 데이터 정리 실행 스크립트
// 콘솔에서 직접 실행하거나 개발 환경에서 호출할 수 있습니다.

import { cleanUserData } from './clean-user-data';

export async function runDataCleanup() {
  console.log('🧹 사용자 데이터 정리를 시작합니다...');
  
  try {
    const result = await cleanUserData();
    
    if (result.success) {
      console.log('✅ 데이터 정리 완료!');
      console.log(`📊 처리된 사용자 수: ${result.processedCount}명`);
    } else {
      console.log('❌ 데이터 정리 실패:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('💥 데이터 정리 중 예외 발생:', error);
    return { success: false, error: '데이터 정리 중 예외 발생' };
  }
}

// 브라우저 콘솔에서 실행할 수 있도록 전역 객체에 추가
if (typeof window !== 'undefined') {
  (window as typeof window & { runDataCleanup: typeof runDataCleanup }).runDataCleanup = runDataCleanup;
}

// 간단한 테스트 함수 (현재 로그인한 사용자의 데이터만 확인)
export async function checkCurrentUserData() {
  const { auth } = await import('./firebase');
  
  if (!auth.currentUser) {
    console.log('❌ 로그인된 사용자가 없습니다.');
    return;
  }
  
  const { db } = await import('./firebase');
  const { doc, getDoc } = await import('firebase/firestore');
  
  try {
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('📄 현재 사용자 데이터:', userData);
      
      // 지역 정보 확인
      if (userData.regions) {
        console.log('📍 지역 정보:', userData.regions);
      } else {
        console.log('❌ 지역 정보가 없습니다.');
      }
      
      // 학교 정보 확인
      if (userData.school) {
        console.log('🏫 학교 정보:', userData.school);
      } else {
        console.log('❌ 학교 정보가 없습니다.');
      }
    } else {
      console.log('❌ 사용자 문서를 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('💥 사용자 데이터 확인 중 오류:', error);
  }
}

// 전역 함수로 추가
if (typeof window !== 'undefined') {
  (window as typeof window & { checkCurrentUserData: typeof checkCurrentUserData }).checkCurrentUserData = checkCurrentUserData;
} 
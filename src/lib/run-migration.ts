// 마이그레이션 실행 스크립트
// 콘솔에서 직접 실행하거나 개발 환경에서 호출할 수 있습니다.

import { migrateUserData } from './user-migration';

export async function runMigration() {
  console.log('🚀 사용자 데이터 마이그레이션을 시작합니다...');
  
  try {
    const result = await migrateUserData();
    
    if (result.success) {
      console.log('✅ 마이그레이션 완료!');
      console.log(`📊 처리된 사용자 수: ${result.processedCount}명`);
    } else {
      console.log('❌ 마이그레이션 실패:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('💥 마이그레이션 중 예외 발생:', error);
    return { success: false, error: '마이그레이션 중 예외 발생' };
  }
}

// 개발 환경에서 직접 실행
if (process.env.NODE_ENV === 'development') {
  // runMigration(); // 필요시 주석 해제
} 
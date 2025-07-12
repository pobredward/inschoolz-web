import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Firebase에서 실제 사용자 데이터를 확인하는 테스트 함수
 */
export async function testUserDataStructure() {
  try {
    console.log('🔍 Firebase 사용자 데이터 구조 테스트 시작...');
    
    // 최대 5명의 사용자 데이터 조회
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    
    const snapshot = await getDocs(usersQuery);
    
    if (snapshot.empty) {
      console.log('❌ Firebase에 사용자 데이터가 없습니다.');
      return;
    }
    
    console.log(`✅ ${snapshot.size}명의 사용자 데이터를 찾았습니다.`);
    
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n👤 사용자 ${index + 1} (ID: ${doc.id}):`);
      console.log('  - userName (최상위):', data.userName || '없음');
      console.log('  - profile.userName:', data.profile?.userName || '없음');
      console.log('  - stats.totalExperience:', data.stats?.totalExperience || 0);
      console.log('  - stats.level:', data.stats?.level || 1);
      console.log('  - stats.currentExp:', data.stats?.currentExp || 0);
      console.log('  - school:', data.school ? `${data.school.name} (${data.school.id})` : '없음');
      console.log('  - regions:', data.regions ? `${data.regions.sido} ${data.regions.sigungu}` : '없음');
    });
    
    return {
      success: true,
      userCount: snapshot.size,
      sampleData: snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    };
    
  } catch (error) {
    console.error('❌ 사용자 데이터 테스트 중 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

/**
 * 랭킹 API 테스트
 */
export async function testRankingAPI() {
  try {
    console.log('🎯 랭킹 API 테스트 시작...');
    
    // 전국 랭킹 테스트
    const { getRankings } = await import('./api/ranking');
    
    const nationalRanking = await getRankings({
      type: 'national',
      limit: 5
    });
    
    console.log('✅ 전국 랭킹 조회 성공:');
    console.log(`  - 조회된 사용자 수: ${nationalRanking.users.length}`);
    console.log(`  - 더 보기 가능: ${nationalRanking.hasMore}`);
    
    nationalRanking.users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.userName} (Lv.${user.stats.level}, ${user.stats.totalExperience}XP)`);
    });
    
    return {
      success: true,
      nationalRanking
    };
    
  } catch (error) {
    console.error('❌ 랭킹 API 테스트 중 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

/**
 * 브라우저 콘솔에서 실행할 수 있는 테스트 함수
 */
export async function runAllTests() {
  console.log('🚀 Inschoolz 랭킹 시스템 전체 테스트 시작\n');
  
  const userDataTest = await testUserDataStructure();
  console.log('\n' + '='.repeat(50) + '\n');
  
  if (userDataTest && userDataTest.success) {
    const rankingTest = await testRankingAPI();
    console.log('\n' + '='.repeat(50) + '\n');
    
    if (rankingTest.success) {
      console.log('🎉 모든 테스트가 성공적으로 완료되었습니다!');
    } else {
      console.log('⚠️ 랭킹 API 테스트에서 오류가 발생했습니다.');
    }
  } else {
    console.log('⚠️ 사용자 데이터 테스트에서 오류가 발생했습니다.');
  }
  
  console.log('\n🏁 테스트 완료');
}

// 브라우저에서 전역으로 접근 가능하도록 설정
if (typeof window !== 'undefined') {
  (window as typeof window & { testRanking?: object }).testRanking = {
    testUserDataStructure,
    testRankingAPI,
    runAllTests
  };
} 
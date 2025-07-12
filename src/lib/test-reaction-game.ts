import { getSystemSettings } from './experience';

/**
 * 반응속도 게임 경험치 계산 테스트
 */
export const testReactionGameXP = async () => {
  try {
    console.log('🧪 반응속도 게임 경험치 계산 테스트 시작');
    
    const settings = await getSystemSettings();
    const thresholds = settings.gameSettings.reactionGame.thresholds || [];
    
    console.log('📊 현재 임계값 설정:', thresholds);
    
    // 테스트 케이스들
    const testCases = [
      { reactionTime: 50, expected: 15 },   // 50ms -> 15XP (가장 빠름)
      { reactionTime: 100, expected: 15 },  // 100ms -> 15XP
      { reactionTime: 150, expected: 10 },  // 150ms -> 10XP
      { reactionTime: 200, expected: 10 },  // 200ms -> 10XP
      { reactionTime: 250, expected: 5 },   // 250ms -> 5XP
      { reactionTime: 300, expected: 5 },   // 300ms -> 5XP
      { reactionTime: 400, expected: 0 },   // 400ms -> 0XP (임계값 초과)
    ];
    
    console.log('\n🎯 테스트 케이스 실행:');
    
    for (const testCase of testCases) {
      const calculatedXP = calculateReactionGameXP(testCase.reactionTime, thresholds);
      const passed = calculatedXP === testCase.expected;
      
      console.log(
        `${passed ? '✅' : '❌'} ${testCase.reactionTime}ms -> ${calculatedXP}XP (예상: ${testCase.expected}XP)`
      );
      
      if (!passed) {
        console.error(`❌ 테스트 실패: ${testCase.reactionTime}ms에서 ${calculatedXP}XP 계산됨, 예상 ${testCase.expected}XP`);
      }
    }
    
    console.log('\n🎮 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 실행 중 오류:', error);
  }
};

/**
 * 반응속도 게임 경험치 계산 함수 (테스트용)
 */
function calculateReactionGameXP(reactionTime: number, thresholds: Array<{minScore: number; xpReward: number}>): number {
  // 반응속도 게임은 시간이 짧을수록 좋으므로 오름차순 정렬
  const sortedThresholds = [...thresholds].sort((a, b) => a.minScore - b.minScore);
  
  // 반응시간이 임계값 이하인 첫 번째 임계값의 경험치 반환
  for (const threshold of sortedThresholds) {
    if (reactionTime <= threshold.minScore) {
      return threshold.xpReward;
    }
  }
  
  return 0; // 어떤 임계값도 만족하지 않으면 0 XP
}

// 브라우저 콘솔에서 실행할 수 있도록 window 객체에 추가
if (typeof window !== 'undefined') {
  (window as typeof window & { testReactionGameXP: typeof testReactionGameXP }).testReactionGameXP = testReactionGameXP;
} 
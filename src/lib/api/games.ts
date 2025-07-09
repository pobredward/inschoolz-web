import {
  doc,
  getDoc,
  updateDoc,
  increment,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { XP_CONSTANTS, updateUserExperience } from '@/lib/experience';
import { User } from '@/types';

// 게임 타입
type GameType = 'flappyBird' | 'reactionGame' | 'tileGame';

// 일일 게임 제한 확인
const checkDailyGameLimit = async (
  userId: string,
  gameType: GameType
): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    const userData = userDoc.data() as User;
    
    // 일일 활동 제한 정보가 없으면 초기화
    if (!userData.activityLimits) {
      await updateDoc(userRef, {
        activityLimits: {
          lastResetDate: new Date().toISOString().split('T')[0],
          dailyCounts: {
            posts: 0,
            comments: 0,
            games: {
              flappyBird: 0,
              reactionGame: 0,
              tileGame: 0
            },
            adViewedCount: 0
          },
          adRewards: {
            flappyBird: 0,
            reactionGame: 0,
            tileGame: 0,
            lastRewardTime: 0
          }
        }
      });
      
      return true; // 제한 없음
    }
    
    // 날짜가 바뀌었으면 카운트 초기화
    const today = new Date().toISOString().split('T')[0];
    if (userData.activityLimits.lastResetDate !== today) {
      await updateDoc(userRef, {
        'activityLimits.lastResetDate': today,
        'activityLimits.dailyCounts.games.flappyBird': 0,
        'activityLimits.dailyCounts.games.reactionGame': 0,
        'activityLimits.dailyCounts.games.tileGame': 0,
        'activityLimits.dailyCounts.posts': 0,
        'activityLimits.dailyCounts.comments': 0,
        'activityLimits.dailyCounts.adViewedCount': 0
      });
      
      return true; // 제한 없음
    }
    
    // 현재 게임 횟수 확인
    const gameCount = userData.activityLimits?.dailyCounts?.games?.[gameType] || 0;
    
    // 일일 게임 제한은 5회
    return gameCount < 5;
  } catch (error) {
    console.error('일일 게임 제한 확인 오류:', error);
    return false;
  }
};

// 게임 횟수 증가
const incrementGameCount = async (
  userId: string,
  gameType: GameType
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      [`activityLimits.dailyCounts.games.${gameType}`]: increment(1)
    });
  } catch (error) {
    console.error('게임 횟수 증가 오류:', error);
  }
};

// 게임 점수 계산 및 경험치 부여
export const updateGameScore = async (
  userId: string,
  gameType: GameType,
  score: number
): Promise<{
  success: boolean;
  message: string;
  isHighScore?: boolean;
  leveledUp?: boolean;
  oldLevel?: number;
  newLevel?: number;
  dailyGameCount?: number;
  maxDailyGames?: number;
}> => {
  try {
    // 일일 게임 제한 확인
    const canPlay = await checkDailyGameLimit(userId, gameType);
    
    if (!canPlay) {
      return {
        success: false,
        message: '오늘의 게임 플레이 횟수를 모두 사용했습니다.',
        dailyGameCount: 5,
        maxDailyGames: 5
      };
    }
    
    // 게임 횟수 증가
    await incrementGameCount(userId, gameType);
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    const userData = userDoc.data() as User;
    
    // 기존 게임 최고 점수 확인
    const highScore = userData.gameStats?.[gameType]?.totalScore || 0;
    const isHighScore = score > highScore;
    
    // 게임 스탯 업데이트
    if (isHighScore) {
      await updateDoc(userRef, {
        [`gameStats.${gameType}.totalScore`]: score,
        [`gameStats.${gameType}.lastUpdated`]: Timestamp.now()
      });
    }
    
    // 경험치 계산 (게임별 고정 경험치)
    let xpEarned = 0;
    switch (gameType) {
      case 'flappyBird':
        xpEarned = XP_CONSTANTS.FLAPPY_BIRD_XP;
        break;
      case 'reactionGame':
        xpEarned = XP_CONSTANTS.REACTION_GAME_XP;
        break;
      case 'tileGame':
        xpEarned = XP_CONSTANTS.TILE_GAME_XP;
        break;
      default:
        xpEarned = 10; // 기본 경험치
    }
    
    // 경험치 업데이트 및 레벨업 체크
    const result = await updateUserExperience(userId, xpEarned);
    
    // 게임 플레이 횟수 가져오기
    const updatedUserDoc = await getDoc(userRef);
    const updatedUserData = updatedUserDoc.data() as User;
    const dailyGameCount = updatedUserData.activityLimits?.dailyCounts?.games?.[gameType] || 0;
    
    return {
      success: true,
      message: isHighScore 
        ? `축하합니다! 새로운 최고 점수(${score})를 달성했습니다!` 
        : `게임 완료! 점수: ${score}`,
      isHighScore,
      leveledUp: result.leveledUp,
      oldLevel: result.oldLevel,
      newLevel: result.newLevel,
      dailyGameCount,
      maxDailyGames: 5
    };
  } catch (error) {
    console.error('게임 점수 업데이트 오류:', error);
    return {
      success: false,
      message: '게임 점수 업데이트 중 오류가 발생했습니다.'
    };
  }
}; 
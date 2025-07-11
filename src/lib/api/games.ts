import { doc, getDoc, updateDoc, increment, FieldValue } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types';
import { updateUserExperience, getSystemSettings } from '@/lib/experience';

export type GameType = 'reactionGame' | 'tileGame' | 'flappyBird';

export interface GameResult {
  success: boolean;
  message?: string;
  xpEarned?: number;
  leveledUp?: boolean;
  oldLevel?: number;
  newLevel?: number;
  remainingAttempts?: number;
}

export interface GameStatsResponse {
  success: boolean;
  message?: string;
  data?: {
    todayPlays: Record<GameType, number>;
    maxPlays: number;
    bestReactionTimes: Record<GameType, number | null>;
    totalXpEarned: number;
  };
}

// 점수에 따른 경험치 계산 (Firebase 설정 기반)
const calculateGameXP = async (gameType: GameType, reactionTime: number): Promise<number> => {
  try {
    const settings = await getSystemSettings();
    
    // 게임 타입에 따라 적절한 설정 선택
    if (gameType === 'reactionGame' && settings.gameSettings.reactionGame.thresholds) {
      const sortedThresholds = [...settings.gameSettings.reactionGame.thresholds].sort((a, b) => a.minScore - b.minScore);
      
      for (const threshold of sortedThresholds) {
        if (reactionTime <= threshold.minScore) {
          return threshold.xpReward;
        }
      }
    } else if (gameType === 'tileGame' && settings.gameSettings.tileGame.thresholds) {
      const sortedThresholds = [...settings.gameSettings.tileGame.thresholds].sort((a, b) => a.minScore - b.minScore);
      
      for (const threshold of sortedThresholds) {
        if (reactionTime <= threshold.minScore) {
          return threshold.xpReward;
        }
      }
    } else if (gameType === 'flappyBird') {
      // flappyBird는 기본 경험치 반환
      return settings.gameSettings.flappyBird.rewardAmount;
    }
    
    return 0; // 어떤 threshold도 만족하지 않으면 0 XP
  } catch (error) {
    console.error('경험치 계산 중 오류:', error);
    return 0;
  }
};

// 게임 점수 업데이트 및 경험치 지급
export const updateGameScore = async (userId: string, gameType: GameType, score: number, reactionTime?: number): Promise<GameResult> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return {
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      };
    }
    
    const userData = userDoc.data() as User;
    
    // 현재 최저 반응시간 확인 (반응속도 게임의 경우)
    const currentBestReactionTime = userData.gameStats?.[gameType]?.bestReactionTime || null;
    const isBestReactionTime = gameType === 'reactionGame' && reactionTime && 
      (currentBestReactionTime === null || reactionTime < currentBestReactionTime);
    
    // 게임 통계 업데이트
    const today = new Date().toISOString().split('T')[0];
    const updateData: Record<string, number | string | FieldValue> = {};
    
    // 최저 반응시간 업데이트 (반응속도 게임의 경우)
    if (isBestReactionTime && reactionTime) {
      updateData[`gameStats.${gameType}.bestReactionTime`] = reactionTime;
    }
    
    // 일일 플레이 카운트 증가
    const currentDate = userData.activityLimits?.lastResetDate;
    if (currentDate !== today) {
      // 날짜가 바뀌었으면 카운트 리셋
      updateData[`activityLimits.lastResetDate`] = today;
      updateData[`activityLimits.dailyCounts.games.${gameType}`] = 1;
    } else {
      updateData[`activityLimits.dailyCounts.games.${gameType}`] = increment(1);
    }
    
    // Firestore 업데이트
    await updateDoc(userRef, updateData);
    
    // 경험치 계산 및 지급 (반응시간 기반)
    const xpEarned = await calculateGameXP(gameType, reactionTime || 1000);
    
    let result: { leveledUp: boolean; oldLevel?: number; newLevel?: number } = { 
      leveledUp: false, 
      oldLevel: undefined, 
      newLevel: undefined 
    };
    
    if (xpEarned > 0) {
      result = await updateUserExperience(userId, xpEarned);
    }
    
    return {
      success: true,
      leveledUp: result.leveledUp,
      oldLevel: result.oldLevel,
      newLevel: result.newLevel,
      xpEarned,
      message: '게임 점수가 성공적으로 저장되었습니다.'
    };
    
  } catch (error) {
    console.error('게임 점수 업데이트 실패:', error);
    return {
      success: false,
      message: '점수 저장 중 오류가 발생했습니다.'
    };
  }
};

// 사용자 게임 통계 조회
export const getUserGameStats = async (userId: string): Promise<GameStatsResponse> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return {
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      };
    }
    
    const userData = userDoc.data() as User;
    
    // 오늘 플레이 횟수
    const todayPlays = {
      flappyBird: userData.activityLimits?.dailyCounts?.games?.flappyBird || 0,
      reactionGame: userData.activityLimits?.dailyCounts?.games?.reactionGame || 0,
      tileGame: userData.activityLimits?.dailyCounts?.games?.tileGame || 0,
    };
    
    // 최저 반응시간
    const bestReactionTimes = {
      flappyBird: userData.gameStats?.flappyBird?.bestReactionTime || null,
      reactionGame: userData.gameStats?.reactionGame?.bestReactionTime || null,
      tileGame: userData.gameStats?.tileGame?.bestReactionTime || null,
    };
    
    // 일일 최대 플레이 횟수
    const maxPlays = 5;
    
    // 대략적인 총 획득 경험치 계산
    const totalXpEarned = Object.values(bestReactionTimes).reduce((sum, time) => {
      if (sum === null) sum = 0;
      return sum + (time ? Math.floor(time / 100) * 5 : 0);
    }, 0 as number);
    
    return {
      success: true,
      data: {
        todayPlays,
        maxPlays,
        bestReactionTimes,
        totalXpEarned: totalXpEarned || 0
      }
    };
    
  } catch (error) {
    console.error('게임 통계 조회 실패:', error);
    return {
      success: false,
      message: '게임 통계 조회 중 오류가 발생했습니다.'
    };
  }
}; 
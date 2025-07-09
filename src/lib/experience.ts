import { doc, getDoc, updateDoc, increment, collection, query, orderBy, limit, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, SystemSettings } from '@/types';

// 경험치 관련 상수 (시스템 설정에서 동적으로 로드됨)
export const DEFAULT_XP_CONSTANTS = {
  // 커뮤니티 활동 경험치
  POST_XP: 10,
  COMMENT_XP: 5,
  LIKE_XP: 1,
  
  // 출석 경험치
  ATTENDANCE_XP: 5,
  ATTENDANCE_STREAK_XP: 10,
  
  // 추천 경험치
  REFERRAL_XP: 50,
  
  // 게임 경험치 (기본값)
  REACTION_GAME_XP: 15,
  TILE_GAME_XP: 20,
  FLAPPY_BIRD_XP: 25,
  
  // 일일 활동 제한
  DAILY_POST_LIMIT: 3,
  DAILY_COMMENT_LIMIT: 5,
  DAILY_GAME_LIMIT: 5
};

// 하위 호환성을 위한 export
export const XP_CONSTANTS = DEFAULT_XP_CONSTANTS;

// 레벨별 필요 경험치 (1->2레벨 10exp, 2->3레벨 20exp, 오름차순)
export const DEFAULT_LEVEL_REQUIREMENTS = {
  1: 0,
  2: 10,
  3: 30,  // 10 + 20
  4: 60,  // 10 + 20 + 30
  5: 100, // 10 + 20 + 30 + 40
  6: 150, // 10 + 20 + 30 + 40 + 50
  7: 210,
  8: 280,
  9: 360,
  10: 450,
  11: 550,
  12: 660,
  13: 780,
  14: 910,
  15: 1050,
  16: 1200,
  17: 1360,
  18: 1530,
  19: 1710,
  20: 1900
};

/**
 * 시스템 설정 가져오기
 */
let cachedSystemSettings: SystemSettings | null = null;

export const getSystemSettings = async (): Promise<SystemSettings> => {
  if (cachedSystemSettings) {
    return cachedSystemSettings;
  }
  
  try {
    const settingsDoc = await getDoc(doc(db, 'system', 'settings'));
    if (settingsDoc.exists()) {
      cachedSystemSettings = settingsDoc.data() as SystemSettings;
      return cachedSystemSettings;
    }
  } catch (error) {
    console.error('시스템 설정 로드 실패:', error);
  }
  
  // 기본값 반환
  return {
    experience: {
      postReward: DEFAULT_XP_CONSTANTS.POST_XP,
      commentReward: DEFAULT_XP_CONSTANTS.COMMENT_XP,
      likeReward: DEFAULT_XP_CONSTANTS.LIKE_XP,
      attendanceReward: DEFAULT_XP_CONSTANTS.ATTENDANCE_XP,
      attendanceStreakReward: DEFAULT_XP_CONSTANTS.ATTENDANCE_STREAK_XP,
      referralReward: DEFAULT_XP_CONSTANTS.REFERRAL_XP,
      levelRequirements: DEFAULT_LEVEL_REQUIREMENTS
    },
    dailyLimits: {
      postsForReward: DEFAULT_XP_CONSTANTS.DAILY_POST_LIMIT,
      commentsForReward: DEFAULT_XP_CONSTANTS.DAILY_COMMENT_LIMIT,
      gamePlayCount: DEFAULT_XP_CONSTANTS.DAILY_GAME_LIMIT
    },
    gameSettings: {
      reactionGame: {
        rewardThreshold: 500,
        rewardAmount: DEFAULT_XP_CONSTANTS.REACTION_GAME_XP
      },
      tileGame: {
        rewardThreshold: 800,
        rewardAmount: DEFAULT_XP_CONSTANTS.TILE_GAME_XP
      },
      flappyBird: {
        rewardThreshold: 10,
        rewardAmount: DEFAULT_XP_CONSTANTS.FLAPPY_BIRD_XP
      }
    },
    ads: {
      rewardedVideo: {
        gameExtraPlays: 3,
        cooldownMinutes: 30
      }
    },
    appVersion: {
      current: '1.0.0',
      minimum: '1.0.0',
      forceUpdate: false
    },
    maintenance: {
      isActive: false
    }
  };
};

/**
 * 레벨에 따른 필요 경험치 계산 (시스템 설정 기반)
 */
export const calculateRequiredExpForLevel = async (targetLevel: number): Promise<number> => {
  const settings = await getSystemSettings();
  return settings.experience.levelRequirements[targetLevel] || (targetLevel - 1) * targetLevel * 5;
};

// 하위 호환성을 위한 export
export const calculateRequiredExp = calculateRequiredExpForLevel;

/**
 * 현재 레벨에서 다음 레벨로 가기 위한 필요 경험치
 */
export const calculateExpToNextLevel = async (currentLevel: number): Promise<number> => {
  const currentLevelExp = await calculateRequiredExpForLevel(currentLevel);
  const nextLevelExp = await calculateRequiredExpForLevel(currentLevel + 1);
  return nextLevelExp - currentLevelExp;
};

/**
 * 총 경험치에서 현재 레벨 계산
 */
export const calculateLevelFromTotalExp = async (totalExp: number): Promise<number> => {
  const settings = await getSystemSettings();
  const requirements = settings.experience.levelRequirements;
  
  let level = 1;
  for (const [levelStr, requiredExp] of Object.entries(requirements)) {
    const levelNum = parseInt(levelStr);
    if (totalExp >= requiredExp) {
      level = levelNum;
    } else {
      break;
    }
  }
  
  return level;
};

/**
 * 현재 레벨에서의 경험치 및 진행률 계산
 */
export const calculateCurrentLevelProgress = async (totalExp: number): Promise<{
  level: number;
  currentLevelExp: number;
  expToNextLevel: number;
  progressPercentage: number;
}> => {
  const level = await calculateLevelFromTotalExp(totalExp);
  const currentLevelExp = await calculateRequiredExpForLevel(level);
  const nextLevelExp = await calculateRequiredExpForLevel(level + 1);
  
  const currentLevelProgress = totalExp - currentLevelExp;
  const expToNextLevel = nextLevelExp - totalExp;
  const requiredForThisLevel = nextLevelExp - currentLevelExp;
  
  const progressPercentage = Math.min(100, Math.floor((currentLevelProgress / requiredForThisLevel) * 100));
  
  return {
    level,
    currentLevelExp: currentLevelProgress,
    expToNextLevel,
    progressPercentage
  };
};

/**
 * 일일 활동 제한 확인
 */
export const checkDailyLimit = async (userId: string, activityType: 'posts' | 'comments' | 'games'): Promise<{
  canEarnExp: boolean;
  currentCount: number;
  limit: number;
  resetTime: Date;
}> => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) {
    throw new Error('사용자를 찾을 수 없습니다.');
  }
  
  const userData = userDoc.data() as User;
  const settings = await getSystemSettings();
  const today = new Date().toISOString().split('T')[0];
  
  // 일일 제한 데이터 확인
  const activityLimits = userData.activityLimits;
  const lastResetDate = activityLimits?.lastResetDate;
  const dailyCounts = activityLimits?.dailyCounts || { posts: 0, comments: 0, games: { flappyBird: 0, reactionGame: 0, tileGame: 0 } };
  
  // 날짜가 바뀌었으면 리셋
  const needsReset = lastResetDate !== today;
  
  let currentCount = 0;
  let limit = 0;
  
  switch (activityType) {
    case 'posts':
      currentCount = needsReset ? 0 : dailyCounts.posts || 0;
      limit = settings.dailyLimits.postsForReward;
      break;
    case 'comments':
      currentCount = needsReset ? 0 : dailyCounts.comments || 0;
      limit = settings.dailyLimits.commentsForReward;
      break;
    case 'games':
      const totalGames = (dailyCounts.games?.flappyBird || 0) + 
                        (dailyCounts.games?.reactionGame || 0) + 
                        (dailyCounts.games?.tileGame || 0);
      currentCount = needsReset ? 0 : totalGames;
      limit = settings.dailyLimits.gamePlayCount;
      break;
  }
  
  // 다음 리셋 시간 (다음날 00:00)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  return {
    canEarnExp: currentCount < limit,
    currentCount,
    limit,
    resetTime: tomorrow
  };
};

/**
 * 활동 카운트 업데이트
 */
export const updateActivityCount = async (userId: string, activityType: 'posts' | 'comments', gameType?: 'flappyBird' | 'reactionGame' | 'tileGame'): Promise<void> => {
  const today = new Date().toISOString().split('T')[0];
  const userRef = doc(db, 'users', userId);
  
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) return;
  
  const userData = userDoc.data() as User;
  const activityLimits = userData.activityLimits;
  const needsReset = activityLimits?.lastResetDate !== today;
  
  // 리셋이 필요한 경우
  if (needsReset) {
    await updateDoc(userRef, {
      'activityLimits.lastResetDate': today,
      'activityLimits.dailyCounts.posts': activityType === 'posts' ? 1 : 0,
      'activityLimits.dailyCounts.comments': activityType === 'comments' ? 1 : 0,
      'activityLimits.dailyCounts.games.flappyBird': gameType === 'flappyBird' ? 1 : 0,
      'activityLimits.dailyCounts.games.reactionGame': gameType === 'reactionGame' ? 1 : 0,
      'activityLimits.dailyCounts.games.tileGame': gameType === 'tileGame' ? 1 : 0
    });
  } else {
    // 기존 카운트 증가
    if (activityType === 'posts') {
      await updateDoc(userRef, {
        'activityLimits.dailyCounts.posts': increment(1)
      });
    } else if (activityType === 'comments') {
      await updateDoc(userRef, {
        'activityLimits.dailyCounts.comments': increment(1)
      });
    } else if (gameType) {
      await updateDoc(userRef, {
        [`activityLimits.dailyCounts.games.${gameType}`]: increment(1)
      });
    }
  }
};

/**
 * 경험치 지급 함수
 */
export const awardExperience = async (
  userId: string, 
  activityType: 'post' | 'comment' | 'like' | 'attendance' | 'attendanceStreak' | 'referral' | 'game',
  amount?: number,
  gameType?: 'flappyBird' | 'reactionGame' | 'tileGame',
  gameScore?: number
): Promise<{
  success: boolean;
  expAwarded: number;
  leveledUp: boolean;
  oldLevel?: number;
  newLevel?: number;
  reason?: string;
}> => {
  try {
    const settings = await getSystemSettings();
    let expToAward = 0;
    let shouldCheckLimit = true;
    let activityLimitType: 'posts' | 'comments' | 'games' | null = null;
    
    // 활동 타입별 경험치 계산
    switch (activityType) {
      case 'post':
        expToAward = settings.experience.postReward;
        activityLimitType = 'posts';
        break;
      case 'comment':
        expToAward = settings.experience.commentReward;
        activityLimitType = 'comments';
        break;
      case 'like':
        expToAward = settings.experience.likeReward;
        shouldCheckLimit = false; // 좋아요는 제한 없음
        break;
      case 'attendance':
        expToAward = settings.experience.attendanceReward;
        shouldCheckLimit = false;
        break;
      case 'attendanceStreak':
        expToAward = settings.experience.attendanceStreakReward;
        shouldCheckLimit = false;
        break;
      case 'referral':
        expToAward = settings.experience.referralReward;
        shouldCheckLimit = false;
        break;
      case 'game':
        if (!gameType) return { success: false, expAwarded: 0, leveledUp: false, reason: '게임 타입이 필요합니다.' };
        
        const gameSettings = settings.gameSettings[gameType];
        if (gameScore && gameScore >= gameSettings.rewardThreshold) {
          expToAward = gameSettings.rewardAmount;
          activityLimitType = 'games';
        } else {
          return { success: false, expAwarded: 0, leveledUp: false, reason: '기준 점수에 도달하지 못했습니다.' };
        }
        break;
      default:
        expToAward = amount || 0;
        shouldCheckLimit = false;
    }
    
    // 일일 제한 확인
    if (shouldCheckLimit && activityLimitType) {
      const limitCheck = await checkDailyLimit(userId, activityLimitType);
      if (!limitCheck.canEarnExp) {
        return { 
          success: false, 
          expAwarded: 0, 
          leveledUp: false, 
          reason: `일일 제한에 도달했습니다. (${limitCheck.currentCount}/${limitCheck.limit})` 
        };
      }
    }
    
    // 경험치 업데이트
    const result = await updateUserExperience(userId, expToAward);
    
    // 활동 카운트 업데이트
    if (activityLimitType === 'posts') {
      await updateActivityCount(userId, 'posts');
    } else if (activityLimitType === 'comments') {
      await updateActivityCount(userId, 'comments');
    } else if (activityType === 'game' && gameType) {
      await updateActivityCount(userId, 'posts', gameType); // 게임의 경우 임시로 posts 타입 사용하고 gameType 전달
    }
    
    return {
      success: true,
      expAwarded: expToAward,
      leveledUp: result.leveledUp,
      oldLevel: result.oldLevel,
      newLevel: result.newLevel
    };
    
  } catch (error) {
    console.error('경험치 지급 실패:', error);
    return { success: false, expAwarded: 0, leveledUp: false, reason: '경험치 지급 중 오류가 발생했습니다.' };
  }
};

/**
 * 사용자 경험치 업데이트 및 레벨업 처리 (개선된 버전)
 */
export const updateUserExperience = async (
  userId: string, 
  xp: number
): Promise<{ 
  leveledUp: boolean; 
  oldLevel?: number; 
  newLevel?: number; 
  userData?: User 
}> => {
  if (!xp) return { leveledUp: false };
  
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    const userData = userDoc.data() as User;
    const currentExp = userData.stats?.experience || 0;
    const currentLevel = userData.stats?.level || 1;
    
    // 새로운 총 경험치
    const newTotalExp = currentExp + xp;
    
    // 새 레벨 계산
    const newLevel = await calculateLevelFromTotalExp(newTotalExp);
    const leveledUp = newLevel > currentLevel;
    
    // 현재 레벨 진행률 계산
    const progress = await calculateCurrentLevelProgress(newTotalExp);
    
    // 데이터 업데이트
    await updateDoc(userRef, {
      'stats.experience': newTotalExp,
      'stats.level': newLevel,
      'stats.currentExp': progress.currentLevelExp
    });
    
    if (leveledUp) {
      console.log(`🎉 사용자 ${userId}가 레벨 ${currentLevel}에서 레벨 ${newLevel}로 레벨업했습니다!`);
    }
    
    console.log(`✨ 사용자 ${userId}에게 ${xp} 경험치가 추가되었습니다. (총 ${newTotalExp}XP)`);
    
    // 업데이트된 사용자 데이터 조회
    const updatedUserDoc = await getDoc(userRef);
    const updatedUserData = updatedUserDoc.data() as User;
    
    return { 
      leveledUp, 
      oldLevel: currentLevel, 
      newLevel, 
      userData: updatedUserData 
    };
  } catch (error) {
    console.error('경험치 업데이트 오류:', error);
    return { leveledUp: false };
  }
};

/**
 * 랭킹 데이터 조회
 */
export const getRankingData = async (
  type: 'global' | 'school' | 'region',
  schoolId?: string,
  sido?: string,
  sigungu?: string,
  limitCount: number = 100
): Promise<Array<{
  rank: number;
  userId: string;
  displayName: string;
  schoolName?: string;
  level: number;
  experience: number;
  profileImageUrl?: string;
}>> => {
  try {
    let usersQuery;
    
    if (type === 'school' && schoolId) {
      usersQuery = query(
        collection(db, 'users'),
        where('school.id', '==', schoolId),
        orderBy('stats.experience', 'desc'),
        limit(limitCount)
      );
    } else if (type === 'region' && sido) {
      if (sigungu) {
        usersQuery = query(
          collection(db, 'users'),
          where('regions.sido', '==', sido),
          where('regions.sigungu', '==', sigungu),
          orderBy('stats.experience', 'desc'),
          limit(limitCount)
        );
      } else {
        usersQuery = query(
          collection(db, 'users'),
          where('regions.sido', '==', sido),
          orderBy('stats.experience', 'desc'),
          limit(limitCount)
        );
      }
    } else {
      // 전체 랭킹
      usersQuery = query(
        collection(db, 'users'),
        orderBy('stats.experience', 'desc'),
        limit(limitCount)
      );
    }
    
    const querySnapshot = await getDocs(usersQuery);
    const rankingData: Array<{
      rank: number;
      userId: string;
      displayName: string;
      schoolName?: string;
      level: number;
      experience: number;
      profileImageUrl?: string;
    }> = [];
    
    querySnapshot.docs.forEach((doc, index) => {
      const userData = doc.data() as User;
      rankingData.push({
        rank: index + 1,
        userId: doc.id,
        displayName: userData.profile.userName,
        schoolName: userData.school?.name,
        level: userData.stats?.level || 1,
        experience: userData.stats?.experience || 0,
        profileImageUrl: userData.profile.profileImageUrl
      });
    });
    
    return rankingData;
  } catch (error) {
    console.error('랭킹 데이터 조회 실패:', error);
    return [];
  }
};

/**
 * 사용자의 현재 랭킹 조회
 */
export const getUserRank = async (
  userId: string,
  type: 'global' | 'school' | 'region',
  schoolId?: string,
  sido?: string,
  sigungu?: string
): Promise<number | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return null;
    
    const userData = userDoc.data() as User;
    const userExp = userData.stats?.experience || 0;
    
    let usersQuery;
    
    if (type === 'school' && schoolId) {
      usersQuery = query(
        collection(db, 'users'),
        where('school.id', '==', schoolId),
        where('stats.experience', '>', userExp)
      );
    } else if (type === 'region' && sido) {
      if (sigungu) {
        usersQuery = query(
          collection(db, 'users'),
          where('regions.sido', '==', sido),
          where('regions.sigungu', '==', sigungu),
          where('stats.experience', '>', userExp)
        );
      } else {
        usersQuery = query(
          collection(db, 'users'),
          where('regions.sido', '==', sido),
          where('stats.experience', '>', userExp)
        );
      }
    } else {
      // 전체 랭킹
      usersQuery = query(
        collection(db, 'users'),
        where('stats.experience', '>', userExp)
      );
    }
    
    const querySnapshot = await getDocs(usersQuery);
    return querySnapshot.size + 1; // 자신보다 높은 사람 수 + 1 = 자신의 순위
    
  } catch (error) {
    console.error('사용자 랭킹 조회 실패:', error);
    return null;
  }
}; 
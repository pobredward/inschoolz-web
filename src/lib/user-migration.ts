import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  writeBatch,
  query,
  limit,
  startAfter,
  orderBy,
  DocumentSnapshot
} from 'firebase/firestore';
import { User } from '@/types';

/**
 * 기존 사용자 데이터를 새로운 구조로 마이그레이션
 */
export async function migrateUserData() {
  console.log('사용자 데이터 마이그레이션 시작...');
  
  let lastDoc: DocumentSnapshot | null = null;
  let processedCount = 0;
  const batchSize = 100;

  try {
    while (true) {
      // 배치 단위로 사용자 데이터 조회
      let q = query(
        collection(db, 'users'),
        orderBy('profile.createdAt', 'desc'),
        limit(batchSize)
      );

      if (lastDoc) {
        q = query(
          collection(db, 'users'),
          orderBy('profile.createdAt', 'desc'),
          startAfter(lastDoc),
          limit(batchSize)
        );
      }

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('모든 사용자 데이터 마이그레이션 완료');
        break;
      }

      const batch = writeBatch(db);
      
      snapshot.docs.forEach((docSnapshot) => {
        const userData = docSnapshot.data();
        const userId = docSnapshot.id;
        
        // 기존 데이터 구조 확인 및 마이그레이션
        const migratedData = migrateUserStructure(userData);
        
        if (migratedData) {
          batch.update(doc(db, 'users', userId), migratedData);
          processedCount++;
        }
      });

      // 배치 실행
      await batch.commit();
      
      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      console.log(`${processedCount}명의 사용자 데이터 마이그레이션 완료`);
    }

    console.log(`총 ${processedCount}명의 사용자 데이터 마이그레이션 완료`);
    return { success: true, processedCount };
    
  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
}

/**
 * 개별 사용자 데이터 구조 마이그레이션
 */
function migrateUserStructure(userData: Record<string, any>): Partial<User> | null {
  let needsUpdate = false;
  const migratedData: Partial<User> = {};

  // 1. 기본 정보 마이그레이션
  if (userData.email && !userData.role) {
    migratedData.role = 'student';
    needsUpdate = true;
  }

  if (userData.emailVerified !== undefined && userData.isVerified === undefined) {
    migratedData.isVerified = userData.emailVerified;
    needsUpdate = true;
  }

  // 2. 프로필 정보 마이그레이션 및 정리
  if (userData.profile) {
    const profile = userData.profile;
    const migratedProfile: any = { ...profile };
    
    // 누락된 필드 추가
    if (!profile.gender) migratedProfile.gender = '';
    if (!profile.birthYear) migratedProfile.birthYear = 0;
    if (!profile.birthMonth) migratedProfile.birthMonth = 0;
    if (!profile.birthDay) migratedProfile.birthDay = 0;
    if (!profile.phoneNumber) migratedProfile.phoneNumber = '';
    if (!profile.profileImageUrl) migratedProfile.profileImageUrl = '';
    if (profile.isAdmin === undefined) migratedProfile.isAdmin = false;
    
    // 불필요한 필드들 제거 (profile 내부에서)
    const fieldsToRemove = [
      'schoolId', 'schoolName', 'province', 'city',
      'termsAgreed', 'privacyAgreed', 'locationAgreed', 'marketingAgreed',
      'grade', 'classNumber', 'studentNumber', 'isGraduate'
    ];
    
    let removedFields = false;
    fieldsToRemove.forEach(field => {
      if (profile[field] !== undefined) {
        delete migratedProfile[field];
        removedFields = true;
      }
    });
    
    if (removedFields) {
      needsUpdate = true;
    }
    
    migratedData.profile = migratedProfile;
  }

  // 3. 학교 정보 마이그레이션 및 정리
  if (userData.profile?.schoolId && userData.profile?.schoolName) {
    // profile에서 school로 이동
    migratedData.school = {
      id: userData.profile.schoolId,
      name: userData.profile.schoolName
    };
    needsUpdate = true;
  } else if (userData.school) {
    // 기존 school 필드에서 사용하지 않는 필드 제거
    const cleanSchool: any = {
      id: userData.school.id,
      name: userData.school.name
    };
    
    // 사용하지 않는 필드들이 있으면 제거
    if (userData.school.grade || userData.school.classNumber || 
        userData.school.studentNumber || userData.school.isGraduate !== undefined) {
      migratedData.school = cleanSchool;
      needsUpdate = true;
    }
  }

  // 4. 지역 정보 마이그레이션
  if (userData.profile?.province && userData.profile?.city) {
    migratedData.regions = {
      sido: userData.profile.province,
      sigungu: userData.profile.city,
      address: userData.regions?.address || ''
    };
    needsUpdate = true;
  }

  // 5. 통계 정보 마이그레이션
  if (userData.stats) {
    const stats = userData.stats;
    const migratedStats: any = { ...stats };
    
    // 필드명 통일
    if (stats.currentExp !== undefined && stats.experience === undefined) {
      migratedStats.experience = stats.currentExp;
      delete migratedStats.currentExp;
      needsUpdate = true;
    }
    
    if (stats.currentXP !== undefined && stats.experience === undefined) {
      migratedStats.experience = stats.currentXP;
      delete migratedStats.currentXP;
      needsUpdate = true;
    }
    
    if (stats.totalXP !== undefined && stats.totalExperience === undefined) {
      migratedStats.totalExperience = stats.totalXP;
      delete migratedStats.totalXP;
      needsUpdate = true;
    }
    
    // 누락된 필드 추가
    if (!stats.totalExperience) migratedStats.totalExperience = stats.experience || 0;
    if (!stats.postCount) migratedStats.postCount = 0;
    if (!stats.commentCount) migratedStats.commentCount = 0;
    if (!stats.likeCount) migratedStats.likeCount = 0;
    if (!stats.streak) migratedStats.streak = 0;
    if (!stats.level) migratedStats.level = 1;
    
    migratedData.stats = migratedStats;
  }

  // 6. 약관 동의 정보 마이그레이션
  if (userData.profile?.termsAgreed !== undefined || 
      userData.profile?.privacyAgreed !== undefined ||
      userData.profile?.locationAgreed !== undefined ||
      userData.profile?.marketingAgreed !== undefined) {
    migratedData.agreements = {
      terms: userData.profile.termsAgreed || false,
      privacy: userData.profile.privacyAgreed || false,
      location: userData.profile.locationAgreed || false,
      marketing: userData.profile.marketingAgreed || false
    };
    needsUpdate = true;
  }

  // 7. 기본 구조 추가
  if (!userData.activityLimits) {
    migratedData.activityLimits = {
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
    };
    needsUpdate = true;
  }

  if (!userData.gameStats) {
    migratedData.gameStats = {
      flappyBird: { totalScore: 0 },
      reactionGame: { totalScore: 0 },
      tileGame: { totalScore: 0 }
    };
    needsUpdate = true;
  }

  if (!userData.social) {
    migratedData.social = {
      followers: 0,
      following: 0,
      friends: 0
    };
    needsUpdate = true;
  }

  if (!userData.preferences) {
    migratedData.preferences = {
      theme: 'light',
      fontSize: 'medium',
      notificationSounds: true,
      chatAlerts: true,
      emailNotifications: {
        posts: true,
        comments: true,
        messages: true,
        system: true
      }
    };
    needsUpdate = true;
  }

  return needsUpdate ? migratedData : null;
}

/**
 * 특정 사용자 데이터 마이그레이션
 */
export async function migrateSpecificUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const userDoc = doc(db, 'users', userId);
    const userSnapshot = await getDocs(query(collection(db, 'users')));
    
    // 사용자 데이터 조회 및 마이그레이션
    const userData = userSnapshot.docs.find(doc => doc.id === userId)?.data();
    
    if (!userData) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }

    const migratedData = migrateUserStructure(userData);
    
    if (migratedData) {
      await updateDoc(userDoc, migratedData);
      console.log(`사용자 ${userId} 마이그레이션 완료`);
      return { success: true };
    }

    return { success: true }; // 마이그레이션이 필요하지 않음
    
  } catch (error) {
    console.error(`사용자 ${userId} 마이그레이션 실패:`, error);
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
} 
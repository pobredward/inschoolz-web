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

/**
 * 기존 사용자 데이터를 정리하는 함수
 */
export async function cleanUserData() {
  console.log('🧹 사용자 데이터 정리 시작...');
  
  let lastDoc: DocumentSnapshot | null = null;
  let processedCount = 0;
  const batchSize = 100;

  try {
    while (true) {
      // 배치 단위로 사용자 데이터 조회
      let q = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        limit(batchSize)
      );

      if (lastDoc) {
        q = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(batchSize)
        );
      }

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('모든 사용자 데이터 정리 완료');
        break;
      }

      const batch = writeBatch(db);
      
      snapshot.docs.forEach((docSnapshot) => {
        const userData = docSnapshot.data();
        const userId = docSnapshot.id;
        
        // 데이터 정리 로직
        const cleanedData = cleanUserStructure(userData);
        
        if (cleanedData && Object.keys(cleanedData).length > 0) {
          batch.update(doc(db, 'users', userId), cleanedData);
          processedCount++;
        }
      });

      // 배치 실행
      if (processedCount > 0) {
        await batch.commit();
      }
      
      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      console.log(`${processedCount}명의 사용자 데이터 정리 완료`);
    }

    console.log(`총 ${processedCount}명의 사용자 데이터 정리 완료`);
    return { success: true, processedCount };
    
  } catch (error) {
    console.error('데이터 정리 중 오류 발생:', error);
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
}

/**
 * 개별 사용자 데이터 구조 정리
 */
function cleanUserStructure(userData: Record<string, any>): Record<string, any> | null {
  const cleanedData: Record<string, any> = {};
  let needsUpdate = false;

  // 1. profile 필드에서 불필요한 필드 제거
  if (userData.profile) {
    const profile = userData.profile;
    const cleanedProfile = { ...profile };
    
    // 제거할 필드들
    const fieldsToRemove = [
      'schoolId', 'schoolName', 'province', 'city',
      'termsAgreed', 'privacyAgreed', 'locationAgreed', 'marketingAgreed',
      'grade', 'classNumber', 'studentNumber', 'isGraduate'
    ];
    
    let removedFields = false;
    fieldsToRemove.forEach(field => {
      if (profile[field] !== undefined) {
        delete cleanedProfile[field];
        removedFields = true;
      }
    });
    
    if (removedFields) {
      cleanedData.profile = cleanedProfile;
      needsUpdate = true;
    }
  }

  // 2. school 필드에서 불필요한 필드 제거
  if (userData.school) {
    const school = userData.school;
    
    // 사용하지 않는 필드들이 있으면 제거
    if (school.grade !== undefined || school.classNumber !== undefined || 
        school.studentNumber !== undefined || school.isGraduate !== undefined) {
      cleanedData.school = {
        id: school.id,
        name: school.name
      };
      needsUpdate = true;
    }
  }

  // 3. profile에서 school로 데이터 이동
  if (userData.profile?.schoolId && userData.profile?.schoolName && !userData.school) {
    cleanedData.school = {
      id: userData.profile.schoolId,
      name: userData.profile.schoolName
    };
    needsUpdate = true;
  }

  // 4. profile에서 regions로 데이터 이동
  if (userData.profile?.province && userData.profile?.city && !userData.regions) {
    cleanedData.regions = {
      sido: userData.profile.province,
      sigungu: userData.profile.city,
      address: ''
    };
    needsUpdate = true;
  }

  // 5. profile에서 agreements로 데이터 이동
  if ((userData.profile?.termsAgreed !== undefined || 
       userData.profile?.privacyAgreed !== undefined ||
       userData.profile?.locationAgreed !== undefined ||
       userData.profile?.marketingAgreed !== undefined) && !userData.agreements) {
    cleanedData.agreements = {
      terms: userData.profile.termsAgreed || false,
      privacy: userData.profile.privacyAgreed || false,
      location: userData.profile.locationAgreed || false,
      marketing: userData.profile.marketingAgreed || false
    };
    needsUpdate = true;
  }

  return needsUpdate ? cleanedData : null;
}

/**
 * 특정 사용자 데이터 정리
 */
export async function cleanSpecificUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const userDoc = doc(db, 'users', userId);
    const userSnapshot = await getDocs(query(collection(db, 'users')));
    
    // 사용자 데이터 조회 및 정리
    const userData = userSnapshot.docs.find(doc => doc.id === userId)?.data();
    
    if (!userData) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }

    const cleanedData = cleanUserStructure(userData);
    
    if (cleanedData && Object.keys(cleanedData).length > 0) {
      await updateDoc(userDoc, cleanedData);
      console.log(`사용자 ${userId} 데이터 정리 완료`);
      return { success: true };
    }

    return { success: true }; // 정리가 필요하지 않음
    
  } catch (error) {
    console.error(`사용자 ${userId} 데이터 정리 실패:`, error);
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
} 
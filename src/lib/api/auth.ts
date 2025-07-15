import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db, storage } from '@/lib/firebase';
import { FormDataType, User } from '@/types';
import { FirebaseError } from 'firebase/app';

/**
 * 추천인 아이디 검증 함수
 */
export async function validateReferralCode(referralCode: string): Promise<{
  isValid: boolean;
  user?: {
    uid: string;
    userName: string;
    displayName: string;
  };
  message?: string;
}> {
  if (!referralCode || referralCode.trim() === '') {
    return {
      isValid: false,
      message: '추천인 아이디를 입력해주세요.'
    };
  }

  try {
    // users 컬렉션에서 userName으로 검색
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('profile.userName', '==', referralCode.trim()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        isValid: false,
        message: '존재하지 않는 사용자입니다.'
      };
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as User;

    return {
      isValid: true,
      user: {
        uid: userDoc.id,
        userName: userData.profile.userName,
        displayName: userData.profile.userName
      }
    };
  } catch (error) {
    console.error('추천인 검증 오류:', error);
    return {
      isValid: false,
      message: '추천인 검증 중 오류가 발생했습니다.'
    };
  }
}
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';


/**
 * 회원가입 함수
 */
export const signUp = async (userData: FormDataType): Promise<{ user: User }> => {
  try {
    if (!userData.email || !userData.password) {
      throw new Error('이메일과 비밀번호는 필수 입력 항목입니다.');
    }

    // 이메일/비밀번호로 Firebase Auth 계정 생성
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );
    
    const userId = userCredential.user.uid;
    
    // 프로필 이미지 업로드 처리
    let profileImageUrl = '';
    if (userData.profileImage) {
      try {
        // 파일 확장자 추출
        const fileExtension = userData.profileImage.name.split('.').pop();
        const fileName = `${userId}_${Date.now()}.${fileExtension}`;
        const storageRef = ref(storage, `profile_images/${fileName}`);
        
        // 이미지 업로드
        await uploadBytes(storageRef, userData.profileImage);
        
        // 다운로드 URL 가져오기
        profileImageUrl = await getDownloadURL(storageRef);
      } catch (imageError) {
        console.error('프로필 이미지 업로드 오류:', imageError);
        // 이미지 업로드 실패해도 회원가입은 계속 진행
      }
    }
    
    // 사용자 프로필 정보 설정 (userName)
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: userData.userName,
        photoURL: profileImageUrl
      });
    }
    
    // Firestore에 사용자 데이터 저장 (통일된 구조 - Timestamp 사용)
    const userDocRef = doc(db, 'users', userId);
    
    // 기본 사용자 데이터 구조 (undefined 필드 제거, Timestamp 사용)
    const userDoc: User = {
      uid: userId,
      email: userData.email,
      role: 'student',
      status: 'active', // 기본 상태를 'active'로 설정
      isVerified: true, // 이메일 인증 없이 바로 인증된 상태로 처리
      
      // 프로필 정보
      profile: {
        userName: userData.userName,
        realName: userData.realName,
        gender: userData.gender,
        birthYear: Number(userData.birthYear),
        birthMonth: Number(userData.birthMonth),
        birthDay: Number(userData.birthDay),
        phoneNumber: userData.phoneNumber,
        profileImageUrl: profileImageUrl,
        createdAt: Date.now(), // number 타입으로 변경
        isAdmin: false
      },
      
      // 경험치/통계
      stats: {
        level: 1,
        experience: 0,
        totalExperience: 0,
        currentExp: 0,
        currentLevelRequiredXp: 40,
        postCount: 0,
        commentCount: 0,
        likeCount: 0,
        streak: 0
      },
      
      // 약관 동의
      agreements: {
        terms: userData.agreements.terms,
        privacy: userData.agreements.privacy,
        location: userData.agreements.location,
        marketing: userData.agreements.marketing
      },
      
      // 시스템 정보 (Timestamp 사용)
      createdAt: Date.now(),
      updatedAt: Date.now()
    } as User;
    
    // 학교 정보가 있는 경우에만 추가 (앱과 동일한 로직)
    if (userData.school && userData.school.id && userData.school.id.trim() !== '') {
      userDoc.school = {
        id: userData.school.id,
        name: userData.school.name || ''
      };
    }
    
    // 지역 정보가 있는 경우에만 추가 (앱과 동일한 로직)
    if (userData.regions && userData.regions.sido && userData.regions.sigungu) {
      userDoc.regions = {
        sido: userData.regions.sido,
        sigungu: userData.regions.sigungu,
        address: userData.regions.address || ''
      };
    }
    
    // 추천인 정보가 있는 경우에만 추가
    if (userData.referral && userData.referral.trim() !== '') {
      userDoc.referrerId = userData.referral;
    }
    
    // Firestore에 저장
    await setDoc(userDocRef, userDoc);
    
    // 선택한 학교가 있는 경우, 학교의 멤버 카운트와 즐겨찾기 카운트 증가
    if (userData.school && userData.school.id && userData.school.id.trim() !== '') {
      try {
        const schoolRef = doc(db, 'schools', userData.school.id);
        const schoolDoc = await getDoc(schoolRef);
        
        if (schoolDoc.exists()) {
          const schoolData = schoolDoc.data();
          const currentMemberCount = schoolData.memberCount || 0;
          const currentFavoriteCount = schoolData.favoriteCount || 0;
          
          await updateDoc(schoolRef, {
            memberCount: currentMemberCount + 1,
            favoriteCount: currentFavoriteCount + 1 // 즐겨찾기 카운트도 증가
          });
        }
      } catch (schoolError) {
        console.error('학교 멤버 카운트 및 즐겨찾기 카운트 업데이트 오류:', schoolError);
        // 학교 업데이트 실패해도 회원가입은 성공으로 처리
      }
    }
    
    // 추천 아이디가 있는 경우 추천 보상 처리 (앱과 동일한 로직)
    if (userData.referral && userData.referral.trim() !== '') {
      try {
        // 추천인 찾기
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('profile.userName', '==', userData.referral));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const referrerDoc = querySnapshot.docs[0];
          const referrerData = referrerDoc.data();
          const referrerId = referrerDoc.id;
          
          // 시스템 설정에서 추천인 경험치 값 가져오기
          const { getExperienceSettings } = await import('./admin');
          const expSettings = await getExperienceSettings();
          
          const referrerExp = expSettings.referral?.referrerXP || 30; // 추천인이 받는 경험치
          const refereeExp = expSettings.referral?.refereeXP || 20;   // 추천받은 사람이 받는 경험치
          
          // 추천인 경험치 업데이트
          await updateDoc(referrerDoc.ref, {
            'stats.experience': (referrerData.stats?.experience || 0) + referrerExp,
            'stats.totalExperience': (referrerData.stats?.totalExperience || 0) + referrerExp,
            updatedAt: Date.now()
          });
          
          // 신규 사용자 경험치 업데이트
          await updateDoc(doc(db, 'users', userId), {
            'stats.experience': refereeExp,
            'stats.totalExperience': refereeExp,
            updatedAt: Date.now()
          });

          // 추천인에게 알림 발송
          try {
            const { createReferralNotification } = await import('./notifications');
            await createReferralNotification(
              referrerId,
              userData.userName,
              userId,
              referrerExp // 추천인이 받은 경험치 정보 포함
            );
          } catch (notificationError) {
            console.error('추천인 알림 발송 실패:', notificationError);
            // 알림 발송 실패는 회원가입 자체를 실패시키지 않음
          }
          
          console.log('추천 보상 처리 완료:', userData.referral);
        }
      } catch (referralError) {
        console.error('추천 보상 처리 오류:', referralError);
        // 추천 보상 실패해도 회원가입은 성공으로 처리
      }
    }

    return { user: userDoc };
  } catch (error) {
    console.error('회원가입 오류:', error);
    
    // Firebase 에러 메시지를 사용자 친화적으로 변환
    if (error instanceof FirebaseError) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('이미 가입된 이메일 주소입니다.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('비밀번호는 최소 6자 이상이어야 합니다.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('유효하지 않은 이메일 형식입니다.');
      }
    }
    
    throw new Error('회원가입 중 오류가 발생했습니다.');
  }
};

/**
 * 로그인 함수
 */
export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    
    // Firestore에서 사용자 정보 가져오기 (단일 문서)
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }
    
    // 사용자 정보 반환 (이미 중첩 필드를 포함하고 있음)
    const userData = userDoc.data();
    return {
      ...userData,
      uid: userId
    } as User;
  } catch (error: unknown) {
    console.error('로그인 오류:', error);
    
    // Firebase 에러 메시지를 사용자 친화적으로 변환
    if (error instanceof FirebaseError) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('이메일 또는 비밀번호가 일치하지 않습니다.');
      } else if (error.code === 'auth/invalid-credential') {
        throw new Error('유효하지 않은 로그인 정보입니다.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('잠시 후 다시 시도해주세요.');
      }
    }
    
    throw new Error('로그인 중 오류가 발생했습니다.');
  }
};

/**
 * 로그아웃 함수
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('로그아웃 오류:', error);
    throw new Error('로그아웃 중 오류가 발생했습니다.');
  }
};

/**
 * 비밀번호 재설정 이메일 발송
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: unknown) {
    console.error('비밀번호 재설정 이메일 발송 오류:', error);
    
    if (error instanceof FirebaseError && error.code === 'auth/user-not-found') {
      throw new Error('등록되지 않은 이메일 주소입니다.');
    }
    
    throw new Error('비밀번호 재설정 이메일 발송 중 오류가 발생했습니다.');
  }
};

/**
 * 현재 로그인한 사용자 정보 가져오기
 */
export const getCurrentUser = async (): Promise<User | null> => {
  if (!auth.currentUser) {
    return null;
  }
  
  const userId = auth.currentUser.uid;
  
  try {
    // Firestore에서 사용자 정보 가져오기 (단일 문서)
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    // 사용자 정보 반환 (이미 중첩 필드를 포함하고 있음)
    const userData = userDoc.data();
    return {
      ...userData,
      uid: userId
    } as User;
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    return null;
  }
};

/**
 * 이메일 인증 상태 확인
 */
export const checkEmailVerification = async (): Promise<boolean> => {
  if (!auth.currentUser) {
    return false;
  }
  
  try {
    // 현재 사용자의 정보를 서버에서 새로고침
    await auth.currentUser.reload();
    return auth.currentUser.emailVerified;
  } catch (error) {
    console.error('이메일 인증 상태 확인 오류:', error);
    return false;
  }
};

/**
 * 인증 필요 상태 확인
 * 로그인 상태이지만 이메일 인증이 필요한 경우를 확인
 */
export const requiresEmailVerification = async (): Promise<boolean> => {
  if (!auth.currentUser) {
    return false;
  }
  
  try {
    await auth.currentUser.reload();
    return !auth.currentUser.emailVerified;
  } catch (error) {
    console.error('인증 필요 상태 확인 오류:', error);
    return false;
  }
}; 
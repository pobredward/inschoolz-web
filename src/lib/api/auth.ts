import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  serverTimestamp, 
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { auth, db, storage } from '@/lib/firebase';
import { FormDataType, User } from '@/types';
import { FirebaseError } from 'firebase/app';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { validateReferralAndReward } from './schools';

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
        displayName: userData.userName, // Firebase Auth는 displayName을 사용하지만, 우리 앱은 userName으로 통일
        photoURL: profileImageUrl // 업로드된 프로필 이미지 URL 설정
      });
    }
    
    // 이메일 인증 메일 발송
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
    
    // Firestore에 사용자 데이터 저장 (단일 문서에 중첩 필드로 저장)
    const userDocRef = doc(db, 'users', userId);
    
    // 중첩 필드를 포함한 사용자 데이터
    const userDoc = {
      uid: userId,
      email: userData.email,
      role: 'user' as 'user' | 'student' | 'teacher' | 'admin',
      isVerified: false,
      referrerId: userData.referral || null,
      
      // 프로필 정보
      profile: {
        userName: userData.userName || '',
        realName: userData.realName || '',
        gender: userData.gender || '',
        birthYear: userData.birthYear ? Number(userData.birthYear) : null,
        birthMonth: userData.birthMonth ? Number(userData.birthMonth) : null,
        birthDay: userData.birthDay ? Number(userData.birthDay) : null,
        phoneNumber: userData.phone || '',
        profileImageUrl: profileImageUrl, // 업로드된 프로필 이미지 URL 저장
        createdAt: Date.now(),
        isAdmin: false
      },
      
      // 지역 정보
      regions: userData.city ? {
        sido: userData.province || '',
        sigungu: userData.city || '',
        address: userData.detailAddress || ''
      } : null,
      
      // 학교 정보
      school: userData.school ? {
        id: userData.school,
        name: userData.schoolName || '',
        grade: userData.grade || '',
        classNumber: userData.classNumber || '',
        studentNumber: userData.studentNumber || '',
        isGraduate: userData.isGraduate || false
      } : null,
      
      // 통계 정보
      stats: {
        level: 1,
        experience: 0,
        postCount: 0,
        commentCount: 0,
        likeCount: 0,
        streak: 0
      },
      
      agreedTerms: {
        terms: userData.termsAgreed || false,
        privacy: userData.privacyAgreed || false,
        location: userData.locationAgreed || false,
        marketing: userData.marketingAgreed || false
      },
      
      favorites: {
        schools: userData.favoriteSchools || []
      },
      
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Firestore에 단일 문서로 저장
    await setDoc(userDocRef, userDoc);
    
    // 선택한 학교가 있는 경우, 학교의 멤버 카운트 증가
    if (userData.school) {
      const schoolRef = doc(db, 'schools', userData.school);
      const schoolDoc = await getDoc(schoolRef);
      
      if (schoolDoc.exists()) {
        const schoolData = schoolDoc.data();
        const currentCount = schoolData.memberCount || 0;
        
        await updateDoc(schoolRef, {
          memberCount: currentCount + 1
        });
      }
    }
    
    // 추천 아이디가 있는 경우 추천 보상 처리
    if (userData.referral && userData.referral.trim() !== '') {
      try {
        await validateReferralAndReward(userData.referral, userId);
        console.log('추천 보상 처리 완료:', userData.referral);
      } catch (referralError) {
        console.error('추천 보상 처리 오류:', referralError);
        // 추천 보상 실패해도 회원가입은 성공으로 처리
      }
    }
    
    // 가입 완료된 사용자 정보 반환
    const userResult = {
      ...userDoc,
      uid: userId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    return { user: userResult as unknown as User };
  } catch (error: unknown) {
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
 * 이메일 인증 메일 재발송
 */
export const resendVerificationEmail = async (): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('로그인 상태가 아닙니다.');
    }
    
    await sendEmailVerification(auth.currentUser);
  } catch (error) {
    console.error('이메일 인증 발송 오류:', error);
    throw new Error('인증 이메일 발송 중 오류가 발생했습니다.');
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
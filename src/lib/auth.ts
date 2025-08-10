import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  FacebookAuthProvider,
  signOut,
  deleteUser,
  updateProfile,
  updatePassword,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, Timestamp, serverTimestamp, FieldValue } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '@/types';

/**
 * 이메일/비밀번호로 회원가입
 * @param email 이메일
 * @param password 비밀번호
 * @param userName 사용자 이름
 * @returns 생성된 사용자 정보
 */
export const registerWithEmail = async (
  email: string,
  password: string,
  userName: string
): Promise<User> => {
  try {
    // Firebase 인증으로 계정 생성
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // 프로필 업데이트 (Firebase Auth는 여전히 displayName 사용)
    await updateProfile(firebaseUser, { displayName: userName });
    
    // Firestore에 사용자 정보 저장
    const newUser: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      role: 'student',
      isVerified: true,
      profile: {
        userName: userName,
        realName: '',
        gender: '',
        birthYear: 0,
        birthMonth: 0,
        birthDay: 0,
        phoneNumber: '',
        profileImageUrl: firebaseUser.photoURL || '',
        createdAt: Timestamp.now(),
        isAdmin: false
      },
      stats: {
        level: 1,
        currentExp: 0,
        totalExperience: 0,
        currentLevelRequiredXp: 10,
        postCount: 0,
        commentCount: 0,
        likeCount: 0,
        streak: 0
      },
      agreements: {
        terms: true,
        privacy: true,
        location: false,
        marketing: false
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
    
    return newUser;
  } catch (error) {
    console.error('회원가입 오류:', error);
    
    // Firebase 에러 메시지를 사용자 친화적으로 변환
    if (error instanceof Error && 'code' in error) {
      const firebaseError = error as { code: string };
      if (firebaseError.code === 'auth/email-already-in-use') {
        throw new Error('이미 가입된 이메일 주소입니다.');
      } else if (firebaseError.code === 'auth/weak-password') {
        throw new Error('비밀번호는 최소 6자 이상이어야 합니다.');
      } else if (firebaseError.code === 'auth/invalid-email') {
        throw new Error('유효하지 않은 이메일 형식입니다.');
      }
    }
    
    throw new Error('회원가입 중 오류가 발생했습니다.');
  }
};

/**
 * 이메일/비밀번호로 로그인
 * @param email 이메일
 * @param password 비밀번호
 * @returns 사용자 정보
 */
export const loginWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    // Firebase 인증으로 로그인
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Firestore에서 사용자 정보 가져오기
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (userDoc.exists()) {
      // 마지막 로그인 시간 업데이트
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return userDoc.data() as User;
    } else {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('로그인 오류:', error);
    throw new Error('로그인 중 오류가 발생했습니다.');
  }
};

/**
 * Google로 로그인
 * @returns 사용자 정보
 */
export const loginWithGoogle = async (): Promise<User> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const firebaseUser = userCredential.user;
    
    // Firestore에서 사용자 정보 확인
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (userDoc.exists()) {
      // 기존 사용자: 마지막 로그인 시간 업데이트
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return userDoc.data() as User;
    } else {
      // 신규 사용자: Firestore에 정보 저장
      const newUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        profile: {
          userName: firebaseUser.displayName || '사용자',
          realName: '',
          gender: '',
          birthYear: 0,
          birthMonth: 0,
          birthDay: 0,
          phoneNumber: '',
          profileImageUrl: firebaseUser.photoURL || '',
          createdAt: serverTimestamp(),
          isAdmin: false
        },
        role: 'student',
        isVerified: false,
        stats: {
          level: 1,
          currentExp: 0,
          totalExperience: 0,
          currentLevelRequiredXp: 10,
          postCount: 0,
          commentCount: 0,
          likeCount: 0,
          streak: 0
        },
        agreements: {
          terms: false,
          privacy: false,
          location: false,
          marketing: false
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      
      return newUser;
    }
  } catch (error) {
    console.error('Google 로그인 오류:', error);
    throw new Error('Google 로그인 중 오류가 발생했습니다.');
  }
};

/**
 * Facebook으로 로그인
 * @returns 사용자 정보
 */
export const loginWithFacebook = async (): Promise<User> => {
  try {
    const provider = new FacebookAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const firebaseUser = userCredential.user;
    
    // Firestore에서 사용자 정보 확인
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (userDoc.exists()) {
      // 기존 사용자: 마지막 로그인 시간 업데이트
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return userDoc.data() as User;
    } else {
      // 신규 사용자: Firestore에 정보 저장
      const newUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        profile: {
          userName: firebaseUser.displayName || '사용자',
          realName: '',
          gender: '',
          birthYear: 0,
          birthMonth: 0,
          birthDay: 0,
          phoneNumber: '',
          profileImageUrl: firebaseUser.photoURL || '',
          createdAt: serverTimestamp(),
          isAdmin: false
        },
        role: 'student',
        isVerified: false,
        stats: {
          level: 1,
          currentExp: 0,
          totalExperience: 0,
          currentLevelRequiredXp: 10,
          postCount: 0,
          commentCount: 0,
          likeCount: 0,
          streak: 0
        },
        agreements: {
          terms: false,
          privacy: false,
          location: false,
          marketing: false
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      
      return newUser;
    }
  } catch (error) {
    console.error('Facebook 로그인 오류:', error);
    throw new Error('Facebook 로그인 중 오류가 발생했습니다.');
  }
};

/**
 * 비밀번호 변경 전 재인증
 * @param user 현재 로그인된 사용자
 * @param password 현재 비밀번호
 */
export const reauthenticate = async (
  user: FirebaseUser,
  password: string
): Promise<void> => {
  try {
    const credential = EmailAuthProvider.credential(user.email || '', password);
    await reauthenticateWithCredential(user, credential);
  } catch (error) {
    console.error('재인증 오류:', error);
    throw new Error('재인증 중 오류가 발생했습니다.');
  }
};

/**
 * 사용자 비밀번호 변경
 * @param user 현재 로그인된 사용자
 * @param currentPassword 현재 비밀번호
 * @param newPassword 새 비밀번호
 */
export const changePassword = async (
  user: FirebaseUser,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  try {
    // 먼저 재인증
    await reauthenticate(user, currentPassword);
    
    // 비밀번호 변경
    await updatePassword(user, newPassword);
  } catch (error) {
    console.error('비밀번호 변경 오류:', error);
    throw new Error('비밀번호 변경 중 오류가 발생했습니다.');
  }
};

/**
 * 사용자 이메일 변경
 * @param user 현재 로그인된 사용자
 * @param password 현재 비밀번호
 * @param newEmail 새 이메일
 */
export const changeEmail = async (
  user: FirebaseUser,
  password: string,
  newEmail: string
): Promise<void> => {
  try {
    // 먼저 재인증
    await reauthenticate(user, password);
    
    // 이메일 변경
    await updateEmail(user, newEmail);
    
    // Firestore 사용자 정보 업데이트
    await updateDoc(doc(db, 'users', user.uid), {
      email: newEmail,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('이메일 변경 오류:', error);
    throw new Error('이메일 변경 중 오류가 발생했습니다.');
  }
};

/**
 * 비밀번호 재설정 이메일 발송
 * @param email 이메일 주소
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('비밀번호 재설정 이메일 발송 오류:', error);
    throw new Error('비밀번호 재설정 이메일 발송 중 오류가 발생했습니다.');
  }
};

/**
 * 로그아웃
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
 * 계정 완전 삭제 (앱스토어 가이드라인 5.1.1(v) 준수)
 * @param user 현재 로그인된 Firebase 사용자
 * @param password 비밀번호 (이메일/비밀번호 로그인 사용자만)
 */
export const deleteAccount = async (
  user: FirebaseUser,
  password?: string
): Promise<void> => {
  try {
    // 이메일/비밀번호 로그인 사용자는 재인증 필요
    if (password) {
      await reauthenticate(user, password);
    }
    
    // Firestore에서 사용자 문서 완전 삭제
    await deleteDoc(doc(db, 'users', user.uid));
    
    // Firebase 인증 계정 삭제
    await deleteUser(user);
    
    // 관련 데이터 정리는 Cloud Functions에서 처리하는 것이 좋지만
    // 여기서는 기본적인 완전 삭제만 수행
  } catch (error) {
    console.error('계정 삭제 오류:', error);
    throw new Error('계정 삭제 중 오류가 발생했습니다.');
  }
};

/**
 * 현재 로그인된 사용자 가져오기 (Promise 버전)
 * @returns 현재 로그인된 사용자 정보 (없으면 null)
 */
export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribe();
      
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            resolve(userDoc.data() as User);
          } else {
            resolve(null);
          }
        } catch (error) {
          console.error('사용자 정보 가져오기 오류:', error);
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  });
};
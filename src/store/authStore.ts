import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, db } from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signUp: (email: string, password: string, userName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetError: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
      
      signUp: async (email, password, userName) => {
        try {
          set({ isLoading: true, error: null });
          
          // Firebase 인증으로 사용자 생성
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          
          // 사용자 프로필 업데이트
          await updateProfile(firebaseUser, { displayName: userName });
          
          // Firestore에 사용자 정보 저장
          const newUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            profile: {
              userName: userName,
              email: firebaseUser.email || '',
              realName: '',
              birthYear: 0,
              birthMonth: 0,
              birthDay: 0,
              phoneNumber: '',
              profileImageUrl: firebaseUser.photoURL || '',
              createdAt: Date.now(),
              isAdmin: false
            },
            role: 'student',
            isVerified: false,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          set({ user: newUser, isLoading: false });
        } catch (error) {
          console.error('회원가입 오류:', error);
          set({ 
            error: error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다.', 
            isLoading: false 
          });
        }
      },
      
      signIn: async (email, password) => {
        try {
          set({ isLoading: true, error: null });
          
          // Firebase 인증으로 로그인
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          
          // Firestore에서 사용자 정보 가져오기
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            set({ user: userDoc.data() as User, isLoading: false });
          } else {
            throw new Error('사용자 정보를 찾을 수 없습니다.');
          }
        } catch (error) {
          console.error('로그인 오류:', error);
          set({ 
            error: error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.', 
            isLoading: false 
          });
        }
      },
      
      signOut: async () => {
        try {
          set({ isLoading: true, error: null });
          await firebaseSignOut(auth);
          set({ user: null, isLoading: false });
        } catch (error) {
          console.error('로그아웃 오류:', error);
          set({ 
            error: error instanceof Error ? error.message : '로그아웃 중 오류가 발생했습니다.', 
            isLoading: false 
          });
        }
      },
      
      resetError: () => set({ error: null }),
      
      setUser: (user) => set({ user })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// 사용자 인증 상태 변경을 감지하는 리스너
// 클라이언트 측에서만 실행되도록 하는 로직
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        useAuthStore.getState().setUser(userDoc.data() as User);
      }
    } else {
      useAuthStore.getState().setUser(null);
    }
  });
} 
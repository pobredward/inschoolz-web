import { doc, getDoc, updateDoc, setDoc, collection, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Board } from '@/types/board';

// 경험치 설정 타입 정의
export interface ExperienceSettings {
  community: {
    postXP: number;
    commentXP: number;
    likeXP: number;
    dailyPostLimit: number;
    dailyCommentLimit: number;
    dailyLikeLimit: number;
  };
  games: {
    reactionGame: {
      enabled: boolean;
      dailyLimit: number;
      thresholds: Array<{
        minScore: number;
        xpReward: number;
      }>;
    };
    tileGame: {
      enabled: boolean;
      dailyLimit: number;
      thresholds: Array<{
        minScore: number;
        xpReward: number;
      }>;
    };
  };

  attendance: {
    dailyXP: number;
    streakBonus: number;
    weeklyBonusXP: number;
  };
}

/**
 * 관리자용 경험치 설정 조회
 */
export const getExperienceSettings = async (): Promise<ExperienceSettings> => {
  try {
    const settingsDoc = await getDoc(doc(db, 'system', 'experienceSettings'));
    
    if (settingsDoc.exists()) {
      return settingsDoc.data() as ExperienceSettings;
    } else {
      // 기본 설정 반환
      const defaultSettings: ExperienceSettings = {
        community: {
          postXP: 10,
          commentXP: 5,
          likeXP: 1,
          dailyPostLimit: 3,
          dailyCommentLimit: 5,
          dailyLikeLimit: 50,
        },
        games: {
          reactionGame: {
            enabled: true,
            dailyLimit: 5,
            thresholds: [
              { minScore: 100, xpReward: 5 },
              { minScore: 200, xpReward: 10 },
              { minScore: 300, xpReward: 15 },
            ],
          },
          tileGame: {
            enabled: true,
            dailyLimit: 5,
            thresholds: [
              { minScore: 50, xpReward: 5 },
              { minScore: 100, xpReward: 10 },
              { minScore: 150, xpReward: 15 },
            ],
          },
        },

        attendance: {
          dailyXP: 10,
          streakBonus: 5,
          weeklyBonusXP: 50,
        },
      };
      
      // 기본 설정을 Firestore에 저장 (문서가 없으면 생성)
      await setDoc(doc(db, 'system', 'experienceSettings'), defaultSettings);
      return defaultSettings;
    }
  } catch (error) {
    console.error('경험치 설정 조회 오류:', error);
    throw new Error('경험치 설정을 가져오는 중 오류가 발생했습니다.');
  }
};

/**
 * 관리자용 경험치 설정 업데이트
 */
export const updateExperienceSettings = async (settings: ExperienceSettings): Promise<void> => {
  try {
    // setDoc을 사용하여 문서가 없으면 생성, 있으면 업데이트
    await setDoc(doc(db, 'system', 'experienceSettings'), {
      ...settings,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('경험치 설정 업데이트 오류:', error);
    throw new Error('경험치 설정 업데이트 중 오류가 발생했습니다.');
  }
};

/**
 * 모든 게시판 조회 (관리자용)
 */
export const getAllBoards = async (): Promise<Board[]> => {
  try {
    console.log('getAllBoards 함수 호출됨'); // 디버깅용
    const querySnapshot = await getDocs(collection(db, 'boards'));
    const boards: Board[] = [];
    
    console.log('Firestore에서 가져온 문서 수:', querySnapshot.size); // 디버깅용
    
    querySnapshot.forEach((doc) => {
      const boardData = doc.data();
      console.log('원본 boardData:', boardData); // 디버깅용
      
      const board: Board = {
        id: doc.id,
        name: boardData.name || '',
        code: boardData.code || boardData.boardCode || '', // code 또는 boardCode 필드 모두 지원
        description: boardData.description || '',
        type: boardData.type || boardData.boardType || 'common', // type 또는 boardType 필드 모두 지원
        order: boardData.order || 0,
        isActive: boardData.isActive !== undefined ? boardData.isActive : true,
        isPublic: boardData.isPublic !== undefined ? boardData.isPublic : true,
        createdAt: boardData.createdAt || Date.now(),
        updatedAt: boardData.updatedAt || Date.now(),
        stats: {
          postCount: boardData.stats?.postCount || 0,
          viewCount: boardData.stats?.viewCount || 0,
          activeUserCount: boardData.stats?.activeUserCount || 0
        },
        allowAnonymous: boardData.allowAnonymous !== undefined ? boardData.allowAnonymous : true,
        allowPolls: boardData.allowPolls !== undefined ? boardData.allowPolls : true,
        icon: boardData.icon || 'forum'
      };
      
      console.log('변환된 board:', board); // 디버깅용
      boards.push(board);
    });
    
    console.log('최종 boards 배열:', boards); // 디버깅용
    
    // 클라이언트에서 정렬: type -> order 순
    return boards.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type.localeCompare(b.type);
      }
      return (a.order || 0) - (b.order || 0);
    });
  } catch (error) {
    console.error('전체 게시판 조회 오류:', error);
    throw new Error('게시판 목록을 가져오는 중 오류가 발생했습니다.');
  }
};

/**
 * 게시판 생성 (관리자용)
 */
export const createBoard = async (boardData: Omit<Board, 'id' | 'createdAt' | 'updatedAt'>): Promise<Board> => {
  try {
    console.log('createBoard 함수 호출됨, boardData:', boardData); // 디버깅용
    
    // Firebase에 저장할 때 필드명 매핑
    const firebaseData = {
      name: boardData.name,
      code: boardData.code, // Firebase에서 code 필드 사용
      description: boardData.description,
      type: boardData.type, // Firebase에서 type 필드 사용
      order: boardData.order,
      isActive: boardData.isActive,
      isPublic: boardData.isPublic,
      allowAnonymous: boardData.allowAnonymous,
      allowPolls: boardData.allowPolls,
      icon: boardData.icon,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      stats: boardData.stats || { postCount: 0, viewCount: 0, activeUserCount: 0 }
    };
    
    console.log('Firebase에 저장할 데이터:', firebaseData); // 디버깅용
    
    const docRef = await addDoc(collection(db, 'boards'), firebaseData);
    
    console.log('생성된 문서 ID:', docRef.id); // 디버깅용
    
    return {
      id: docRef.id,
      ...boardData,
      createdAt: firebaseData.createdAt,
      updatedAt: firebaseData.updatedAt
    } as Board;
  } catch (error) {
    console.error('게시판 생성 오류:', error);
    throw new Error('게시판 생성 중 오류가 발생했습니다.');
  }
};

/**
 * 게시판 수정 (관리자용)
 */
export const updateBoard = async (boardId: string, boardData: Partial<Board>): Promise<void> => {
  try {
    const boardRef = doc(db, 'boards', boardId);
    await updateDoc(boardRef, {
      ...boardData,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('게시판 수정 오류:', error);
    throw new Error('게시판 수정 중 오류가 발생했습니다.');
  }
};

/**
 * 게시판 삭제 (관리자용)
 */
export const deleteBoard = async (boardId: string): Promise<void> => {
  try {
    const boardRef = doc(db, 'boards', boardId);
    await deleteDoc(boardRef);
  } catch (error) {
    console.error('게시판 삭제 오류:', error);
    throw new Error('게시판 삭제 중 오류가 발생했습니다.');
  }
};

/**
 * 게시판 활성화/비활성화 (관리자용)
 */
export const toggleBoardStatus = async (boardId: string, isActive: boolean): Promise<void> => {
  try {
    const boardRef = doc(db, 'boards', boardId);
    await updateDoc(boardRef, {
      isActive,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('게시판 상태 변경 오류:', error);
    throw new Error('게시판 상태 변경 중 오류가 발생했습니다.');
  }
};

/**
 * 관리자용 통계 데이터 조회
 */
export const getAdminStats = async (): Promise<{
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalComments: number;
  pendingReports: number;
  totalExperience: number;
}> => {
  try {
    // TODO: 실제 통계 계산 로직 구현
    // 현재는 임시 데이터 반환
    return {
      totalUsers: 1250,
      activeUsers: 892,
      totalPosts: 3456,
      totalComments: 8921,
      pendingReports: 12,
      totalExperience: 456789,
    };
  } catch (error) {
    console.error('관리자 통계 조회 오류:', error);
    throw new Error('통계 데이터를 가져오는 중 오류가 발생했습니다.');
  }
}; 
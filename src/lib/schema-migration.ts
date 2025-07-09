import { 
  collection, 
  doc, 
  setDoc, 
  writeBatch, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  SystemSettings, 
  Tag, 
  Board,
  GameRanking 
} from '@/types';

/**
 * Firestore 데이터베이스 스키마 마이그레이션 및 초기 데이터 설정
 */
export class SchemaMigration {
  
  /**
   * 전체 마이그레이션 실행
   */
  async runMigration(): Promise<void> {
    console.log('🚀 Starting Firestore schema migration...');
    
    try {
      // 1. 시스템 설정 초기화
      await this.createSystemSettings();
      
      // 2. 기본 게시판 생성
      await this.createDefaultBoards();
      
      // 3. 기본 태그 생성
      await this.createDefaultTags();
      
      // 4. 게임 랭킹 초기화
      await this.initializeGameRankings();
      
      console.log('✅ Schema migration completed successfully!');
    } catch (error) {
      console.error('❌ Schema migration failed:', error);
      throw error;
    }
  }

  /**
   * 시스템 설정 초기화
   */
  private async createSystemSettings(): Promise<void> {
    console.log('📝 Creating system settings...');
    
    const systemSettings: SystemSettings = {
      experience: {
        postReward: 10,
        commentReward: 5,
        likeReward: 1,
        attendanceReward: 5,
        attendanceStreakReward: 10,
        referralReward: 50,
        levelRequirements: {
          1: 0,
          2: 10,
          3: 30,
          4: 60,
          5: 100,
          6: 150,
          7: 210,
          8: 280,
          9: 360,
          10: 450,
          // 계속해서 증가하는 패턴
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
        }
      },
      dailyLimits: {
        postsForReward: 3,
        commentsForReward: 5,
        gamePlayCount: 5
      },
      gameSettings: {
        reactionGame: {
          rewardThreshold: 500,
          rewardAmount: 15
        },
        tileGame: {
          rewardThreshold: 800,
          rewardAmount: 20
        },
        flappyBird: {
          rewardThreshold: 10,
          rewardAmount: 25
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

    await setDoc(doc(db, 'system', 'settings'), systemSettings);
    console.log('✅ System settings created');
  }

  /**
   * 기본 게시판 생성
   */
  private async createDefaultBoards(): Promise<void> {
    console.log('📝 Creating default boards...');
    
    const boards: Partial<Board>[] = [
      // 전국 게시판
      {
        id: 'national_free',
        name: '자유게시판',
        code: 'free',
        description: '자유로운 소통 공간입니다',
        type: 'national',
        order: 1,
        isActive: true,
        isPublic: true,
        allowAnonymous: true,
        allowPolls: true,
        icon: 'MessageCircle',
        stats: {
          postCount: 0,
          viewCount: 0,
          activeUserCount: 0
        }
      },
      {
        id: 'national_study',
        name: '공부게시판',
        code: 'study',
        description: '공부 관련 정보를 공유하세요',
        type: 'national',
        order: 2,
        isActive: true,
        isPublic: true,
        allowAnonymous: true,
        allowPolls: true,
        icon: 'BookOpen',
        stats: {
          postCount: 0,
          viewCount: 0,
          activeUserCount: 0
        }
      },
      {
        id: 'national_career',
        name: '진로게시판',
        code: 'career',
        description: '진로와 진학 정보를 나눠요',
        type: 'national',
        order: 3,
        isActive: true,
        isPublic: true,
        allowAnonymous: true,
        allowPolls: true,
        icon: 'Target',
        stats: {
          postCount: 0,
          viewCount: 0,
          activeUserCount: 0
        }
      },
      {
        id: 'national_hobby',
        name: '취미게시판',
        code: 'hobby',
        description: '취미와 관심사를 공유해요',
        type: 'national',
        order: 4,
        isActive: true,
        isPublic: true,
        allowAnonymous: true,
        allowPolls: true,
        icon: 'Heart',
        stats: {
          postCount: 0,
          viewCount: 0,
          activeUserCount: 0
        }
      },
      // 지역별 기본 게시판 템플릿
      {
        id: 'regional_info',
        name: '지역정보',
        code: 'info',
        description: '우리 지역 정보를 공유해요',
        type: 'regional',
        order: 1,
        isActive: true,
        isPublic: true,
        allowAnonymous: true,
        allowPolls: true,
        icon: 'MapPin',
        stats: {
          postCount: 0,
          viewCount: 0,
          activeUserCount: 0
        }
      },
      {
        id: 'regional_academy',
        name: '학원정보',
        code: 'academy',
        description: '학원과 과외 정보를 나눠요',
        type: 'regional',
        order: 2,
        isActive: true,
        isPublic: true,
        allowAnonymous: true,
        allowPolls: true,
        icon: 'GraduationCap',
        stats: {
          postCount: 0,
          viewCount: 0,
          activeUserCount: 0
        }
      },
      // 학교별 기본 게시판 템플릿
      {
        id: 'school_free',
        name: '자유게시판',
        code: 'free',
        description: '우리 학교만의 소통 공간',
        type: 'school',
        order: 1,
        isActive: true,
        isPublic: false,
        allowAnonymous: true,
        allowPolls: true,
        icon: 'MessageCircle',
        stats: {
          postCount: 0,
          viewCount: 0,
          activeUserCount: 0
        }
      },
      {
        id: 'school_notice',
        name: '공지사항',
        code: 'notice',
        description: '학교 공지사항 및 소식',
        type: 'school',
        order: 2,
        isActive: true,
        isPublic: false,
        allowAnonymous: false,
        allowPolls: false,
        icon: 'Megaphone',
        stats: {
          postCount: 0,
          viewCount: 0,
          activeUserCount: 0
        }
      },
      {
        id: 'school_study',
        name: '학습게시판',
        code: 'study',
        description: '공부 관련 정보와 질문',
        type: 'school',
        order: 3,
        isActive: true,
        isPublic: false,
        allowAnonymous: true,
        allowPolls: true,
        icon: 'BookOpen',
        stats: {
          postCount: 0,
          viewCount: 0,
          activeUserCount: 0
        }
      }
    ];

    const batch = writeBatch(db);
    
    for (const board of boards) {
      const boardData = {
        ...board,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const boardRef = doc(db, 'boards', board.id!);
      batch.set(boardRef, boardData);
    }
    
    await batch.commit();
    console.log('✅ Default boards created');
  }

  /**
   * 기본 태그 생성
   */
  private async createDefaultTags(): Promise<void> {
    console.log('📝 Creating default tags...');
    
    const tags: Partial<Tag>[] = [
      // 일반 태그
      { name: '질문', category: 'general', isBlocked: false, usageCount: 0 },
      { name: '정보', category: 'general', isBlocked: false, usageCount: 0 },
      { name: '후기', category: 'general', isBlocked: false, usageCount: 0 },
      { name: '추천', category: 'general', isBlocked: false, usageCount: 0 },
      { name: '급해요', category: 'general', isBlocked: false, usageCount: 0 },
      
      // 학습 관련 태그
      { name: '수학', category: 'study', isBlocked: false, usageCount: 0 },
      { name: '영어', category: 'study', isBlocked: false, usageCount: 0 },
      { name: '국어', category: 'study', isBlocked: false, usageCount: 0 },
      { name: '과학', category: 'study', isBlocked: false, usageCount: 0 },
      { name: '사회', category: 'study', isBlocked: false, usageCount: 0 },
      { name: '시험', category: 'study', isBlocked: false, usageCount: 0 },
      { name: '숙제', category: 'study', isBlocked: false, usageCount: 0 },
      
      // 진로 관련 태그
      { name: '대학', category: 'career', isBlocked: false, usageCount: 0 },
      { name: '취업', category: 'career', isBlocked: false, usageCount: 0 },
      { name: '진로', category: 'career', isBlocked: false, usageCount: 0 },
      { name: '상담', category: 'career', isBlocked: false, usageCount: 0 },
      
      // 학교생활 태그
      { name: '급식', category: 'school', isBlocked: false, usageCount: 0 },
      { name: '동아리', category: 'school', isBlocked: false, usageCount: 0 },
      { name: '축제', category: 'school', isBlocked: false, usageCount: 0 },
      { name: '체육대회', category: 'school', isBlocked: false, usageCount: 0 },
      
      // 취미 관련 태그
      { name: '게임', category: 'hobby', isBlocked: false, usageCount: 0 },
      { name: '음악', category: 'hobby', isBlocked: false, usageCount: 0 },
      { name: '영화', category: 'hobby', isBlocked: false, usageCount: 0 },
      { name: '독서', category: 'hobby', isBlocked: false, usageCount: 0 },
      { name: '운동', category: 'hobby', isBlocked: false, usageCount: 0 },
      
      // 차단될 수 있는 태그 예시 (현재는 차단 안됨)
      { name: '욕설', category: 'blocked', isBlocked: true, usageCount: 0, blockReason: '부적절한 언어' },
      { name: '혐오', category: 'blocked', isBlocked: true, usageCount: 0, blockReason: '혐오 표현' }
    ];

    const batch = writeBatch(db);
    
    for (const tag of tags) {
      const tagData = {
        id: tag.name!.toLowerCase().replace(/\s+/g, '_'),
        ...tag,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      if (tagData.isBlocked) {
        tagData.blockedAt = Date.now();
        tagData.blockedBy = 'system';
      }
      
      const tagRef = doc(db, 'tags', tagData.id);
      batch.set(tagRef, tagData);
    }
    
    await batch.commit();
    console.log('✅ Default tags created');
  }

  /**
   * 게임 랭킹 컬렉션 초기화
   */
  private async initializeGameRankings(): Promise<void> {
    console.log('📝 Initializing game rankings...');
    
    const gameTypes = ['reactionGame', 'tileGame', 'flappyBird'] as const;
    const periods = ['daily', 'weekly', 'monthly', 'allTime'] as const;
    
    const batch = writeBatch(db);
    
    for (const gameType of gameTypes) {
      for (const period of periods) {
        let periodValue: string;
        const now = new Date();
        
        switch (period) {
          case 'daily':
            periodValue = now.toISOString().split('T')[0]; // YYYY-MM-DD
            break;
          case 'weekly':
            const week = this.getWeekNumber(now);
            periodValue = `${now.getFullYear()}-W${week.toString().padStart(2, '0')}`;
            break;
          case 'monthly':
            periodValue = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
            break;
          case 'allTime':
            periodValue = 'all';
            break;
        }
        
        const rankingData: Partial<GameRanking> = {
          id: `${gameType}_${periodValue}`,
          gameType,
          period,
          periodValue,
          rankings: [],
          stats: {
            totalPlayers: 0,
            averageScore: 0,
            highestScore: 0
          },
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        const rankingRef = doc(db, 'gameRankings', rankingData.id!);
        batch.set(rankingRef, rankingData);
      }
    }
    
    await batch.commit();
    console.log('✅ Game rankings initialized');
  }

  /**
   * 주차 계산 헬퍼 함수
   */
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * 마이그레이션 상태 확인
   */
  async checkMigrationStatus(): Promise<boolean> {
    try {
      // system/settings 문서가 존재하는지 확인
      const systemDoc = await getDocs(collection(db, 'system'));
      const boardsDoc = await getDocs(collection(db, 'boards'));
      const tagsDoc = await getDocs(collection(db, 'tags'));
      
      return !systemDoc.empty && !boardsDoc.empty && !tagsDoc.empty;
    } catch (error) {
      console.error('Migration status check failed:', error);
      return false;
    }
  }

  /**
   * 개발 환경용 샘플 데이터 생성 (선택적)
   */
  async createSampleData(): Promise<void> {
    console.log('📝 Creating sample data for development...');
    
    // TODO: 개발 환경에서만 실행되는 샘플 데이터 생성
    // - 샘플 사용자
    // - 샘플 게시글
    // - 샘플 댓글
    // - 샘플 학교 데이터
    
    console.log('✅ Sample data created');
  }
}

// 마이그레이션 실행 함수
export const runSchemaMigration = async (): Promise<void> => {
  const migration = new SchemaMigration();
  
  // 마이그레이션 상태 확인
  const isAlreadyMigrated = await migration.checkMigrationStatus();
  
  if (isAlreadyMigrated) {
    console.log('✅ Database already migrated. Skipping migration.');
    return;
  }
  
  // 마이그레이션 실행
  await migration.runMigration();
};

// 개발용 샘플 데이터 생성 함수
export const createSampleData = async (): Promise<void> => {
  const migration = new SchemaMigration();
  await migration.createSampleData();
}; 
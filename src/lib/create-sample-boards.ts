import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

export const createSampleBoards = async () => {
  try {
    const boards = [
      // 전국 게시판
      {
        code: 'free',
        name: '자유게시판',
        description: '자유롭게 소통해보세요',
        icon: '💬',
        type: 'national',
        isActive: true,
        order: 1,
        categories: [
          { id: 'general', name: '일반', isActive: true, order: 1 },
          { id: 'question', name: '질문', isActive: true, order: 2 },
          { id: 'discussion', name: '토론', isActive: true, order: 3 }
        ],
        accessLevel: {
          read: 'all',
          write: 'member',
          comment: 'member'
        },
        settings: {
          allowAnonymous: true,
          allowAttachments: true,
          allowPolls: true,
          maxAttachmentSize: 10 * 1024 * 1024, // 10MB
          moderationEnabled: false
        },
        stats: {
          postCount: 0,
          memberCount: 0,
          todayPostCount: 0
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        code: 'study',
        name: '공부',
        description: '학습 관련 정보를 공유해요',
        icon: '📚',
        type: 'national',
        isActive: true,
        order: 2,
        categories: [
          { id: 'tips', name: '공부법', isActive: true, order: 1 },
          { id: 'materials', name: '자료공유', isActive: true, order: 2 },
          { id: 'exam', name: '시험정보', isActive: true, order: 3 }
        ],
        accessLevel: {
          read: 'all',
          write: 'member',
          comment: 'member'
        },
        settings: {
          allowAnonymous: true,
          allowAttachments: true,
          allowPolls: true,
          maxAttachmentSize: 10 * 1024 * 1024,
          moderationEnabled: false
        },
        stats: {
          postCount: 0,
          memberCount: 0,
          todayPostCount: 0
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        code: 'career',
        name: '진로',
        description: '진로와 취업 정보를 나눠요',
        icon: '🎯',
        type: 'national',
        isActive: true,
        order: 3,
        categories: [
          { id: 'university', name: '대학정보', isActive: true, order: 1 },
          { id: 'job', name: '취업정보', isActive: true, order: 2 },
          { id: 'advice', name: '진로상담', isActive: true, order: 3 }
        ],
        accessLevel: {
          read: 'all',
          write: 'member',
          comment: 'member'
        },
        settings: {
          allowAnonymous: true,
          allowAttachments: true,
          allowPolls: true,
          maxAttachmentSize: 10 * 1024 * 1024,
          moderationEnabled: false
        },
        stats: {
          postCount: 0,
          memberCount: 0,
          todayPostCount: 0
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      // 지역 게시판 (서울특별시 강남구 예시)
      {
        code: 'academy',
        name: '학원정보',
        description: '학원 정보를 공유해요',
        icon: '🏫',
        type: 'regional',
        isActive: true,
        order: 1,
        regions: {
          sido: '서울특별시',
          sigungu: '강남구'
        },
        categories: [
          { id: 'math', name: '수학학원', isActive: true, order: 1 },
          { id: 'english', name: '영어학원', isActive: true, order: 2 },
          { id: 'science', name: '과학학원', isActive: true, order: 3 }
        ],
        accessLevel: {
          read: 'all',
          write: 'member',
          comment: 'member'
        },
        settings: {
          allowAnonymous: true,
          allowAttachments: true,
          allowPolls: true,
          maxAttachmentSize: 10 * 1024 * 1024,
          moderationEnabled: false
        },
        stats: {
          postCount: 0,
          memberCount: 0,
          todayPostCount: 0
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        code: 'local',
        name: '지역소식',
        description: '지역 소식을 전해요',
        icon: '📍',
        type: 'regional',
        isActive: true,
        order: 2,
        regions: {
          sido: '서울특별시',
          sigungu: '강남구'
        },
        categories: [
          { id: 'news', name: '지역뉴스', isActive: true, order: 1 },
          { id: 'events', name: '행사정보', isActive: true, order: 2 },
          { id: 'facilities', name: '편의시설', isActive: true, order: 3 }
        ],
        accessLevel: {
          read: 'all',
          write: 'member',
          comment: 'member'
        },
        settings: {
          allowAnonymous: true,
          allowAttachments: true,
          allowPolls: true,
          maxAttachmentSize: 10 * 1024 * 1024,
          moderationEnabled: false
        },
        stats: {
          postCount: 0,
          memberCount: 0,
          todayPostCount: 0
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      // 학교 게시판 (예시 학교 ID: school001)
      {
        code: 'notice',
        name: '공지사항',
        description: '학교 공지사항을 확인하세요',
        icon: '📢',
        type: 'school',
        isActive: true,
        order: 1,
        schoolId: 'school001',
        categories: [
          { id: 'important', name: '중요공지', isActive: true, order: 1 },
          { id: 'general', name: '일반공지', isActive: true, order: 2 },
          { id: 'event', name: '행사공지', isActive: true, order: 3 }
        ],
        accessLevel: {
          read: 'all',
          write: 'admin',
          comment: 'member'
        },
        settings: {
          allowAnonymous: false,
          allowAttachments: true,
          allowPolls: false,
          maxAttachmentSize: 10 * 1024 * 1024,
          moderationEnabled: true
        },
        stats: {
          postCount: 0,
          memberCount: 0,
          todayPostCount: 0
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        code: 'club',
        name: '동아리',
        description: '동아리 활동 정보를 공유해요',
        icon: '🎭',
        type: 'school',
        isActive: true,
        order: 2,
        schoolId: 'school001',
        categories: [
          { id: 'sports', name: '운동부', isActive: true, order: 1 },
          { id: 'culture', name: '문화부', isActive: true, order: 2 },
          { id: 'academic', name: '학술부', isActive: true, order: 3 }
        ],
        accessLevel: {
          read: 'all',
          write: 'member',
          comment: 'member'
        },
        settings: {
          allowAnonymous: true,
          allowAttachments: true,
          allowPolls: true,
          maxAttachmentSize: 10 * 1024 * 1024,
          moderationEnabled: false
        },
        stats: {
          postCount: 0,
          memberCount: 0,
          todayPostCount: 0
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];

    console.log('샘플 게시판 데이터 생성 시작...');
    
    for (const board of boards) {
      await addDoc(collection(db, 'boards'), board);
      console.log(`게시판 생성 완료: ${board.name} (${board.code})`);
    }
    
    console.log('모든 샘플 게시판 데이터 생성 완료!');
  } catch (error) {
    console.error('샘플 게시판 데이터 생성 실패:', error);
    throw error;
  }
};

// 개발 환경에서만 실행
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // 브라우저 콘솔에서 createSampleBoards() 호출 가능
  (window as typeof window & { createSampleBoards: typeof createSampleBoards }).createSampleBoards = createSampleBoards;
} 
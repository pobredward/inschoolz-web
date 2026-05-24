/**
 * 서버 전용 커뮤니티 데이터 헬퍼 (Admin SDK, RSC에서 사용)
 */
import { firestore } from '@/lib/firebase-admin';
import { unstable_cache } from 'next/cache';

interface SerializedBoard {
  id: string;
  name: string;
  code: string;
  type: string;
  order: number;
  isActive: boolean;
}

interface SerializedPost {
  id: string;
  title: string;
  content: string;
  boardCode: string;
  boardName: string;
  authorId: string;
  authorInfo: {
    displayName: string;
    isAnonymous: boolean;
    profileImageUrl?: string;
  };
  createdAt: string;
  stats: {
    viewCount: number;
    likeCount: number;
    commentCount: number;
    scrapCount: number;
  };
  status: {
    isPinned: boolean;
    isDeleted: boolean;
    isHidden: boolean;
  };
  [key: string]: unknown;
}

interface InitialCommunityData {
  posts: SerializedPost[];
  boards: SerializedBoard[];
  totalCount: number;
  totalPages: number;
}

function toSerializableTimestamp(ts: FirebaseFirestore.Timestamp | null | undefined): string {
  if (!ts) return new Date().toISOString();
  try {
    return ts.toDate().toISOString();
  } catch {
    return new Date().toISOString();
  }
}

const fetchInitialNationalData = unstable_cache(
  async (): Promise<InitialCommunityData> => {
    const db = firestore;

    const [boardsSnap, countSnap, postsSnap] = await Promise.all([
      db.collection('boards')
        .where('type', '==', 'national')
        .where('isActive', '==', true)
        .orderBy('order', 'asc')
        .get(),
      db.collection('posts')
        .where('type', '==', 'national')
        .where('status.isDeleted', '==', false)
        .where('status.isHidden', '==', false)
        .count()
        .get(),
      db.collection('posts')
        .where('type', '==', 'national')
        .where('status.isDeleted', '==', false)
        .where('status.isHidden', '==', false)
        .orderBy('status.isPinned', 'desc')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get(),
    ]);

    const boards: SerializedBoard[] = boardsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name || '',
        code: d.code || '',
        type: d.type || 'national',
        order: d.order ?? 0,
        isActive: d.isActive ?? true,
      };
    });

    const boardMap = new Map(boards.map((b) => [b.code, b.name]));

    const totalCount: number = countSnap.data().count;
    const totalPages = Math.ceil(totalCount / 10) || 1;

    const posts: SerializedPost[] = postsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        title: d.title || '',
        content: d.content || '',
        boardCode: d.boardCode || '',
        boardName: boardMap.get(d.boardCode) || d.boardCode || '',
        authorId: d.authorId || '',
        authorInfo: {
          displayName: d.authorInfo?.displayName || '사용자',
          isAnonymous: d.authorInfo?.isAnonymous ?? false,
          profileImageUrl: d.authorInfo?.profileImageUrl || '',
        },
        createdAt: toSerializableTimestamp(d.createdAt),
        stats: {
          viewCount: d.stats?.viewCount ?? 0,
          likeCount: d.stats?.likeCount ?? 0,
          commentCount: d.stats?.commentCount ?? 0,
          scrapCount: d.stats?.scrapCount ?? 0,
        },
        status: {
          isPinned: d.status?.isPinned ?? false,
          isDeleted: d.status?.isDeleted ?? false,
          isHidden: d.status?.isHidden ?? false,
        },
        imageUrls: d.imageUrls || [],
        attachments: d.attachments || [],
        tags: d.tags || [],
        poll: d.poll || null,
        regions: d.regions || null,
        schoolId: d.schoolId || null,
      };
    });

    return { posts, boards, totalCount, totalPages };
  },
  ['community-initial-national'],
  { revalidate: 60 }
);

export async function getInitialNationalCommunityData(): Promise<InitialCommunityData> {
  try {
    return await fetchInitialNationalData();
  } catch (error) {
    console.error('초기 커뮤니티 데이터 조회 실패:', error);
    return { posts: [], boards: [], totalCount: 0, totalPages: 1 };
  }
}

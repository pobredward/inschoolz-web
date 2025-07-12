import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  getDocs,
  DocumentSnapshot,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../firebase';
import { z } from 'zod';

// 랭킹 타입 정의
export const RankingTypeSchema = z.enum(['national', 'regional', 'school']);
export type RankingType = z.infer<typeof RankingTypeSchema>;

// 랭킹 사용자 스키마
export const RankingUserSchema = z.object({
  id: z.string(),
  userName: z.string(),
  stats: z.object({
    totalExperience: z.number(),
    level: z.number(),
    currentExp: z.number(),
  }),
  school: z.object({
    id: z.string(),
    name: z.string(),
  }).optional(),
  regions: z.object({
    sido: z.string(),
    sigungu: z.string(),
  }).optional(),
  profile: z.object({
    avatar: z.string().optional(),
    displayName: z.string().optional(),
  }).optional(),
});

export type RankingUser = z.infer<typeof RankingUserSchema>;

// 랭킹 응답 스키마
export const RankingResponseSchema = z.object({
  users: z.array(RankingUserSchema),
  hasMore: z.boolean(),
  lastDoc: z.any().optional(),
});

export type RankingResponse = z.infer<typeof RankingResponseSchema>;

// 랭킹 쿼리 옵션
export interface RankingQueryOptions {
  type: RankingType;
  schoolId?: string;
  sido?: string;
  sigungu?: string;
  limit?: number;
  lastDoc?: DocumentSnapshot;
  searchQuery?: string;
}

/**
 * 랭킹 데이터를 조회합니다.
 */
export async function getRankings(options: RankingQueryOptions): Promise<RankingResponse> {
  try {
    const {
      type,
      schoolId,
      sido,
      sigungu,
      limit: queryLimit = 10,
      lastDoc,
      searchQuery
    } = options;

    const constraints: QueryConstraint[] = [];

    // 검색 쿼리가 있는 경우 userName으로 검색
    if (searchQuery) {
      constraints.push(
        where('profile.userName', '>=', searchQuery),
        where('profile.userName', '<=', searchQuery + '\uf8ff')
      );
    }

    // 타입별 필터링
    switch (type) {
      case 'school':
        if (!schoolId) {
          throw new Error('School ID is required for school ranking');
        }
        constraints.push(where('school.id', '==', schoolId));
        break;
      
      case 'regional':
        if (!sido || !sigungu) {
          throw new Error('Sido and Sigungu are required for regional ranking');
        }
        constraints.push(
          where('regions.sido', '==', sido),
          where('regions.sigungu', '==', sigungu)
        );
        break;
      
      case 'national':
        // 전국 랭킹은 추가 필터 없음
        break;
    }

    // 검색이 아닌 경우에만 경험치 순으로 정렬
    if (!searchQuery) {
      constraints.push(orderBy('stats.totalExperience', 'desc'));
    } else {
      constraints.push(orderBy('profile.userName', 'asc'));
    }

    // 페이지네이션
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    constraints.push(limit(queryLimit));

    const q = query(collection(db, 'users'), ...constraints);
    const querySnapshot = await getDocs(q);

    const users = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return RankingUserSchema.parse({
        id: doc.id,
        userName: data.profile?.userName || data.userName || '',
        stats: {
          totalExperience: data.stats?.totalExperience || 0,
          level: data.stats?.level || 1,
          currentExp: data.stats?.currentExp || 0,
        },
        school: data.school ? {
          id: data.school.id,
          name: data.school.name,
        } : undefined,
        regions: data.regions ? {
          sido: data.regions.sido,
          sigungu: data.regions.sigungu,
        } : undefined,
        profile: data.profile ? {
          avatar: data.profile.profileImageUrl,
          displayName: data.profile.realName || data.profile.userName,
        } : undefined,
      });
    });

    const hasMore = querySnapshot.docs.length === queryLimit;
    const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

    return {
      users,
      hasMore,
      lastDoc: newLastDoc,
    };
  } catch (error) {
    console.error('Error fetching rankings:', error);
    throw error;
  }
}

/**
 * 특정 사용자의 랭킹 위치를 조회합니다.
 */
export async function getUserRank(userId: string, options: Omit<RankingQueryOptions, 'limit' | 'lastDoc' | 'searchQuery'>): Promise<number> {
  try {
    const { type, schoolId, sido, sigungu } = options;

    const constraints: QueryConstraint[] = [];

    // 타입별 필터링
    switch (type) {
      case 'school':
        if (!schoolId) {
          throw new Error('School ID is required for school ranking');
        }
        constraints.push(where('school.id', '==', schoolId));
        break;
      
      case 'regional':
        if (!sido || !sigungu) {
          throw new Error('Sido and Sigungu are required for regional ranking');
        }
        constraints.push(
          where('regions.sido', '==', sido),
          where('regions.sigungu', '==', sigungu)
        );
        break;
      
      case 'national':
        // 전국 랭킹은 추가 필터 없음
        break;
    }

    // 사용자 정보 조회
    const userDoc = await getDocs(query(
      collection(db, 'users'),
      where('__name__', '==', userId)
    ));

    if (userDoc.empty) {
      throw new Error('User not found');
    }

    const userData = userDoc.docs[0].data();
    const userXp = userData.stats?.totalExperience || 0;

    // 해당 사용자보다 높은 경험치를 가진 사용자 수 조회
    const higherXpQuery = query(
      collection(db, 'users'),
      ...constraints,
      where('stats.totalExperience', '>', userXp)
    );

    const higherXpSnapshot = await getDocs(higherXpQuery);
    
    return higherXpSnapshot.size + 1; // 1-based ranking
  } catch (error) {
    console.error('Error fetching user rank:', error);
    throw error;
  }
}

/**
 * 랭킹 통계를 조회합니다.
 */
export async function getRankingStats(options: Omit<RankingQueryOptions, 'limit' | 'lastDoc' | 'searchQuery'>) {
  try {
    const { type, schoolId, sido, sigungu } = options;

    const constraints: QueryConstraint[] = [];

    // 타입별 필터링
    switch (type) {
      case 'school':
        if (!schoolId) {
          throw new Error('School ID is required for school ranking');
        }
        constraints.push(where('school.id', '==', schoolId));
        break;
      
      case 'regional':
        if (!sido || !sigungu) {
          throw new Error('Sido and Sigungu are required for regional ranking');
        }
        constraints.push(
          where('regions.sido', '==', sido),
          where('regions.sigungu', '==', sigungu)
        );
        break;
      
      case 'national':
        // 전국 랭킹은 추가 필터 없음
        break;
    }

    const q = query(collection(db, 'users'), ...constraints);
    const querySnapshot = await getDocs(q);

    const totalUsers = querySnapshot.size;
    const totalXp = querySnapshot.docs.reduce((sum, doc) => {
      const data = doc.data();
      return sum + (data.stats?.totalExperience || 0);
    }, 0);

    const averageXp = totalUsers > 0 ? Math.round(totalXp / totalUsers) : 0;

    return {
      totalUsers,
      totalXp,
      averageXp,
    };
  } catch (error) {
    console.error('Error fetching ranking stats:', error);
    throw error;
  }
} 

/**
 * 홈 화면용 랭킹 미리보기 (5등까지)
 */
export async function getRankingPreview(
  userId?: string,
  schoolId?: string,
  sido?: string,
  sigungu?: string
): Promise<{
  national: RankingUser[];
  regional: RankingUser[];
  school: RankingUser[];
}> {
  try {
    // 전국 랭킹 (5등까지)
    const nationalRanking = await getRankings({
      type: 'national',
      limit: 5
    });

    // 지역 랭킹 (5등까지)
    let regionalRanking = { users: [] as RankingUser[] };
    if (sido && sigungu) {
      regionalRanking = await getRankings({
        type: 'regional',
        sido,
        sigungu,
        limit: 5
      });
    }

    // 학교 랭킹 (5등까지)
    let schoolRanking = { users: [] as RankingUser[] };
    if (schoolId) {
      schoolRanking = await getRankings({
        type: 'school',
        schoolId,
        limit: 5
      });
    }

    return {
      national: nationalRanking.users,
      regional: regionalRanking.users,
      school: schoolRanking.users,
    };
  } catch (error) {
    console.error('Error fetching ranking preview:', error);
    throw error;
  }
} 
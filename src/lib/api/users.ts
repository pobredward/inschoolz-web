import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  serverTimestamp,
  deleteDoc,
  increment,
  getCountFromServer,
  limit as firestoreLimit
} from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { User, Post, Comment } from '@/types';
import { getDownloadURL, ref, uploadBytes, deleteObject } from 'firebase/storage';

/**
 * 사용자 정보 조회
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return { 
        ...userDoc.data(),
        uid: userDoc.id
      } as User;
    } else {
      return null;
    }
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    throw new Error('사용자 정보를 가져오는 중 오류가 발생했습니다.');
  }
};

/**
 * userName으로 사용자 정보 조회
 */
export const getUserByUserName = async (userName: string): Promise<User | null> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('profile.userName', '==', userName),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return { 
        ...userDoc.data(),
        uid: userDoc.id
      } as User;
    } else {
      return null;
    }
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    throw new Error('사용자 정보를 가져오는 중 오류가 발생했습니다.');
  }
};

/**
 * 사용자 작성 게시글 조회
 */
export const getUserPosts = async (
  userId: string, 
  page = 1, 
  pageSize = 10,
  sortBy: 'latest' | 'popular' = 'latest'
): Promise<{ posts: Post[], totalCount: number, hasMore: boolean }> => {
  try {
    if (!userId) {
      return {
        posts: [],
        totalCount: 0,
        hasMore: false
      };
    }

    const postsRef = collection(db, 'posts');
    let q;
    
    if (sortBy === 'latest') {
      q = query(
        postsRef,
        where('authorId', '==', userId),
        where('status.isDeleted', '==', false),
        orderBy('createdAt', 'desc'),
        limit(pageSize * page)
      );
    } else {
      q = query(
        postsRef,
        where('authorId', '==', userId),
        where('status.isDeleted', '==', false),
        orderBy('stats.likeCount', 'desc'),
        limit(pageSize * page)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];
    
    querySnapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() } as Post);
    });
    
    // 전체 게시글 수 가져오기
    const countQuery = query(
      postsRef,
      where('authorId', '==', userId),
      where('status.isDeleted', '==', false)
    );
    
    const countSnapshot = await getDocs(countQuery);
    const totalCount = countSnapshot.size;
    
    // 페이징 처리
    const startIndex = (page - 1) * pageSize;
    const paginatedPosts = posts.slice(startIndex, startIndex + pageSize);
    
    return {
      posts: paginatedPosts,
      totalCount,
      hasMore: totalCount > page * pageSize
    };
  } catch (error) {
    console.error('사용자 게시글 조회 오류:', error);
    throw new Error('사용자 게시글을 가져오는 중 오류가 발생했습니다.');
  }
};

/**
 * 사용자 작성 댓글 조회
 */
export const getUserComments = async (
  userId: string,
  page = 1,
  pageSize = 10
): Promise<{ comments: Comment[], totalCount: number, hasMore: boolean }> => {
  try {
    if (!userId) {
      return {
        comments: [],
        totalCount: 0,
        hasMore: false
      };
    }
    
    // Firestore에서는 하위 컬렉션에 대한 전체 쿼리가 불가능하므로 
    // 실제 구현에서는 별도의 comments 컬렉션을 만들거나 다른 방법 필요
    // 여기서는 개념적으로 구현
    
    // 모든 게시글의 comments 하위 컬렉션을 조회해야 함
    // 실제로는 사용자의 댓글을 추적하는 별도 컬렉션을 사용하는 것이 좋음
    const postsRef = collection(db, 'posts');
    const postsSnapshot = await getDocs(postsRef);
    
    const allComments: Comment[] = [];
    
    // 각 게시글의 comments 하위 컬렉션 조회
    for (const postDoc of postsSnapshot.docs) {
      const commentsRef = collection(db, `posts/${postDoc.id}/comments`);
      const commentsQuery = query(
        commentsRef,
        where('authorId', '==', userId),
        where('status.isDeleted', '==', false),
        orderBy('createdAt', 'desc')
      );
      
      const commentsSnapshot = await getDocs(commentsQuery);
      
      commentsSnapshot.forEach((commentDoc) => {
        allComments.push({ 
          id: commentDoc.id, 
          ...commentDoc.data(),
          postId: postDoc.id  // 명시적으로 postId 추가
        } as Comment);
      });
    }
    
    // 생성일 기준 정렬
    allComments.sort((a, b) => b.createdAt - a.createdAt);
    
    // 페이징 처리
    const totalCount = allComments.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedComments = allComments.slice(startIndex, endIndex);
    
    // Timestamp 직렬화
    const serializedComments = paginatedComments.map(comment => ({
      ...comment,
      createdAt: (comment.createdAt as any)?.toMillis ? (comment.createdAt as any).toMillis() : comment.createdAt,
      updatedAt: (comment.updatedAt as any)?.toMillis ? (comment.updatedAt as any).toMillis() : comment.updatedAt,
    }));
    
    return {
      comments: serializedComments,
      totalCount,
      hasMore: totalCount > endIndex
    };
  } catch (error) {
    console.error('사용자 댓글 조회 오류:', error);
    throw new Error('사용자 댓글을 가져오는 중 오류가 발생했습니다.');
  }
};

/**
 * 사용자가 좋아요한 게시글 목록 조회
 */
export const getUserLikedPosts = async (
  userId: string,
  page = 1,
  pageSize = 10
): Promise<Post[]> => {
  try {
    // 사용자가 좋아요한 게시글 ID 목록 조회
    const likesRef = collection(db, 'posts');
    const likesQuery = query(
      collection(db, 'posts'),
      where('stats.likeCount', '>', 0),
      orderBy('createdAt', 'desc'),
      limit(100) // 임시로 많은 수를 가져와서 필터링
    );
    
    const likesSnapshot = await getDocs(likesQuery);
    const likedPosts: Post[] = [];
    
    // 각 게시글의 좋아요 목록에서 해당 사용자가 좋아요했는지 확인
    for (const postDoc of likesSnapshot.docs) {
      const postData = postDoc.data();
      const likesSubRef = collection(db, 'posts', postDoc.id, 'likes');
      const userLikeQuery = query(likesSubRef, where('userId', '==', userId));
      const userLikeSnapshot = await getDocs(userLikeQuery);
      
      if (!userLikeSnapshot.empty) {
        likedPosts.push({
          id: postDoc.id,
          ...postData,
          createdAt: postData.createdAt?.seconds ? postData.createdAt.seconds : postData.createdAt
        } as Post);
      }
    }
    
    // 페이지네이션 적용
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return likedPosts.slice(startIndex, endIndex);
  } catch (error) {
    console.error('좋아요한 게시글 조회 오류:', error);
    throw new Error('좋아요한 게시글을 가져오는 중 오류가 발생했습니다.');
  }
};

/**
 * 팔로우 상태 확인
 */
export const checkFollowStatus = async (
  userId: string,
  targetId: string
): Promise<boolean> => {
  try {
    const relationshipsRef = collection(db, 'userRelationships');
    const q = query(
      relationshipsRef,
      where('userId', '==', userId),
      where('targetId', '==', targetId),
      where('type', '==', 'follow'),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('팔로우 상태 확인 오류:', error);
    throw new Error('팔로우 상태를 확인하는 중 오류가 발생했습니다.');
  }
};

/**
 * 팔로워 수 조회 (나를 팔로우하는 사용자)
 */
export const getFollowersCount = async (userId: string): Promise<number> => {
  try {
    const relationshipsRef = collection(db, 'userRelationships');
    const q = query(
      relationshipsRef,
      where('targetId', '==', userId),
      where('type', '==', 'follow'),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('팔로워 수 조회 오류:', error);
    throw new Error('팔로워 수를 조회하는 중 오류가 발생했습니다.');
  }
};

/**
 * 팔로잉 수 조회 (내가 팔로우하는 사용자)
 */
export const getFollowingCount = async (userId: string): Promise<number> => {
  try {
    const relationshipsRef = collection(db, 'userRelationships');
    const q = query(
      relationshipsRef,
      where('userId', '==', userId),
      where('type', '==', 'follow'),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('팔로잉 수 조회 오류:', error);
    throw new Error('팔로잉 수를 조회하는 중 오류가 발생했습니다.');
  }
};

/**
 * 팔로워 목록 조회 (나를 팔로우하는 사용자)
 */
export const getFollowers = async (
  userId: string,
  page = 1,
  pageSize = 20
): Promise<{ users: User[], totalCount: number, hasMore: boolean }> => {
  try {
    const relationshipsRef = collection(db, 'userRelationships');
    const q = query(
      relationshipsRef,
      where('targetId', '==', userId),
      where('type', '==', 'follow'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(pageSize * page)
    );
    
    const querySnapshot = await getDocs(q);
    const relationships = querySnapshot.docs.map(doc => doc.data() as UserRelationship);
    
    // 팔로워 사용자 정보 조회
    const users: User[] = [];
    for (const relationship of relationships) {
      const user = await getUserById(relationship.userId);
      if (user) {
        users.push(user);
      }
    }
    
    // 전체 팔로워 수 조회
    const totalCount = await getFollowersCount(userId);
    
    // 페이징 처리
    const startIndex = (page - 1) * pageSize;
    const paginatedUsers = users.slice(startIndex, startIndex + pageSize);
    
    return {
      users: paginatedUsers,
      totalCount,
      hasMore: totalCount > page * pageSize
    };
  } catch (error) {
    console.error('팔로워 목록 조회 오류:', error);
    throw new Error('팔로워 목록을 조회하는 중 오류가 발생했습니다.');
  }
};

/**
 * 팔로잉 목록 조회 (내가 팔로우하는 사용자)
 */
export const getFollowings = async (
  userId: string,
  page = 1,
  pageSize = 20
): Promise<{ users: User[], totalCount: number, hasMore: boolean }> => {
  try {
    const relationshipsRef = collection(db, 'userRelationships');
    const q = query(
      relationshipsRef,
      where('userId', '==', userId),
      where('type', '==', 'follow'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(pageSize * page)
    );
    
    const querySnapshot = await getDocs(q);
    const relationships = querySnapshot.docs.map(doc => doc.data() as UserRelationship);
    
    // 팔로잉 사용자 정보 조회
    const users: User[] = [];
    for (const relationship of relationships) {
      const user = await getUserById(relationship.targetId);
      if (user) {
        users.push(user);
      }
    }
    
    // 전체 팔로잉 수 조회
    const totalCount = await getFollowingCount(userId);
    
    // 페이징 처리
    const startIndex = (page - 1) * pageSize;
    const paginatedUsers = users.slice(startIndex, startIndex + pageSize);
    
    return {
      users: paginatedUsers,
      totalCount,
      hasMore: totalCount > page * pageSize
    };
  } catch (error) {
    console.error('팔로잉 목록 조회 오류:', error);
    throw new Error('팔로잉 목록을 조회하는 중 오류가 발생했습니다.');
  }
};

/**
 * 팔로우/언팔로우 토글
 */
export const toggleFollow = async (
  userId: string,
  targetId: string
): Promise<{ isFollowing: boolean }> => {
  try {
    // 자기 자신을 팔로우할 수 없음
    if (userId === targetId) {
      throw new Error('자기 자신을 팔로우할 수 없습니다.');
    }
    
    // 대상 사용자 존재 여부 확인
    const targetUser = await getUserById(targetId);
    if (!targetUser) {
      throw new Error('존재하지 않는 사용자입니다.');
    }
    
    // 현재 팔로우 상태 확인
    const relationshipsRef = collection(db, 'userRelationships');
    const q = query(
      relationshipsRef,
      where('userId', '==', userId),
      where('targetId', '==', targetId),
      where('type', '==', 'follow')
    );
    
    const querySnapshot = await getDocs(q);
    
    // 팔로우 관계가 존재하면 상태 변경 또는 제거
    if (!querySnapshot.empty) {
      const relationshipDoc = querySnapshot.docs[0];
      const relationship = relationshipDoc.data() as UserRelationship;
      
      if (relationship.status === 'active') {
        // 활성 상태면 비활성화 (언팔로우)
        await updateDoc(doc(db, 'userRelationships', relationshipDoc.id), {
          status: 'inactive',
          updatedAt: Date.now()
        });
        return { isFollowing: false };
      } else {
        // 비활성 상태면 활성화 (다시 팔로우)
        await updateDoc(doc(db, 'userRelationships', relationshipDoc.id), {
          status: 'active',
          updatedAt: Date.now()
        });
        return { isFollowing: true };
      }
    } else {
      // 팔로우 관계가 없으면 새로 생성
      const newRelationship: UserRelationship = {
        id: '',
        userId,
        targetId,
        type: 'follow',
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      const relationshipRef = await addDoc(relationshipsRef, newRelationship);
      
      // ID 업데이트
      await updateDoc(relationshipRef, {
        id: relationshipRef.id
      });
      
      return { isFollowing: true };
    }
  } catch (error) {
    console.error('팔로우 토글 오류:', error);
    throw new Error('팔로우 상태를 변경하는 중 오류가 발생했습니다.');
  }
};

/**
 * 차단 상태 확인
 */
export const checkBlockStatus = async (
  userId: string,
  targetId: string
): Promise<boolean> => {
  try {
    const relationshipsRef = collection(db, 'userRelationships');
    const q = query(
      relationshipsRef,
      where('userId', '==', userId),
      where('targetId', '==', targetId),
      where('type', '==', 'block'),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('차단 상태 확인 오류:', error);
    throw new Error('차단 상태를 확인하는 중 오류가 발생했습니다.');
  }
};

/**
 * 차단/차단해제 토글
 */
export const toggleBlock = async (
  userId: string,
  targetId: string
): Promise<{ isBlocked: boolean }> => {
  try {
    // 자기 자신을 차단할 수 없음
    if (userId === targetId) {
      throw new Error('자기 자신을 차단할 수 없습니다.');
    }
    
    // 대상 사용자 존재 여부 확인
    const targetUser = await getUserById(targetId);
    if (!targetUser) {
      throw new Error('존재하지 않는 사용자입니다.');
    }
    
    // 현재 차단 상태 확인
    const relationshipsRef = collection(db, 'userRelationships');
    const q = query(
      relationshipsRef,
      where('userId', '==', userId),
      where('targetId', '==', targetId),
      where('type', '==', 'block')
    );
    
    const querySnapshot = await getDocs(q);
    
    // 차단 관계가 존재하면 상태 변경 또는 제거
    if (!querySnapshot.empty) {
      const relationshipDoc = querySnapshot.docs[0];
      const relationship = relationshipDoc.data() as UserRelationship;
      
      if (relationship.status === 'active') {
        // 활성 상태면 비활성화 (차단 해제)
        await updateDoc(doc(db, 'userRelationships', relationshipDoc.id), {
          status: 'inactive',
          updatedAt: Date.now()
        });
        return { isBlocked: false };
      } else {
        // 비활성 상태면 활성화 (다시 차단)
        await updateDoc(doc(db, 'userRelationships', relationshipDoc.id), {
          status: 'active',
          updatedAt: Date.now()
        });
        return { isBlocked: true };
      }
    } else {
      // 차단 관계가 없으면 새로 생성
      const newRelationship: UserRelationship = {
        id: '',
        userId,
        targetId,
        type: 'block',
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      const relationshipRef = await addDoc(relationshipsRef, newRelationship);
      
      // ID 업데이트
      await updateDoc(relationshipRef, {
        id: relationshipRef.id
      });
      
      // 차단하면 자동으로 팔로우 관계 비활성화
      const followQ = query(
        relationshipsRef,
        where('userId', '==', userId),
        where('targetId', '==', targetId),
        where('type', '==', 'follow'),
        where('status', '==', 'active')
      );
      
      const followSnapshot = await getDocs(followQ);
      
      if (!followSnapshot.empty) {
        const followDoc = followSnapshot.docs[0];
        await updateDoc(doc(db, 'userRelationships', followDoc.id), {
          status: 'inactive',
          updatedAt: Date.now()
        });
      }
      
      return { isBlocked: true };
    }
  } catch (error) {
    console.error('차단 토글 오류:', error);
    throw new Error('차단 상태를 변경하는 중 오류가 발생했습니다.');
  }
};

/**
 * 사용자 활동 요약 정보 조회
 */
export const getUserActivitySummary = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    const userData = userDoc.data() as User;
    
    // 다음 레벨까지 필요한 경험치 계산
    const calculateNextLevelXP = (currentLevel: number): number => {
      return currentLevel * 10; // 1->2레벨: 10XP, 2->3레벨: 20XP, ...
    };

    const level = userData.stats?.level || 1;
    const currentExp = userData.stats?.currentExp || 0;
    const totalExperience = userData.stats?.totalExperience || 0;
    const nextLevelXP = calculateNextLevelXP(level);
    
    return {
      level,
      currentExp,
      totalExperience,
      nextLevelXP,
      totalPosts: userData.stats?.postCount || 0,
      totalComments: userData.stats?.commentCount || 0,
      totalLikes: userData.stats?.likeCount || 0,
      totalViews: 0, // 추후 구현
      streak: userData.stats?.streak || 0
    };
  } catch (error) {
    console.error('사용자 활동 요약 조회 오류:', error);
    throw new Error('사용자 활동 요약을 가져오는 중 오류가 발생했습니다.');
  }
};

/**
 * 게임 기록 조회
 */
export const getUserGameStats = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    const userData = userDoc.data() as User;
    
    // 게임 통계 정보가 없으면 빈 객체 반환
    return userData.gameStats || {};
  } catch (error) {
    console.error('게임 기록 조회 오류:', error);
    throw new Error('게임 기록을 조회하는 중 오류가 발생했습니다.');
  }
};

/**
 * 사용자 프로필 업데이트
 */
export const updateUserProfile = async (
  userId: string,
  profileData: {
    userName?: string;
    realName?: string;
    gender?: string;
    birthYear?: string | number;
    birthMonth?: string | number;
    birthDay?: string | number;
    phoneNumber?: string;
    referrerId?: string;
    sido?: string;
    sigungu?: string;
    address?: string;
  }
): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    const updates: Record<string, any> = {};
    
    // 프로필 필드 업데이트
    if (profileData.userName) {
      updates['profile.userName'] = profileData.userName;
    }
    
    if (profileData.realName !== undefined) {
      updates['profile.realName'] = profileData.realName;
    }
    
    if (profileData.gender !== undefined) {
      updates['profile.gender'] = profileData.gender;
    }
    
    if (profileData.birthYear !== undefined) {
      updates['profile.birthYear'] = Number(profileData.birthYear) || null;
    }
    
    if (profileData.birthMonth !== undefined) {
      updates['profile.birthMonth'] = Number(profileData.birthMonth) || null;
    }
    
    if (profileData.birthDay !== undefined) {
      updates['profile.birthDay'] = Number(profileData.birthDay) || null;
    }
    
    if (profileData.phoneNumber !== undefined) {
      updates['profile.phoneNumber'] = profileData.phoneNumber;
    }
    
    // 추천인 업데이트
    if (profileData.referrerId !== undefined) {
      updates['referrerId'] = profileData.referrerId;
    }
    
    // 지역 정보 업데이트
    if (profileData.sido || profileData.sigungu || profileData.address) {
      // 지역 정보가 아직 없는 경우 초기화
      if (!userDoc.data()?.regions) {
        updates['regions'] = {
          sido: '',
          sigungu: '',
          address: ''
        };
      }
      
      if (profileData.sido !== undefined) {
        updates['regions.sido'] = profileData.sido;
      }
      
      if (profileData.sigungu !== undefined) {
        updates['regions.sigungu'] = profileData.sigungu;
      }
      
      if (profileData.address !== undefined) {
        updates['regions.address'] = profileData.address;
      }
    }
    
    // 변경된 필드가 있는 경우에만 업데이트
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = serverTimestamp();
      await updateDoc(userRef, updates);
    }
    
    return true;
  } catch (error) {
    console.error('사용자 프로필 업데이트 오류:', error);
    throw new Error('프로필을 업데이트하는 중 오류가 발생했습니다.');
  }
};

/**
 * 프로필 이미지 업로드 및 업데이트
 */
export const updateProfileImage = async (
  userId: string,
  imageFile: File
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    if (!imageFile) {
      return { success: false, error: '이미지 파일이 제공되지 않았습니다.' };
    }

    // 파일 크기 검증 (5MB 제한)
    if (imageFile.size > 5 * 1024 * 1024) {
      return { success: false, error: '이미지 크기는 5MB 이하여야 합니다.' };
    }

    // 파일 형식 검증
    if (!imageFile.type.startsWith('image/')) {
      return { success: false, error: '이미지 파일만 업로드 가능합니다.' };
    }

    // 이전 프로필 이미지 URL 가져오기 (삭제를 위해)
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }
    
    const userData = userDoc.data();
    const oldImageUrl = userData?.profile?.profileImageUrl;
    
    // Firebase Storage 경로 설정
    const fileExtension = imageFile.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, `profile_images/${fileName}`);
    
    // 이미지 업로드
    await uploadBytes(storageRef, imageFile);
    
    // 다운로드 URL 가져오기
    const downloadUrl = await getDownloadURL(storageRef);
    
    // Firestore 업데이트
    await updateDoc(userRef, {
      'profile.profileImageUrl': downloadUrl,
      updatedAt: serverTimestamp()
    });
    
    // 이전 이미지가 있고 기본 이미지가 아니라면 삭제
    if (oldImageUrl && !oldImageUrl.includes('default-profile')) {
      try {
        // URL에서 파일 경로 추출
        const oldImagePath = decodeURIComponent(oldImageUrl.split('?')[0].split('/o/')[1]);
        const oldImageRef = ref(storage, oldImagePath);
        await deleteObject(oldImageRef);
      } catch (err) {
        console.error('이전 프로필 이미지 삭제 오류:', err);
        // 이전 이미지 삭제 실패해도 계속 진행
      }
    }
    
    return { success: true, url: downloadUrl };
  } catch (error) {
    console.error('프로필 이미지 업로드 오류:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '프로필 이미지를 업로드하는 중 오류가 발생했습니다.' 
    };
  }
}; 

/**
 * 관리자용 사용자 관리 기능들
 */

export interface AdminUserListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: 'all' | 'admin' | 'user';
  status?: 'all' | 'active' | 'inactive' | 'suspended';
  sortBy?: 'createdAt' | 'lastActiveAt' | 'experience' | 'userName';
  sortOrder?: 'asc' | 'desc';
}

export interface AdminUserListResponse {
  users: User[];
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
}

/**
 * 관리자용 사용자 목록 조회
 */
export const getUsersList = async (params: AdminUserListParams = {}): Promise<AdminUserListResponse> => {
  try {
    const {
      page = 1,
      pageSize = 20,
      search = '',
      role = 'all',
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;

    const usersRef = collection(db, 'users');
    let q = query(usersRef);

    // 역할 필터
    if (role !== 'all') {
      q = query(q, where('role', '==', role));
    }

    // 상태 필터
    if (status !== 'all') {
      q = query(q, where('status', '==', status));
    }

    // 검색 (userName 기준)
    if (search) {
      q = query(q, where('profile.userName', '>=', search), where('profile.userName', '<=', search + '\uf8ff'));
    }

    // 정렬
    q = query(q, orderBy(sortBy, sortOrder));

    // 페이지네이션
    const offset = (page - 1) * pageSize;
    q = query(q, limit(pageSize + offset));

    const querySnapshot = await getDocs(q);
    const allUsers: User[] = [];
    
    querySnapshot.forEach((doc) => {
      allUsers.push({ 
        uid: doc.id, 
        ...doc.data() 
      } as User);
    });

    // 페이지네이션 적용
    const users = allUsers.slice(offset, offset + pageSize);

    // 전체 개수 조회
    const countQuery = query(usersRef);
    const countSnapshot = await getCountFromServer(countQuery);
    const totalCount = countSnapshot.data().count;

    return {
      users,
      totalCount,
      hasMore: totalCount > page * pageSize,
      currentPage: page
    };
  } catch (error) {
    console.error('관리자 사용자 목록 조회 오류:', error);
    throw new Error('사용자 목록을 가져오는 중 오류가 발생했습니다.');
  }
};

/**
 * 관리자용 사용자 상세 정보 조회
 */
export const getUserDetail = async (userId: string): Promise<User & {
  activityStats: {
    totalPosts: number;
    totalComments: number;
    totalLikes: number;
    warningCount: number;
  };
  recentActivity: {
    lastLoginAt?: number;
    lastActiveAt?: number;
    recentPosts: Post[];
    recentComments: Comment[];
  };
}> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    const userData = { uid: userDoc.id, ...userDoc.data() } as User;

    // 활동 통계 조회
    const postsQuery = query(
      collection(db, 'posts'),
      where('authorId', '==', userId),
      where('status.isDeleted', '==', false)
    );
    const postsSnapshot = await getDocs(postsQuery);
    const totalPosts = postsSnapshot.size;

    // 최근 게시글 (최대 5개)
    const recentPostsQuery = query(
      collection(db, 'posts'),
      where('authorId', '==', userId),
      where('status.isDeleted', '==', false),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const recentPostsSnapshot = await getDocs(recentPostsQuery);
    const recentPosts: Post[] = [];
    recentPostsSnapshot.forEach((doc) => {
      recentPosts.push({ id: doc.id, ...doc.data() } as Post);
    });

    // 댓글 수 계산 (간단화된 버전)
    const totalComments = 0;
    const totalLikes = 0;
    
    // 경고 수 계산
    const warningsQuery = query(
      collection(db, 'users', userId, 'warningHistory'),
      where('status', '==', 'active')
    );
    const warningsSnapshot = await getDocs(warningsQuery);
    const warningCount = warningsSnapshot.size;

    return {
      ...userData,
      activityStats: {
        totalPosts,
        totalComments,
        totalLikes,
        warningCount
      },
      recentActivity: {
        lastLoginAt: (userData as any).lastLoginAt,
        lastActiveAt: (userData as any).lastActiveAt,
        recentPosts,
        recentComments: [] // 간단화
      }
    };
  } catch (error) {
    console.error('사용자 상세 정보 조회 오류:', error);
    throw new Error('사용자 상세 정보를 가져오는 중 오류가 발생했습니다.');
  }
};

/**
 * 사용자 역할 변경
 */
export const updateUserRole = async (userId: string, newRole: 'admin' | 'user'): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('사용자 역할 변경 오류:', error);
    throw new Error('사용자 역할을 변경하는 중 오류가 발생했습니다.');
  }
};

/**
 * 사용자 상태 변경
 */
export const updateUserStatus = async (userId: string, newStatus: 'active' | 'inactive' | 'suspended', reason?: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const updateData: Record<string, any> = {
      status: newStatus,
      updatedAt: serverTimestamp()
    };

    if (newStatus === 'suspended' && reason) {
      updateData.suspensionReason = reason;
      updateData.suspendedAt = serverTimestamp();
    }

    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error('사용자 상태 변경 오류:', error);
    throw new Error('사용자 상태를 변경하는 중 오류가 발생했습니다.');
  }
};

/**
 * 관리자용 사용자 경험치 수정
 */
export const updateUserExperienceAdmin = async (userId: string, newExperience: number, reason: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // 레벨 계산 (간단화된 버전)
    const calculateLevel = (exp: number): number => {
      let level = 1;
      let requiredExp = 10;
      let totalRequired = 0;
      
      while (totalRequired + requiredExp <= exp) {
        totalRequired += requiredExp;
        level++;
        requiredExp += 10;
      }
      
      return level;
    };

    const newLevel = calculateLevel(newExperience);
    
    await updateDoc(userRef, {
      'stats.experience': newExperience,
      'stats.level': newLevel,
      'stats.currentXP': newExperience,
      updatedAt: serverTimestamp()
    });

    // 경험치 변경 로그 추가
    await addDoc(collection(db, 'users', userId, 'experienceHistory'), {
      type: 'admin_adjustment',
      amount: newExperience,
      reason,
      adminId: 'current_admin', // 실제로는 현재 관리자 ID
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('사용자 경험치 수정 오류:', error);
    throw new Error('사용자 경험치를 수정하는 중 오류가 발생했습니다.');
  }
};

/**
 * 사용자 경고 추가
 */
export const addUserWarning = async (userId: string, reason: string, severity: 'low' | 'medium' | 'high'): Promise<void> => {
  try {
    // 경고 추가
    await addDoc(collection(db, 'users', userId, 'warningHistory'), {
      reason,
      severity,
      status: 'active',
      adminId: 'current_admin', // 실제로는 현재 관리자 ID
      createdAt: serverTimestamp()
    });

    // 사용자 경고 수 업데이트
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'warnings.count': increment(1),
      'warnings.lastWarningAt': serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('사용자 경고 추가 오류:', error);
    throw new Error('사용자 경고를 추가하는 중 오류가 발생했습니다.');
  }
};

/**
 * 사용자 삭제
 */
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    // 사용자 문서 삭제
    await deleteDoc(doc(db, 'users', userId));

    // 관련 데이터 정리는 Cloud Functions에서 처리하는 것이 좋음
    // 여기서는 기본적인 삭제만 수행
  } catch (error) {
    console.error('사용자 삭제 오류:', error);
    throw new Error('사용자를 삭제하는 중 오류가 발생했습니다.');
  }
};

/**
 * 대량 사용자 업데이트
 */
export const bulkUpdateUsers = async (userIds: string[], updates: {
  role?: 'admin' | 'user';
  status?: 'active' | 'inactive' | 'suspended';
  reason?: string;
}): Promise<void> => {
  try {
    const batch = [];
    
    for (const userId of userIds) {
      const userRef = doc(db, 'users', userId);
      const updateData: Record<string, any> = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      if (updates.status === 'suspended' && updates.reason) {
        updateData.suspensionReason = updates.reason;
        updateData.suspendedAt = serverTimestamp();
      }

      batch.push(updateDoc(userRef, updateData));
    }

    await Promise.all(batch);
  } catch (error) {
    console.error('대량 사용자 업데이트 오류:', error);
    throw new Error('사용자들을 업데이트하는 중 오류가 발생했습니다.');
  }
}; 

/**
 * 추천인 검색 함수
 * @param searchTerm 검색어 (userName)
 * @returns 검색된 사용자 목록
 */
export const searchUsers = async (searchTerm: string): Promise<Array<{
  uid: string;
  userName: string;
  realName: string;
}>> => {
  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return [];
    }

    const usersRef = collection(db, 'users');
    
    // userName으로 부분 일치 검색 (Firestore의 제한으로 인해 클라이언트에서 필터링)
    const q = query(
      usersRef,
      where('profile.userName', '>=', searchTerm.trim()),
      where('profile.userName', '<=', searchTerm.trim() + '\uf8ff'),
      limit(10) // 최대 10개 결과
    );
    
    const querySnapshot = await getDocs(q);
    const users: Array<{
      uid: string;
      userName: string;
      realName: string;
    }> = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.profile?.userName && userData.profile?.realName) {
        users.push({
          uid: doc.id,
          userName: userData.profile.userName,
          realName: userData.profile.realName
        });
      }
    });
    
    return users;
  } catch (error) {
    console.error('사용자 검색 오류:', error);
    return [];
  }
}; 

 
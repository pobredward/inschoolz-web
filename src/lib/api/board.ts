import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  increment,
  serverTimestamp,
  writeBatch,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Post, 
  Board
} from '@/types';
import { 
  BoardType,
  PopularPost,
  PostFormData,
  BoardFilterOptions
} from '@/types/board';
import { 
  getDocument, 
  getDocuments,
  getPaginatedDocuments,
  updateDocument,
  addDocument
} from '@/lib/firestore';
import { awardExperience } from '@/lib/experience';

// 게시판 목록 가져오기
export const getBoardsByType = async (type: BoardType) => {
  try {
    return await getDocuments<Board>('boards', [
      where('type', '==', type),
      where('isActive', '==', true),
      orderBy('order', 'asc')
    ]);
  } catch (error) {
    console.error('게시판 목록 가져오기 오류:', error);
    throw new Error('게시판 목록을 가져오는 중 오류가 발생했습니다.');
  }
};

// 즐겨찾는 게시판 목록 가져오기
export const getFavoriteBoards = async (userId: string, type: BoardType) => {
  try {
    const userDoc = await getDocument('users', userId);
    if (!userDoc || !(userDoc as any).favorites || !(userDoc as any).favorites.boards) {
      return [];
    }
    
    const boardCodes = (userDoc as any).favorites.boards[type] || [];
    
    if (boardCodes.length === 0) {
      return [];
    }
    
    return await getDocuments<Board>('boards', [
      where('code', 'in', boardCodes),
      where('isActive', '==', true),
      orderBy('order', 'asc')
    ]);
  } catch (error) {
    console.error('즐겨찾는 게시판 목록 가져오기 오류:', error);
    throw new Error('즐겨찾는 게시판 목록을 가져오는 중 오류가 발생했습니다.');
  }
};

// 인기 게시글 가져오기
export const getPopularPosts = async (type: BoardType, count = 5) => {
  try {
    return await getDocuments<PopularPost>('hottestPosts', [
      where('boardType', '==', type),
      orderBy('score', 'desc'),
      limit(count)
    ]);
  } catch (error) {
    console.error('인기 게시글 가져오기 오류:', error);
    throw new Error('인기 게시글을 가져오는 중 오류가 발생했습니다.');
  }
};

// 특정 게시판의 게시글 목록 가져오기
export const getPostsByBoard = async (
  boardCode: string, 
  pageSize = 20, 
  lastDoc?: QueryDocumentSnapshot<DocumentData>,
  filterOptions?: BoardFilterOptions
) => {
  try {
    const constraints = [
      where('code', '==', boardCode),
      where('status.isDeleted', '==', false),
      where('status.isHidden', '==', false)
    ];
    
    // 검색 필터 적용
    if (filterOptions?.keyword) {
      // 검색 대상에 따라 쿼리 조건 설정
      if (filterOptions.searchTarget === 'title') {
        constraints.push(where('title', '>=', filterOptions.keyword));
        constraints.push(where('title', '<=', filterOptions.keyword + '\uf8ff'));
      } else if (filterOptions.searchTarget === 'content') {
        constraints.push(where('content', '>=', filterOptions.keyword));
        constraints.push(where('content', '<=', filterOptions.keyword + '\uf8ff'));
      } else if (filterOptions.searchTarget === 'author') {
        constraints.push(where('authorInfo.displayName', '>=', filterOptions.keyword));
        constraints.push(where('authorInfo.displayName', '<=', filterOptions.keyword + '\uf8ff'));
      }
    }
    
    // 이미지 첨부 필터링
    if (filterOptions?.hasImage) {
      constraints.push(where('imageUrls', '!=', []));
    }
    
    // 투표 필터링
    if (filterOptions?.hasPoll) {
      constraints.push(where('poll.isActive', '==', true));
    }
    
    // 시간 필터링
    if (filterOptions?.timeFilter && filterOptions.timeFilter !== 'all') {
      let timestamp: Date;
      const now = new Date();
      
      if (filterOptions.timeFilter === 'today') {
        timestamp = new Date(now.setHours(0, 0, 0, 0));
      } else if (filterOptions.timeFilter === 'week') {
        const day = now.getDay();
        timestamp = new Date(now.setDate(now.getDate() - day));
        timestamp.setHours(0, 0, 0, 0);
      } else if (filterOptions.timeFilter === 'month') {
        timestamp = new Date(now.getFullYear(), now.getMonth(), 1);
      } else {
        timestamp = new Date();
      }
      
      constraints.push(where('createdAt', '>=', Timestamp.fromDate(timestamp)));
    }
    
    // 정렬 방식
    let sortField = 'createdAt';
    const sortDirection = 'desc';
    
    if (filterOptions?.sortBy === 'popular') {
      sortField = 'stats.likeCount';
    } else if (filterOptions?.sortBy === 'comments') {
      sortField = 'stats.commentCount';
    } else if (filterOptions?.sortBy === 'views') {
      sortField = 'stats.viewCount';
    }
    
    // orderBy 조건들을 별도로 추가
    const orderConstraints = [
      orderBy('status.isPinned', 'desc'),
      orderBy(sortField, sortDirection as 'asc' | 'desc')
    ];
    
    return await getPaginatedDocuments<Post>('posts', [...constraints, ...orderConstraints], pageSize, lastDoc);
  } catch (error) {
    console.error('게시글 목록 가져오기 오류:', error);
    throw new Error('게시글 목록을 가져오는 중 오류가 발생했습니다.');
  }
};

// 게시글 상세 정보 가져오기
export const getPostDetail = async (postId: string) => {
  try {
    const post = await getDocument<Post>('posts', postId);
    
    if (!post) {
      throw new Error('게시글을 찾을 수 없습니다.');
    }
    
    // 게시글 조회수 업데이트
    await updateDocument('posts', postId, {
      'stats.viewCount': increment(1)
    });
    
    // 게시글 Timestamp 직렬화
    const serializedPost = {
      ...post,
      createdAt: (post as any).createdAt?.toMillis ? (post as any).createdAt.toMillis() : (post as any).createdAt,
      updatedAt: (post as any).updatedAt?.toMillis ? (post as any).updatedAt.toMillis() : (post as any).updatedAt,
    };
    
    // 댓글 가져오기 (이미 직렬화됨)
    const comments = await getCommentsByPost(postId);
    
    return { post: serializedPost, comments };
  } catch (error) {
    console.error('게시글 상세 정보 가져오기 오류:', error);
    throw new Error('게시글 정보를 가져오는 중 오류가 발생했습니다.');
  }
};

// 게시글에 달린 댓글 가져오기
export const getCommentsByPost = async (postId: string) => {
  try {
    const commentsRef = collection(db, 'posts', postId, 'comments');
    const q = query(
      commentsRef,
      where('status.isDeleted', '==', false),
      where('parentId', '==', null),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const comments: any[] = [];
    
    for (const commentDoc of querySnapshot.docs) {
      const commentData = commentDoc.data();
      const comment = { id: commentDoc.id, ...commentData } as any;
      
      // 사용자 정보 가져오기
      let authorInfo = {
        displayName: '사용자',
        profileImageUrl: '',
        isAnonymous: comment.isAnonymous
      };
      
      if (!comment.isAnonymous && comment.authorId) {
        try {
          const userDocRef = doc(db, 'users', comment.authorId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData && userData.profile) {
              authorInfo = {
                displayName: userData.profile.userName || '사용자',
                profileImageUrl: userData.profile.profileImageUrl || '',
                isAnonymous: false
              };
            }
          }
        } catch (error) {
          console.error('사용자 정보 조회 오류:', error);
        }
      }
      
      // 대댓글 가져오기
      const repliesRef = collection(db, 'posts', postId, 'comments');
      const repliesQuery = query(
        repliesRef,
        where('parentId', '==', comment.id),
        where('status.isDeleted', '==', false),
        orderBy('createdAt', 'asc')
      );
      
      const repliesSnapshot = await getDocs(repliesQuery);
      const replies = [];
      
      for (const replyDocSnap of repliesSnapshot.docs) {
        const replyData = replyDocSnap.data();
        const reply = { id: replyDocSnap.id, ...replyData } as any;
        
        // 답글 작성자 정보 가져오기
        let replyAuthorInfo = {
          displayName: '사용자',
          profileImageUrl: '',
          isAnonymous: reply.isAnonymous
        };
        
        if (!reply.isAnonymous && reply.authorId) {
          try {
            const replyUserDocRef = doc(db, 'users', reply.authorId);
            const replyUserDocSnap = await getDoc(replyUserDocRef);
            if (replyUserDocSnap.exists()) {
              const replyUserData = replyUserDocSnap.data();
              if (replyUserData && replyUserData.profile) {
                replyAuthorInfo = {
                  displayName: replyUserData.profile.userName || '사용자',
                  profileImageUrl: replyUserData.profile.profileImageUrl || '',
                  isAnonymous: false
                };
              }
            }
          } catch (error) {
            console.error('답글 작성자 정보 조회 오류:', error);
          }
        }
        
        // 답글 Timestamp 직렬화
        const serializedReply = {
          ...reply,
          createdAt: reply.createdAt?.toMillis ? reply.createdAt.toMillis() : reply.createdAt,
          updatedAt: reply.updatedAt?.toMillis ? reply.updatedAt.toMillis() : reply.updatedAt,
          author: replyAuthorInfo
        };
        
        replies.push(serializedReply);
      }
      
      // 댓글 Timestamp 직렬화 및 사용자 정보와 대댓글 추가
      const serializedComment = {
        ...comment,
        createdAt: comment.createdAt?.toMillis ? comment.createdAt.toMillis() : comment.createdAt,
        updatedAt: comment.updatedAt?.toMillis ? comment.updatedAt.toMillis() : comment.updatedAt,
        author: authorInfo,
        replies
      };
      
      comments.push(serializedComment);
    }
    
    return comments;
  } catch (error) {
    console.error('댓글 목록 가져오기 오류:', error);
    throw new Error('댓글 목록을 가져오는 중 오류가 발생했습니다.');
  }
};

// 게시글 작성하기
export const createPost = async (boardCode: string, boardType: BoardType, data: PostFormData, userId: string) => {
  try {
    // 사용자 정보 가져오기
    const userDoc = await getDocument('users', userId);
    
    if (!userDoc) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }
    
    // 게시글 데이터 생성
    const postData: Partial<Post> = {
      title: data.title,
      content: data.content,
      authorId: userId,
      boardCode: boardCode,
      type: boardType,
      attachments: [],
      tags: data.tags || [],
      stats: {
        viewCount: 0,
        likeCount: 0,
        commentCount: 0
      },
      status: {
        isDeleted: false,
        isHidden: false,
        isBlocked: false,
        isPinned: false
      },
      authorInfo: {
        displayName: data.isAnonymous ? '익명' : (userDoc as any).profile?.userName || '사용자',
        profileImageUrl: data.isAnonymous ? '' : (userDoc as any).profile?.profileImageUrl || '',
        isAnonymous: data.isAnonymous
      }
    };
    
    // 학교 또는 지역 정보 설정
    if (boardType === 'school' && (userDoc as any).school?.id) {
      postData.schoolId = (userDoc as any).school.id;
    } else if (boardType === 'regional' && (userDoc as any).regions) {
      postData.regions = {
        sido: (userDoc as any).regions.sido,
        sigungu: (userDoc as any).regions.sigungu
      };
    }
    
    // 투표 정보 설정
    if (data.poll && data.poll.question && data.poll.options.length > 1) {
      postData.poll = {
        isActive: true,
        question: data.poll.question,
        options: data.poll.options.map((option, index) => ({
          text: option.text,
          imageUrl: option.imageUrl,
          voteCount: 0,
          index
        })),
        expiresAt: data.poll.expiresAt ? data.poll.expiresAt.getTime() : undefined,
        multipleChoice: data.poll.multipleChoice
      };
    }
    
    // 게시글 저장
    const postId = await addDocument('posts', postData);
    
    // 게시판 게시글 수 증가
    await updateDocument('boards', boardCode, {
      'stats.postCount': increment(1)
    });
    
    // 사용자 게시글 수 증가
    await updateDocument('users', userId, {
      'stats.postCount': increment(1)
    });

    // 경험치 지급
    try {
      const expResult = await awardExperience(userId, 'post');
      if (expResult.success && expResult.leveledUp) {
        console.log(`🎉 레벨업! ${expResult.oldLevel} → ${expResult.newLevel} (게시글 작성)`);
      }
    } catch (expError) {
      console.error('게시글 작성 경험치 지급 오류:', expError);
      // 경험치 지급 실패는 게시글 작성 자체를 실패로 처리하지 않음
    }
    
    return postId;
  } catch (error) {
    console.error('게시글 작성 오류:', error);
    throw new Error('게시글을 작성하는 중 오류가 발생했습니다.');
  }
};

// 게시글 좋아요 토글
export const togglePostLike = async (postId: string, userId: string) => {
  try {
    // 좋아요 중복 체크
    const likeRef = doc(db, 'posts', postId, 'likes', userId);
    const likeDoc = await getDoc(likeRef);
    const batch = writeBatch(db);
    
    let isLiked = false;
    
    if (likeDoc.exists()) {
      // 좋아요 취소
      batch.delete(likeRef);
      // 게시글 좋아요 수 감소
      batch.update(doc(db, 'posts', postId), {
        'stats.likeCount': increment(-1)
      });
    } else {
      // 좋아요 추가
      batch.set(likeRef, {
        createdAt: serverTimestamp()
      });
      // 게시글 좋아요 수 증가
      batch.update(doc(db, 'posts', postId), {
        'stats.likeCount': increment(1)
      });
      isLiked = true;
    }
    
    await batch.commit();

    // 좋아요 추가 시에만 경험치 지급 (좋아요 취소는 경험치 지급하지 않음)
    if (isLiked) {
      try {
        const expResult = await awardExperience(userId, 'like');
        if (expResult.success && expResult.leveledUp) {
          console.log(`🎉 레벨업! ${expResult.oldLevel} → ${expResult.newLevel} (좋아요)`);
        }
      } catch (expError) {
        console.error('좋아요 경험치 지급 오류:', expError);
        // 경험치 지급 실패는 좋아요 자체를 실패로 처리하지 않음
      }
    }
    
    return isLiked;
  } catch (error) {
    console.error('좋아요 토글 오류:', error);
    throw new Error('좋아요 처리 중 오류가 발생했습니다.');
  }
};

// 댓글 작성하기
export const createComment = async (postId: string, content: string, userId: string, isAnonymous: boolean, parentId?: string) => {
  try {
    // 사용자 정보 가져오기
    const userDoc = await getDocument('users', userId);
    
    if (!userDoc) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }
    
    // 댓글 데이터 생성
    const commentData = {
      postId,
      content,
      authorId: userId,
      isAnonymous,
      parentId: parentId || null,
      stats: {
        likeCount: 0
      },
      status: {
        isDeleted: false,
        isBlocked: false
      }
    };
    
    // 댓글 저장
    const commentRef = collection(db, 'posts', postId, 'comments');
    const commentDoc = await addDoc(commentRef, {
      ...commentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // 게시글 댓글 수 업데이트
    await updateDocument('posts', postId, {
      'stats.commentCount': increment(1)
    });
    
    // 사용자 댓글 수 업데이트
    await updateDocument('users', userId, {
      'stats.commentCount': increment(1)
    });

    // 경험치 지급
    try {
      const expResult = await awardExperience(userId, 'comment');
      if (expResult.success && expResult.leveledUp) {
        console.log(`🎉 레벨업! ${expResult.oldLevel} → ${expResult.newLevel} (댓글 작성)`);
      }
    } catch (expError) {
      console.error('댓글 작성 경험치 지급 오류:', expError);
      // 경험치 지급 실패는 댓글 작성 자체를 실패로 처리하지 않음
    }
    
    return commentDoc.id;
  } catch (error) {
    console.error('댓글 작성 오류:', error);
    throw new Error('댓글을 작성하는 중 오류가 발생했습니다.');
  }
};

// 게시판 즐겨찾기 토글
export const toggleBoardFavorite = async (boardCode: string, boardType: BoardType, userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }
    
    const userData = userDoc.data();
    const favorites = (userData as any).favorites?.boards || {};
    const boardCodes = favorites[boardType] || [];
    
    let isFavorite = false;
    
    if (boardCodes.includes(boardCode)) {
      // 즐겨찾기 해제
      await updateDoc(userRef, {
        [`favorites.boards.${boardType}`]: arrayRemove(boardCode)
      });
    } else {
      // 즐겨찾기 추가
      await updateDoc(userRef, {
        [`favorites.boards.${boardType}`]: arrayUnion(boardCode)
      });
      isFavorite = true;
    }
    
    return isFavorite;
  } catch (error) {
    console.error('게시판 즐겨찾기 토글 오류:', error);
    throw new Error('즐겨찾기 처리 중 오류가 발생했습니다.');
  }
}; 

// 댓글 수정하기
export const updateComment = async (postId: string, commentId: string, content: string, userId: string) => {
  try {
    const commentRef = doc(db, 'posts', postId, 'comments', commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) {
      throw new Error('댓글을 찾을 수 없습니다.');
    }
    
    const commentData = commentDoc.data();
    
    // 권한 체크 (작성자만 수정 가능)
    if (commentData.authorId !== userId) {
      throw new Error('댓글을 수정할 권한이 없습니다.');
    }
    
    await updateDoc(commentRef, {
      content,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('댓글 수정 오류:', error);
    throw new Error('댓글을 수정하는 중 오류가 발생했습니다.');
  }
};

// 댓글 삭제하기
export const deleteComment = async (postId: string, commentId: string, userId: string) => {
  try {
    const commentRef = doc(db, 'posts', postId, 'comments', commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) {
      throw new Error('댓글을 찾을 수 없습니다.');
    }
    
    const commentData = commentDoc.data();
    
    // 권한 체크 (작성자만 삭제 가능)
    if (commentData.authorId !== userId) {
      throw new Error('댓글을 삭제할 권한이 없습니다.');
    }
    
    // 댓글을 실제로 삭제하는 대신 isDeleted 플래그 설정
    await updateDoc(commentRef, {
      status: {
        ...commentData.status,
        isDeleted: true
      },
      updatedAt: serverTimestamp()
    });
    
    // 게시글 댓글 수 감소
    await updateDocument('posts', postId, {
      'stats.commentCount': increment(-1)
    });
    
    // 사용자 댓글 수 감소
    await updateDocument('users', userId, {
      'stats.commentCount': increment(-1)
    });
    
    return true;
  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    throw new Error('댓글을 삭제하는 중 오류가 발생했습니다.');
  }
};

// 댓글 좋아요 토글
export const toggleCommentLike = async (postId: string, commentId: string, userId: string) => {
  try {
    // 좋아요 중복 체크
    const likeRef = doc(db, 'posts', postId, 'comments', commentId, 'likes', userId);
    const likeDoc = await getDoc(likeRef);
    const batch = writeBatch(db);
    
    let isLiked = false;
    
    if (likeDoc.exists()) {
      // 좋아요 취소
      batch.delete(likeRef);
      // 댓글 좋아요 수 감소
      batch.update(doc(db, 'posts', postId, 'comments', commentId), {
        'stats.likeCount': increment(-1)
      });
    } else {
      // 좋아요 추가
      batch.set(likeRef, {
        createdAt: serverTimestamp()
      });
      // 댓글 좋아요 수 증가
      batch.update(doc(db, 'posts', postId, 'comments', commentId), {
        'stats.likeCount': increment(1)
      });
      isLiked = true;
    }
    
    await batch.commit();
    return isLiked;
  } catch (error) {
    console.error('댓글 좋아요 토글 오류:', error);
    throw new Error('좋아요 처리 중 오류가 발생했습니다.');
  }
};

// 댓글 신고하기
export const reportComment = async (postId: string, commentId: string, userId: string, reason: string) => {
  try {
    // 신고 데이터 생성
    const reportData = {
      reporterId: userId,
      targetType: 'comment' as const,
      targetId: commentId,
      postId,
      reason,
      status: 'pending' as const,
      createdAt: serverTimestamp()
    };
    
    // 신고 저장
    const reportRef = collection(db, 'posts', postId, 'comments', commentId, 'reports');
    await addDoc(reportRef, reportData);
    
    return true;
  } catch (error) {
    console.error('댓글 신고 오류:', error);
    throw new Error('댓글을 신고하는 중 오류가 발생했습니다.');
  }
};

// 특정 게시판의 게시글 목록 가져오기 (커뮤니티 페이지용)
export const getPostsByBoardType = async (
  boardType: BoardType,
  boardCode: string,
  pageSize = 20
) => {
  try {
    const constraints = [
      where('type', '==', boardType),
      where('code', '==', boardCode),
      where('status.isDeleted', '==', false),
      where('status.isHidden', '==', false),
      orderBy('status.isPinned', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    ];
    
    return await getDocuments<Post>('posts', constraints);
  } catch (error) {
    console.error('게시글 목록 가져오기 오류:', error);
    throw new Error('게시글 목록을 가져오는 중 오류가 발생했습니다.');
  }
};

// 모든 게시판의 게시글 가져오기 (커뮤니티 페이지용)
export const getAllPostsByType = async (
  boardType: BoardType,
  pageSize = 50
) => {
  try {
    const constraints = [
      where('type', '==', boardType),
      where('status.isDeleted', '==', false),
      where('status.isHidden', '==', false),
      orderBy('status.isPinned', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    ];
    
    return await getDocuments<Post>('posts', constraints);
  } catch (error) {
    console.error('전체 게시글 목록 가져오기 오류:', error);
    throw new Error('게시글 목록을 가져오는 중 오류가 발생했습니다.');
  }
};
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc,
  increment,
  runTransaction
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Comment } from '@/types';

// 기존 댓글 API 함수들...

/**
 * 4자리 비밀번호를 해시화합니다. (Web Crypto API 사용)
 */
export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'inschoolz_salt'); // 간단한 솔트 추가
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * 비밀번호를 검증합니다.
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const hashedInput = await hashPassword(password);
  return hashedInput === hash;
};

/**
 * 익명 댓글을 작성합니다.
 */
export const createAnonymousComment = async ({
  postId,
  content,
  nickname,
  password,
  parentId = null,
  ipAddress
}: {
  postId: string;
  content: string;
  nickname: string;
  password: string;
  parentId?: string | null;
  ipAddress?: string;
}): Promise<Comment> => {
  try {
    // 비밀번호 해시화
    const passwordHash = await hashPassword(password);
    
    // 댓글 데이터 생성
    const commentData = {
      postId,
      content,
      authorId: null,
      isAnonymous: true,
      parentId,
      anonymousAuthor: {
        nickname,
        passwordHash,
        ipAddress: ipAddress || null,
      },
      stats: {
        likeCount: 0,
      },
      status: {
        isDeleted: false,
        isBlocked: false,
      },
      createdAt: Date.now(),
    };

    // Firestore에 댓글 추가
    const commentRef = await addDoc(collection(db, 'posts', postId, 'comments'), commentData);
    
    // 게시글의 댓글 수 증가
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      'stats.commentCount': increment(1),
    });

    // 생성된 댓글 반환
    return {
      id: commentRef.id,
      ...commentData,
    } as Comment;
  } catch (error) {
    console.error('익명 댓글 작성 실패:', error);
    throw new Error('댓글 작성에 실패했습니다.');
  }
};

/**
 * 익명 댓글의 비밀번호를 검증합니다.
 */
export const verifyAnonymousCommentPassword = async (
  postId: string,
  commentId: string,
  password: string
): Promise<boolean> => {
  try {
    const commentDoc = await getDoc(doc(db, 'posts', postId, 'comments', commentId));
    
    if (!commentDoc.exists()) {
      return false;
    }

    const comment = commentDoc.data() as Comment;
    
    // 익명 댓글이 아니거나 비밀번호 해시가 없는 경우
    if (!comment.isAnonymous || !comment.anonymousAuthor?.passwordHash) {
      return false;
    }

    return verifyPassword(password, comment.anonymousAuthor.passwordHash);
  } catch (error) {
    console.error('익명 댓글 비밀번호 검증 실패:', error);
    return false;
  }
};

/**
 * 익명 댓글을 수정합니다.
 */
export const updateAnonymousComment = async (
  postId: string,
  commentId: string,
  content: string,
  password: string
): Promise<void> => {
  try {
    // 비밀번호 검증
    const isValidPassword = await verifyAnonymousCommentPassword(postId, commentId, password);
    
    if (!isValidPassword) {
      throw new Error('비밀번호가 일치하지 않습니다.');
    }

    // 댓글 수정
    const commentRef = doc(db, 'posts', postId, 'comments', commentId);
    await updateDoc(commentRef, {
      content,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('익명 댓글 수정 실패:', error);
    throw error;
  }
};

/**
 * 익명 댓글을 삭제합니다.
 */
export const deleteAnonymousComment = async (
  postId: string,
  commentId: string,
  password: string
): Promise<void> => {
  try {
    // 비밀번호 검증
    const isValidPassword = await verifyAnonymousCommentPassword(postId, commentId, password);
    
    if (!isValidPassword) {
      throw new Error('비밀번호가 일치하지 않습니다.');
    }

    // 트랜잭션으로 댓글 삭제 및 게시글 댓글 수 감소
    await runTransaction(db, async (transaction) => {
      const commentRef = doc(db, 'posts', postId, 'comments', commentId);
      const postRef = doc(db, 'posts', postId);
      
      // 댓글 상태를 삭제로 변경 (실제 삭제하지 않고 상태만 변경)
      transaction.update(commentRef, {
        'status.isDeleted': true,
        content: '삭제된 댓글입니다.',
        deletedAt: Date.now(),
      });
      
      // 게시글의 댓글 수 감소
      transaction.update(postRef, {
        'stats.commentCount': increment(-1),
      });
    });
  } catch (error) {
    console.error('익명 댓글 삭제 실패:', error);
    throw error;
  }
};

/**
 * 사용자의 IP 주소를 가져옵니다 (클라이언트 측에서는 제한적)
 */
export const getClientIP = async (): Promise<string | null> => {
  try {
    // 실제 운영 환경에서는 서버 측에서 IP를 가져와야 합니다.
    // 클라이언트에서는 정확한 IP를 얻기 어렵습니다.
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('IP 주소 조회 실패:', error);
    return null;
  }
}; 
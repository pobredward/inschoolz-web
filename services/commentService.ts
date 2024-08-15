import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  increment,
  arrayUnion,
  arrayRemove,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { deleteCommentImage } from "./imageService";

export interface Comment {
  id: string;
  postId: string;
  author: string;
  authorId: string;
  content: string;
  createdAt: Date;
  parentId: string | null;
  likes: number;
  likedBy: string[];
  imageUrl?: string;
  isDeleted: boolean;
}

export async function createComment(commentData: Omit<Comment, "id">) {
  const commentsRef = collection(db, "comments");
  const docRef = await addDoc(commentsRef, commentData);

  // Update post's comment count
  const postRef = doc(db, "posts", commentData.postId);
  await updateDoc(postRef, {
    comments: increment(1),
  });

  // Add comment reference to user's comments subcollection
  const userCommentRef = doc(
    db,
    `users/${commentData.authorId}/comments`,
    docRef.id,
  );
  await setDoc(userCommentRef, {
    postId: commentData.postId,
    commentId: docRef.id,
    createdAt: commentData.createdAt,
    isReply: !!commentData.parentId,
    parentId: commentData.parentId,
  });

  return { ...commentData, id: docRef.id };
}

export async function updateComment(
  commentId: string,
  content: string,
  imageUrl?: string | null,
) {
  const commentRef = doc(db, "comments", commentId);
  const updateData: Partial<Comment> = { content };

  if (imageUrl === null) {
    // 이미지를 삭제하는 경우
    updateData.imageUrl = null;
  } else if (imageUrl) {
    // 새 이미지를 추가하거나 기존 이미지를 업데이트하는 경우
    updateData.imageUrl = imageUrl;
  }

  await updateDoc(commentRef, updateData);
}

export async function deleteComment(
  commentId: string,
  postId: string,
  authorId: string,
) {
  try {
    const commentRef = doc(db, "comments", commentId);
    const commentDoc = await getDoc(commentRef);

    if (!commentDoc.exists()) {
      throw new Error("Comment not found");
    }

    const commentData = commentDoc.data();
    const hasReplies = await checkForReplies(commentId);

    if (hasReplies) {
      // 대댓글이 있는 경우 내용만 수정
      await updateDoc(commentRef, {
        content: "삭제된 메시지입니다",
        isDeleted: true,
      });
    } else {
      // 대댓글이 없는 경우 완전히 삭제
      await deleteDoc(commentRef);

      // 사용자의 comments 서브컬렉션에서 댓글 참조 삭제
      const userCommentRef = doc(db, `users/${authorId}/comments`, commentId);
      await deleteDoc(userCommentRef);

      // 게시글의 댓글 수 감소
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        comments: increment(-1),
      });
    }

    console.log("Comment deleted or modified successfully");
  } catch (error) {
    console.error("Error deleting comment: ", error);
    throw error;
  }
}

async function checkForReplies(commentId: string): Promise<boolean> {
  const repliesQuery = query(
    collection(db, "comments"),
    where("parentId", "==", commentId),
  );
  const repliesSnapshot = await getDocs(repliesQuery);
  return !repliesSnapshot.empty;
}

export async function likeComment(commentId: string, userId: string) {
  const commentRef = doc(db, "comments", commentId);
  await updateDoc(commentRef, {
    likes: increment(1),
    likedBy: arrayUnion(userId),
  });
}

export async function unlikeComment(commentId: string, userId: string) {
  const commentRef = doc(db, "comments", commentId);
  await updateDoc(commentRef, {
    likes: increment(-1),
    likedBy: arrayRemove(userId),
  });
}

export default {
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment,
};

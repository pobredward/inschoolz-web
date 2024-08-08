import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  increment,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { handleCommentCreation } from "../utils/experience";

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
}

export async function createComment(commentData: Omit<Comment, "id">) {
  const commentsRef = collection(db, "comments");
  const docRef = await addDoc(commentsRef, commentData);

  // Update post's comment count
  const postRef = doc(db, "posts", commentData.postId);
  await updateDoc(postRef, {
    comments: increment(1),
  });

  // 댓글 작성 후 경험치 부여
  await handleCommentCreation(commentData.authorId);

  return { ...commentData, id: docRef.id };
}

export async function updateComment(commentId: string, content: string) {
  const commentRef = doc(db, "comments", commentId);
  await updateDoc(commentRef, { content });
}

export async function deleteComment(commentId: string, postId: string) {
  const commentRef = doc(db, "comments", commentId);
  await deleteDoc(commentRef);

  // Update post's comment count
  const postRef = doc(db, "posts", postId);
  await updateDoc(postRef, {
    comments: increment(-1),
  });
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

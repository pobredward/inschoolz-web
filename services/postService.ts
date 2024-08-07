import { Post, User } from "../store/atoms";
import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

export async function fetchPostsByCategory(
  categoryId: string,
): Promise<Post[]> {
  const postsRef = collection(db, "posts");
  let q = query(postsRef, where("categoryId", "==", categoryId));

  const querySnapshot = await getDocs(q);
  const posts = querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as Post,
  );

  return posts;
}

export async function fetchFilteredPosts(
  categoryId: string,
  user: User,
): Promise<Post[]> {
  const posts = await fetchPostsByCategory(categoryId);

  if (categoryId.startsWith("regional")) {
    return posts.filter(
      (post) =>
        post.address1 === user.address1 && post.address2 === user.address2,
    );
  } else if (categoryId.startsWith("school")) {
    return posts.filter((post) => post.schoolId === user.schoolId);
  }

  return posts;
}

export interface CreatePostData {
  title: string;
  content: string;
  categoryId: string;
  author: string;
  authorId: string;
  address1?: string;
  address2?: string;
  schoolId?: string;
  schoolName?: string;
}

export async function createPost(postData: CreatePostData) {
  if (!postData.authorId) {
    throw new Error("Author ID is required");
  }

  const postsRef = collection(db, "posts");
  const now = new Date();
  const newPost = {
    ...postData,
    createdAt: now,
    updatedAt: now,
    likes: 0,
    comments: 0,
    views: 0,
    likedBy: [],
  };
  return addDoc(postsRef, newPost);
}

export async function updatePost(postId: string, updateData: Partial<Post>) {
  const postRef = doc(db, "posts", postId);
  const updatedData = {
    ...updateData,
    updatedAt: new Date(),
  };
  return updateDoc(postRef, updatedData);
}

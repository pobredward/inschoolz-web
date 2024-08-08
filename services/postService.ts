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
import { handlePostCreation } from "../utils/experience";

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

export interface VoteOption {
  text: string;
  imageUrl?: string;
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
  imageUrls?: string[];
  isVotePost: boolean;
  voteOptions?: VoteOption[] | null;
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
    voteResults:
      postData.isVotePost && postData.voteOptions
        ? postData.voteOptions.reduce(
            (acc, _, index) => {
              acc[index] = 0;
              return acc;
            },
            {} as { [key: number]: number },
          )
        : null,
    voterIds: [],
  };

  const docRef = await addDoc(postsRef, newPost);

  // 게시글 작성 후 경험치 부여
  await handlePostCreation(postData.authorId);

  return docRef;
}

export async function updatePost(postId: string, updateData: Partial<Post>) {
  const postRef = doc(db, "posts", postId);
  const updatedData = {
    ...updateData,
    updatedAt: new Date(),
  };
  return updateDoc(postRef, updatedData);
}

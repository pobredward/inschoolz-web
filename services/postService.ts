import { Post, User } from "../store/atoms";
import { db } from "../lib/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

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

interface CreatePostData {
  title: string;
  content: string;
  categoryId: string;
  authorId: string;
  authorName: string;
  address1?: string;
  address2?: string;
  schoolId?: string;
}

export async function createPost(postData: CreatePostData) {
  const postsRef = collection(db, "posts");
  const newPost = {
    ...postData,
    createdAt: new Date(),
  };
  return addDoc(postsRef, newPost);
}

import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { deleteUser as deleteFirebaseUser } from "firebase/auth";
import { db, auth, storage } from "../lib/firebase";
import { ref, listAll, deleteObject } from "firebase/storage";
import { User } from "../types";

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const postsQuery = query(
      collection(db, "posts"),
      where("authorId", "==", userId),
    );
    const postsSnapshot = await getDocs(postsQuery);
    const updatePostPromises = postsSnapshot.docs.map((doc) =>
      updateDoc(doc.ref, {
        author: "탈퇴한 회원",
      }),
    );
    await Promise.all(updatePostPromises);

    const commentsQuery = query(
      collection(db, "comments"),
      where("authorId", "==", userId),
    );
    const commentsSnapshot = await getDocs(commentsQuery);
    const updateCommentPromises = commentsSnapshot.docs.map((doc) =>
      updateDoc(doc.ref, {
        author: "탈퇴한 회원",
      }),
    );
    await Promise.all(updateCommentPromises);

    // 2. 사용자의 이미지 파일 삭제
    await deleteUserImages(userId);

    // 3. Firestore에서 사용자 문서 삭제
    await updateDoc(doc(db, "users", userId), {
      name: "탈퇴한 회원",
      email: "deleted@example.com",
      userId: "",
      phoneNumber: "",
      address1: "",
      address2: "",
      schoolId: "",
      schoolName: "",
      birthYear: 0,
      birthMonth: 0,
      birthDay: 0,
      isDeleted: true,
    });

    // 4. Firebase Authentication에서 사용자 삭제
    const currentUser = auth.currentUser;
    if (currentUser) {
      await deleteFirebaseUser(currentUser);
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

const deleteUserImages = async (userId: string): Promise<void> => {
  const imageFolders = ["images", "vote_images"];

  for (const folder of imageFolders) {
    const userImagesRef = ref(storage, `users/${userId}/${folder}`);

    try {
      const fileList = await listAll(userImagesRef);
      const deletePromises = fileList.items.map((fileRef) =>
        deleteObject(fileRef),
      );
      await Promise.all(deletePromises);
    } catch (error) {
      console.error(`Error deleting user ${folder}:`, error);
    }
  }
};

export const updateUserProfile = async (
  userId: string,
  updatedData: Partial<User>,
): Promise<void> => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, updatedData);

  // 로컬 스토리지 업데이트
  const cachedUser = localStorage.getItem(`user_${userId}`);
  if (cachedUser) {
    const updatedCachedUser = { ...JSON.parse(cachedUser), ...updatedData };
    localStorage.setItem(`user_${userId}`, JSON.stringify(updatedCachedUser));
  }
};

export async function fetchUserComments(userId: string) {
  const userCommentsRef = collection(db, `users/${userId}/comments`);
  const q = query(userCommentsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  const commentsPromises = snapshot.docs.map(async (doc) => {
    const commentData = doc.data();
    const commentRef = doc(db, "comments", commentData.commentId);
    const commentDoc = await getDoc(commentRef);

    if (commentDoc.exists()) {
      return {
        ...commentDoc.data(),
        id: commentDoc.id,
        isReply: commentData.isReply,
        parentId: commentData.parentId,
      };
    }
    return null;
  });

  const comments = await Promise.all(commentsPromises);
  return comments.filter((comment) => comment !== null);
}

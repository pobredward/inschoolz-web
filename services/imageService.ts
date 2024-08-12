// services/imageService.ts
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  deleteObject,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

const storage = getStorage();

export const uploadImage = async (
  file: File,
  userId: string,
  type: "post" | "comment" | "profile" | "vote",
  id?: string,
): Promise<string> => {
  const fileExtension = file.name.split(".").pop();
  const fileName = `${uuidv4()}.${fileExtension}`;
  let filePath: string;

  switch (type) {
    case "post":
      filePath = `posts/${id}/images/general/${fileName}`;
      break;
    case "comment":
      filePath = `comments/${id}/image.${fileExtension}`;
      break;
    case "profile":
      filePath = `users/${userId}/profile.${fileExtension}`;
      break;
    case "vote":
      filePath = `posts/${id}/images/vote/${fileName}`;
      break;
    default:
      filePath = `temp/${userId}/${fileName}`;
  }

  const fileRef = ref(storage, filePath);

  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
};

export const deleteUserImages = async (userId: string): Promise<void> => {
  const userProfileRef = ref(storage, `users/${userId}`);

  try {
    const fileList = await listAll(userProfileRef);
    const deletePromises = fileList.items.map((fileRef) =>
      deleteObject(fileRef),
    );
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error deleting user images:", error);
    throw error;
  }
};

export const deletePostImages = async (postId: string): Promise<void> => {
  const postImagesRef = ref(storage, `posts/${postId}`);

  try {
    const fileList = await listAll(postImagesRef);
    const deletePromises = fileList.items.map((fileRef) =>
      deleteObject(fileRef),
    );
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error deleting post images:", error);
    throw error;
  }
};

export const deleteCommentImage = async (commentId: string): Promise<void> => {
  const commentImageRef = ref(storage, `comments/${commentId}`);

  try {
    const fileList = await listAll(commentImageRef);
    const deletePromises = fileList.items.map((fileRef) =>
      deleteObject(fileRef),
    );
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error deleting comment image:", error);
    throw error;
  }
};

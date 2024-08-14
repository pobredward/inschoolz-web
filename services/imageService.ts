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
  uid: string,
  type: "post" | "comment" | "profile" | "vote",
  id?: string,
): Promise<string> => {
  const fileExtension = file.name.split(".").pop();
  const fileName = `${uuidv4()}.${fileExtension}`;
  let filePath: string;

  switch (type) {
    case "post":
      if (!id) throw new Error("Post ID is required for uploading post images");
      filePath = `posts/${id}/images/${fileName}`;
      break;
    case "comment":
      if (!id)
        throw new Error("Comment ID is required for uploading comment images");
      filePath = `comments/${id}/image.${fileExtension}`;
      break;
    case "profile":
      filePath = `users/${uid}/profile.${fileExtension}`;
      break;
    case "vote":
      if (!id) throw new Error("Post ID is required for uploading vote images");
      filePath = `posts/${id}/vote_images/${fileName}`;
      break;
    default:
      filePath = `temp/${uid}/${fileName}`;
  }

  const fileRef = ref(storage, filePath);

  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
};

export const deleteImage = async (imageUrl: string): Promise<void> => {
  const imageRef = ref(storage, imageUrl);
  await deleteObject(imageRef);
};

export const deleteUserImages = async (uid: string): Promise<void> => {
  const userProfileRef = ref(storage, `users/${uid}`);

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

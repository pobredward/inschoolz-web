import imageCompression from "browser-image-compression";
import ReactCrop, { Crop } from "react-image-crop";

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB:
      file.size > 4 * 1024 * 1024
        ? file.size / (4 * 1024 * 1024)
        : file.size > 2 * 1024 * 1024
          ? file.size / (2 * 1024 * 1024)
          : 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error("Error compressing image:", error);
    throw error;
  }
}

export const getCroppedImg = (
  image: HTMLImageElement,
  crop: Crop,
): Promise<Blob | null> => {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width!;
  canvas.height = crop.height!;
  const ctx = canvas.getContext("2d");

  ctx!.drawImage(
    image,
    crop.x! * scaleX,
    crop.y! * scaleY,
    crop.width! * scaleX,
    crop.height! * scaleY,
    0,
    0,
    crop.width!,
    crop.height!,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Canvas is empty"));
      }
    }, "image/jpeg");
  });
};

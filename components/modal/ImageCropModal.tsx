import React, { useState, useRef } from "react";
import styled from "@emotion/styled";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { getCroppedImg } from "../../utils/imageUtils";
import { uploadImage, deleteImage } from "../../services/imageService";
import { updateUserProfile } from "../../services/userService";

const ImageCropModal = ({ user, setProfileImageUrl, onClose }) => {
  const [crop, setCrop] = useState<PixelCrop>({
    unit: "px",
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
    }
  };

  const handleImageLoaded = (e: React.SyntheticEvent<HTMLImageElement>) => {
    imageRef.current = e.currentTarget;
  };

  const handleCropComplete = async (crop: PixelCrop) => {
    if (imageRef.current && crop.width && crop.height) {
      const croppedBlob = await getCroppedImg(imageRef.current, crop);
      setCroppedBlob(croppedBlob);
    }
  };

  const handleApplyCrop = async () => {
    if (croppedBlob) {
      const croppedFile = new File([croppedBlob], "cropped-image.jpeg", {
        type: "image/jpeg",
      });
      const imageUrl = await uploadImage(croppedFile, user!.uid, "profile");
      setProfileImageUrl(imageUrl);
      await updateUserProfile(user!.uid, { profileImageUrl: imageUrl });
      onClose(); // 모달 닫기
    }
  };

  const handleResetToDefault = async () => {
    // Firebase Storage에서 이미지 삭제
    if (user?.profileImageUrl) {
      await deleteImage(user.profileImageUrl);
    }
    // Firestore에서 프로필 이미지 URL 제거
    await updateUserProfile(user!.uid, { profileImageUrl: null });
    setProfileImageUrl(null); // 기본 이미지로 설정
    onClose(); // 모달 닫기
  };

  return (
    <ModalOverlay>
      <ModalContent>
        <Title>프로필 사진</Title>
        <FileInputWrapper>
          <FileInputLabel htmlFor="fileInput">사진 선택</FileInputLabel>
          <FileInput
            id="fileInput"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
        </FileInputWrapper>

        {!selectedImage && (
          <ResetButton onClick={handleResetToDefault}>
            기본 이미지로 변경
          </ResetButton>
        )}

        {selectedImage && (
          <>
            <ReactCrop
              crop={crop}
              onChange={(newCrop) => setCrop(newCrop)}
              onComplete={handleCropComplete}
            >
              <img
                src={selectedImage}
                onLoad={handleImageLoaded}
                alt="Crop me"
              />
            </ReactCrop>
          </>
        )}

        <ButtonWrapper>
          <Button onClick={onClose}>닫기</Button>
          {selectedImage && (
            <Button primary onClick={handleApplyCrop}>
              완료
            </Button>
          )}
        </ButtonWrapper>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ImageCropModal;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 10px;
  text-align: center;
  max-width: 500px;
  width: 100%;
`;

const Title = styled.h2`
  margin-bottom: 1rem;
`;

const FileInputWrapper = styled.div`
  margin-bottom: 1rem;
`;

const FileInputLabel = styled.label`
  padding: 0.5rem 1rem;
  background-color: #0070f3;
  color: white;
  border-radius: 4px;
  cursor: pointer;
`;

const FileInput = styled.input`
  display: none;
`;

const ResetButton = styled.button`
  background-color: #f44336;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 1rem;

  &:hover {
    background-color: #d32f2f;
  }
`;

const ButtonWrapper = styled.div`
  margin-top: 1rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
`;

const Button = styled.button<{ primary?: boolean }>`
  padding: 0.5rem 1rem;
  background-color: ${(props) => (props.primary ? "#0070f3" : "#f0f0f0")};
  color: ${(props) => (props.primary ? "white" : "black")};
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: ${(props) => (props.primary ? "#005bb5" : "#e0e0e0")};
  }
`;

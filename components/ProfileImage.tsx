import React, { useState } from "react";
import styled from "@emotion/styled";
import { FaUserCircle, FaCamera } from "react-icons/fa";
import ImageCropModal from "./modal/ImageCropModal";

const ProfileImage = ({ user, profileImageUrl, setProfileImageUrl }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <ProfileImageContainer>
      <ProfileImageWrapper>
        {profileImageUrl ? (
          <ProfileCircle src={profileImageUrl} alt="Profile" />
        ) : (
          <DefaultProfileIcon />
        )}
        <EditIconWrapper onClick={handleOpenModal}>
          <FaCamera />
        </EditIconWrapper>
      </ProfileImageWrapper>
      {isModalOpen && (
        <ImageCropModal
          user={user}
          setProfileImageUrl={setProfileImageUrl}
          onClose={handleCloseModal}
        />
      )}
    </ProfileImageContainer>
  );
};

export default ProfileImage;

const ProfileImageContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const ProfileImageWrapper = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
`;

const ProfileCircle = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background-color: #f0f0f0;
`;

const DefaultProfileIcon = styled(FaUserCircle)`
  width: 100%;
  height: 100%;
  color: #ccc;
`;

const EditIconWrapper = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #0070f3;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  border: 2px solid white;
`;

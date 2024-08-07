import React, { useState } from "react";
import { useRouter } from "next/router";
import { useRecoilState } from "recoil";
import { userState } from "../store/atoms";
import { useAuth } from "../hooks/useAuth";
import styled from "@emotion/styled";
import Layout from "../components/Layout";
import { useUser } from "../hooks/useUser";
import EmailModal from "../components/modal/EmailModal";
import PasswordModal from "../components/modal/PasswordModal";
import SchoolModal from "../components/modal/SchoolModal";
import BirthdayModal from "../components/modal/BirthdayModal";
import AddressModal from "../components/modal/AddressModal";
import PhoneModal from "../components/modal/PhoneModal";

const MyPage: React.FC = () => {
  const [user, setUser] = useRecoilState(userState);
  const { logout } = useAuth();
  const router = useRouter();
  useUser(); // Fetch user data

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [isBirthdayModalOpen, setIsBirthdayModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);

  const closeModal =
    (setModalOpen: React.Dispatch<React.SetStateAction<boolean>>) => () => {
      setModalOpen(false);
    };

  const handleLogout = () => {
    if (window.confirm("정말 로그아웃하시겠습니까?")) {
      logout.mutate(undefined, {
        onSuccess: () => {
          alert("성공적으로 로그아웃이 되었습니다.");
          router.push("/");
        },
        onError: (error) => {
          console.error("Logout error:", error);
          alert("로그아웃 중 오류가 발생했습니다.");
        },
      });
    }
  };

  const calculateNextLevelExperience = (level: number) => {
    return level * 100;
  };

  const calculateExperienceToNextLevel = (
    experience: number,
    level: number,
  ) => {
    return calculateNextLevelExperience(level) - experience;
  };

  const nextLevelExperience = calculateNextLevelExperience(user?.level || 1);
  const experienceToNextLevel = calculateExperienceToNextLevel(
    user?.experience || 0,
    user?.level || 1,
  );

  return (
    <Layout>
      <Container>
        <h1>내 정보</h1>
        <InfoContainer>
          <InfoItem>
            <InfoLabel>이름: </InfoLabel>
            <InfoValue>{user?.name}</InfoValue>
          </InfoItem>
          <Divider />
          <InfoItem>
            <InfoLabel>ID: </InfoLabel>
            <InfoValue>{user?.userId}</InfoValue>
          </InfoItem>
          <Divider />
          <InfoItem>
            <InfoLabel>이메일: </InfoLabel>
            <InfoValue>{user?.email}</InfoValue>
            <Button onClick={() => setIsEmailModalOpen(true)}>변경</Button>
          </InfoItem>
          <Divider />
          <InfoItem>
            <InfoLabel>비밀번호: </InfoLabel>
            <Button onClick={() => setIsPasswordModalOpen(true)}>변경</Button>
          </InfoItem>
          <Divider />
          <InfoItem>
            <InfoLabel>학교: </InfoLabel>
            <InfoValue>{user?.schoolName}</InfoValue>
            <Button onClick={() => setIsSchoolModalOpen(true)}>변경</Button>
          </InfoItem>
          <Divider />
          <InfoItem>
            <InfoLabel>생년월일: </InfoLabel>
            <InfoValue>
              {user?.birthYear}년 {user?.birthMonth}월 {user?.birthDay}일
            </InfoValue>
            <Button onClick={() => setIsBirthdayModalOpen(true)}>변경</Button>
          </InfoItem>
          <Divider />
          <InfoItem>
            <InfoLabel>지역: </InfoLabel>
            <InfoValue>
              {user?.address1} {user?.address2}
            </InfoValue>
            <Button onClick={() => setIsAddressModalOpen(true)}>변경</Button>
          </InfoItem>
          <Divider />
          <InfoItem>
            <InfoLabel>휴대폰 번호: </InfoLabel>
            <InfoValue>{user?.phoneNumber}</InfoValue>
            <Button onClick={() => setIsPhoneModalOpen(true)}>변경</Button>
          </InfoItem>
          <Divider />
          <InfoItem>
            <InfoLabel></InfoLabel>
            <InfoValue>
              <LevelContainer>
                <LevelText>LEVEL {user?.level}</LevelText>
                <ExperienceBarContainer>
                  <ExperienceBarFill
                    style={{
                      width: `${(user?.experience / nextLevelExperience) * 100}%`,
                    }}
                  />
                </ExperienceBarContainer>
                <ExperienceToNextLevel>
                  다음 레벨까지 {experienceToNextLevel} 경험치 남음
                </ExperienceToNextLevel>
              </LevelContainer>
            </InfoValue>
          </InfoItem>
        </InfoContainer>
        <LogoutButton onClick={handleLogout}>로그아웃</LogoutButton>
      </Container>

      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={closeModal(setIsEmailModalOpen)}
        user={user}
        setUser={setUser}
      />
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={closeModal(setIsPasswordModalOpen)}
        user={user}
      />
      <SchoolModal
        isOpen={isSchoolModalOpen}
        onClose={closeModal(setIsSchoolModalOpen)}
        user={user}
        setUser={setUser}
      />
      <BirthdayModal
        isOpen={isBirthdayModalOpen}
        onClose={closeModal(setIsBirthdayModalOpen)}
        user={user}
        setUser={setUser}
      />
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={closeModal(setIsAddressModalOpen)}
        user={user}
        setUser={setUser}
      />
      <PhoneModal
        isOpen={isPhoneModalOpen}
        onClose={closeModal(setIsPhoneModalOpen)}
        user={user}
        setUser={setUser}
      />
    </Layout>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 600px;
  margin: 2rem auto;
  padding: 1rem;
  background-color: #fff;
  /* border-radius: 4px; */
  /* box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); */
  border: none; /* 테두리 제거 */
`;

const InfoContainer = styled.div`
  width: 100%;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const InfoLabel = styled.span`
  font-weight: bold;
`;

const InfoValue = styled.span`
  flex: 1;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #ccc;
  margin: 1rem 0;
`;

const Button = styled.button<{ secondary?: boolean }>`
  margin-left: 1rem;
  padding: 0.5rem 1rem;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: bold;

  &:hover {
    background-color: #0056b3;
  }
`;

const LogoutButton = styled(Button)`
  margin-top: 1rem;
  background-color: #dc3545;

  &:hover {
    background-color: #c82333;
  }
`;

const LevelContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const LevelText = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
`;

const ExperienceBarContainer = styled.div`
  width: 100%;
  height: 20px;
  background-color: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  margin: 0.5rem 0;
`;

const ExperienceBarFill = styled.div`
  height: 100%;
  background-color: #0070f3;
  border-radius: 10px;
`;

const ExperienceToNextLevel = styled.div`
  font-size: 0.875rem;
  color: #555;
`;

export default MyPage;

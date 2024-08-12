import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useRecoilState } from "recoil";
import { userState, User, Post } from "../../store/atoms";
import styled from "@emotion/styled";
import Layout from "../../components/Layout";
import { useAuthStateManager } from "../../hooks/useAuthStateManager";
import { deleteUser, updateUserProfile } from "../../services/userService";
import ConfirmModal from "../../components/modal/ConfirmModal";
import SchoolSearch from "../../components/SchoolSearch";
import AddressSelector from "../../components/AddressSelector";
import { useMutation, useQuery } from "react-query";
import { auth } from "../../lib/firebase";
import { errorMessages } from "../../utils/errorMessages";
import { FaFileAlt, FaComments, FaBookmark } from "react-icons/fa";
import { fetchUserScraps } from "../../services/postService";

const MyPage: React.FC = () => {
  const [user, setUser] = useRecoilState(userState);
  const router = useRouter();
  const { updateUserState } = useAuthStateManager();

  const [editedUser, setEditedUser] = useState(user);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [scrappedPosts, setScrappedPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserScraps(user.uid).then(setScrappedPosts);
    }
  }, [user]);

  const { data: fetchedUser, isLoading } = useQuery(
    "user",
    () => updateUserState(auth.currentUser),
    {
      enabled: !!user,
      onSuccess: (data) => {
        setUser(data);
        setEditedUser(data);
      },
    },
  );

  const updateProfileMutation = useMutation(
    (updatedData: Partial<User>) => updateUserProfile(user!.uid, updatedData),
    {
      onSuccess: async () => {
        const updatedUser = await updateUserState(auth.currentUser);
        setUser(updatedUser);
        setIsEditing(false);
        alert("프로필이 성공적으로 업데이트되었습니다.");
      },
      onError: (error: Error) => {
        alert(errorMessages.PROFILE_UPDATE_ERROR);
      },
    },
  );

  const deleteAccountMutation = useMutation(() => deleteUser(user!.uid), {
    onSuccess: () => {
      alert("계정이 성공적으로 삭제되었습니다.");
      router.push("/");
    },
    onError: (error: Error) => {
      alert(errorMessages.ACCOUNT_DELETE_ERROR);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedUser((prev) => ({ ...prev!, [name]: value }));
  };

  const handleSchoolChange = (school: any) => {
    setEditedUser((prev) => ({
      ...prev!,
      schoolId: school.SCHOOL_CODE,
      schoolName: school.KOR_NAME,
    }));
  };

  const handleAddressChange = (address1: string, address2: string) => {
    setEditedUser((prev) => ({ ...prev!, address1, address2 }));
  };

  const handleSave = () => {
    if (editedUser && user) {
      updateProfileMutation.mutate(editedUser);
    }
  };

  const handleDeleteAccount = () => {
    if (user) {
      deleteAccountMutation.mutate();
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user || !editedUser) {
    return <div>사용자 정보를 불러올 수 없습니다.</div>;
  }

  return (
    <Layout>
      <Container>
        <Section>
          <SectionTitle>내 활동</SectionTitle>
          <ActivityContainer>
            <ActivityBox onClick={() => router.push("/mypage/posts")}>
              <IconWrapper>
                <FaFileAlt />
              </IconWrapper>
              <ActivityText>내 게시글</ActivityText>
            </ActivityBox>
            <ActivityBox onClick={() => router.push("/mypage/comments")}>
              <IconWrapper>
                <FaComments />
              </IconWrapper>
              <ActivityText>내 댓글</ActivityText>
            </ActivityBox>
            <ActivityBox onClick={() => router.push("/mypage/scraps")}>
              <IconWrapper>
                <FaBookmark />
              </IconWrapper>
              <ActivityText>스크랩</ActivityText>
            </ActivityBox>
          </ActivityContainer>
        </Section>

        <Section>
          <SectionTitle>내 경험치</SectionTitle>
          <ExperienceContainer>
            <LevelInfo>LEVEL {user.level}</LevelInfo>
            <ExperienceBar>
              <ExperienceFill
                width={(user.experience / (user.level * 10)) * 100}
              />
            </ExperienceBar>
            <ExperienceInfo>
              {user.experience} / {user.level * 10} XP
            </ExperienceInfo>
          </ExperienceContainer>
        </Section>

        <Section>
          <SectionTitle>내 정보</SectionTitle>
          {isEditing ? (
            <Form>
              <FormGroup>
                <Label htmlFor="name">이름</Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={editedUser.name}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="userId">아이디</Label>
                <Input
                  type="text"
                  id="userId"
                  name="userId"
                  value={editedUser.userId}
                  readOnly
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="email">이메일</Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={editedUser.email || ""}
                  readOnly
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="phoneNumber">휴대폰 번호</Label>
                <Input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={editedUser.phoneNumber}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>주소</Label>
                <AddressSelector
                  address1={editedUser.address1 || ""}
                  address2={editedUser.address2 || ""}
                  setAddress1={(value) =>
                    handleAddressChange(value, editedUser.address2 || "")
                  }
                  setAddress2={(value) =>
                    handleAddressChange(editedUser.address1 || "", value)
                  }
                />
              </FormGroup>
              <FormGroup>
                <Label>학교</Label>
                <SchoolSearch
                  address1={editedUser.address1 || ""}
                  address2={editedUser.address2 || ""}
                  setSchool={handleSchoolChange}
                />
              </FormGroup>
              <FormGroup>
                <Label>생년월일</Label>
                <BirthDateContainer>
                  <BirthInput
                    type="number"
                    name="birthYear"
                    value={editedUser.birthYear}
                    onChange={handleInputChange}
                    placeholder="년"
                    required
                  />
                  <BirthInput
                    type="number"
                    name="birthMonth"
                    value={editedUser.birthMonth}
                    onChange={handleInputChange}
                    placeholder="월"
                    required
                  />
                  <BirthInput
                    type="number"
                    name="birthDay"
                    value={editedUser.birthDay}
                    onChange={handleInputChange}
                    placeholder="일"
                    required
                  />
                </BirthDateContainer>
              </FormGroup>
              <ButtonContainer>
                <ConfirmButton
                  onClick={handleSave}
                  disabled={updateProfileMutation.isLoading}
                >
                  {updateProfileMutation.isLoading ? "저장 중..." : "완료"}
                </ConfirmButton>
                <CancelButton onClick={() => setIsEditing(false)}>
                  취소
                </CancelButton>
              </ButtonContainer>
            </Form>
          ) : (
            <InfoContainer>
              <InfoItem>
                <InfoLabel>이름:</InfoLabel>
                <InfoValue>{user.name}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>아이디:</InfoLabel>
                <InfoValue>{user.userId}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>이메일:</InfoLabel>
                <InfoValue>{user.email}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>휴대폰 번호:</InfoLabel>
                <InfoValue>{user.phoneNumber}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>주소:</InfoLabel>
                <InfoValue>
                  {user.address1} {user.address2}
                </InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>학교:</InfoLabel>
                <InfoValue>{user.schoolName}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>생년월일:</InfoLabel>
                <InfoValue>
                  {user.birthYear}년 {user.birthMonth}월 {user.birthDay}일
                </InfoValue>
              </InfoItem>
              <ButtonContainer>
                <EditButton onClick={() => setIsEditing(true)}>수정</EditButton>
                <DeleteButton onClick={() => setIsDeleteModalOpen(true)}>
                  회원 탈퇴
                </DeleteButton>
              </ButtonContainer>
            </InfoContainer>
          )}
        </Section>
      </Container>
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="회원 탈퇴 확인"
        message="정말로 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다."
      />
    </Layout>
  );
};

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;

  @media (max-width: 768px) {
    padding: 0.5rem;
  }
`;

const Section = styled.section`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  margin-bottom: 1rem;
`;

const ActivityContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
`;

const ActivityBox = styled.div`
  flex: 1;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #f0f0f0;
  }
`;

const ActivityText = styled.p`
  font-size: 14px;
  /* font-weight: semi-bold; */
  margin: 0;
`;

const IconWrapper = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const ExperienceContainer = styled.div`
  margin-top: 1rem;
`;

const LevelInfo = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
`;

const ExperienceBar = styled.div`
  width: 100%;
  height: 20px;
  background-color: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
`;

const ExperienceFill = styled.div<{ width: number }>`
  width: ${(props) => props.width}%;
  height: 100%;
  background-color: #0070f3;
`;

const ExperienceInfo = styled.div`
  margin-top: 0.5rem;
  text-align: right;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 0.5rem;
  font-weight: bold;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const BirthDateContainer = styled.div`
  display: flex;
  gap: 0.5rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const BirthInput = styled(Input)`
  flex: 1;

  @media (max-width: 768px) {
    width: 90%;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  background-color: #0070f3;
  color: white;

  &:hover {
    background-color: #0056b3;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const EditButton = styled(Button)`
  background-color: var(--edit-button);
`;

const ConfirmButton = styled(Button)`
  background-color: var(--primary-button);

  &:hover {
    background-color: var(--primary-hover);
  }
`;

const CancelButton = styled(Button)`
  background-color: var(--gray-button);

  &:hover {
    background-color: var(--gray-hover);
  }
`;

const DeleteButton = styled(Button)`
  background-color: var(--delete-button);

  &:hover {
    background-color: var(--delete-hover);
  }
`;

const InfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;

  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

const InfoLabel = styled.span`
  font-weight: bold;
  width: 120px;
  margin-bottom: 0.25rem;

  @media (min-width: 768px) {
    margin-bottom: 0;
  }
`;

const InfoValue = styled.span`
  flex: 1;
`;

export default MyPage;

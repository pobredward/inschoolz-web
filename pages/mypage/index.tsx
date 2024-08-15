import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useRecoilState } from "recoil";
import { userState, User, Post } from "../../store/atoms";
import styled from "@emotion/styled";
import Layout from "../../components/Layout";
import { useMutation, useQuery } from "react-query";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { updateUserProfile, deleteUser } from "../../services/userService";
import ConfirmModal from "../../components/modal/ConfirmModal";
import PasswordConfirmModal from "../../components/modal/PasswordConfirmModal";
import SchoolSearch from "../../components/SchoolSearch";
import AddressSelector from "../../components/AddressSelector";
import { fetchUserScraps } from "../../services/postService";
import { errorMessages } from "../../utils/errorMessages";
import { FaFileAlt, FaComments, FaBookmark } from "react-icons/fa";

const MyPage: React.FC = () => {
  const [user, setUser] = useRecoilState(userState);
  const router = useRouter();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [editedUser, setEditedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [scrappedPosts, setScrappedPosts] = useState<Post[]>([]);
  const [initialSchool, setInitialSchool] = useState<
    { id: string; KOR_NAME: string; ADDRESS: string } | undefined
  >(undefined);

  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user) {
      setEditedUser(user); // 초기화
      fetchUserScraps(user.uid).then(setScrappedPosts);
    }
  }, [user]);

  useEffect(() => {
    const fetchSchoolData = async () => {
      if (user?.schoolId) {
        try {
          const schoolDoc = await getDoc(doc(db, "schools", user.schoolId));
          if (schoolDoc.exists()) {
            const schoolData = schoolDoc.data();
            setInitialSchool({
              id: schoolDoc.id,
              KOR_NAME: schoolData.KOR_NAME,
              ADDRESS: schoolData.ADDRESS,
            });
          }
        } catch (error) {
          console.error("Error fetching school data:", error);
        }
      }
    };

    if (user) {
      fetchSchoolData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (auth.currentUser) {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      } else {
        throw new Error(errorMessages.USER_NOT_FOUND);
      }
    }
    return null;
  };

  const fetchUserMutation = useMutation(fetchUserData, {
    onSuccess: (data) => {
      if (data) {
        setEditedUser(data);
        setIsEditing(true);
      }
    },
    onError: () => {
      alert("사용자 정보를 불러오는 중 오류가 발생했습니다.");
    },
  });

  const updateProfileMutation = useMutation(
    (updatedData: Partial<User>) => updateUserProfile(user!.uid, updatedData),
    {
      onSuccess: async () => {
        const updatedUser = await fetchUserData();
        if (updatedUser) {
          setUser(updatedUser);
          setEditedUser(updatedUser);
          setIsEditing(false);
          alert("프로필이 성공적으로 업데이트되었습니다.");
        }
      },
      onError: () => {
        alert(errorMessages.PROFILE_UPDATE_ERROR);
      },
    },
  );

  const deleteAccountMutation = useMutation(
    () => deleteUser(user!.uid, password),
    {
      onSuccess: () => {
        setUser(null);
        router.push("/");
      },
      onError: (error) => {
        console.error("Error deleting account:", error);
        alert("계정 삭제 중 오류가 발생했습니다. 다시 로그인 후 시도해주세요.");
      },
    },
  );

  const handleDeleteButtonClick = () => {
    setIsPasswordModalOpen(true);
  };

  const handlePasswordConfirm = () => {
    if (!password) {
      alert("비밀번호를 입력해주세요.");
      return;
    }
    setIsPasswordModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAccount = () => {
    deleteAccountMutation.mutate();
    setIsDeleteModalOpen(false);
  };

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault(); // 폼 제출을 방지

    if (editedUser && user) {
      updateProfileMutation.mutate(editedUser);
    }
  };

  const handleEditButtonClick = () => {
    fetchUserMutation.mutate(); // 서버에서 최신 사용자 데이터를 가져옴
  };

  if (!user) {
    return (
      <Layout>
        <div>사용자 정보를 불러올 수 없습니다.</div>
      </Layout>
    );
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
          <ExperienceContainer>
            <LevelInfo>LV.{user.level}</LevelInfo>
            <ExperienceBar>
              <ExperienceFill
                width={(user.experience / (user.level * 10)) * 100}
              />
            </ExperienceBar>
            <ExperienceInfo>
              {Math.round((user.experience / user.level) * 10)}%
            </ExperienceInfo>
          </ExperienceContainer>
        </Section>

        <Section>
          <SectionTitle>내 정보</SectionTitle>
          {isEditing ? (
            <Form onSubmit={handleSave}>
              <FormGroup>
                <Label htmlFor="name">이름</Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={editedUser?.name || ""}
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
                  value={editedUser?.userId || ""}
                  readOnly
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="email">이메일</Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={editedUser?.email || ""}
                  readOnly
                />
              </FormGroup>
              {/* <FormGroup>
                <Label htmlFor="phoneNumber">휴대폰 번호</Label>
                <Input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={editedUser?.phoneNumber || ""}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup> */}
              <FormGroup>
                <Label>주소</Label>
                <AddressSelector
                  address1={editedUser?.address1 || ""}
                  address2={editedUser?.address2 || ""}
                  setAddress1={(value) =>
                    handleAddressChange(value, editedUser?.address2 || "")
                  }
                  setAddress2={(value) =>
                    handleAddressChange(editedUser?.address1 || "", value)
                  }
                />
              </FormGroup>
              <FormGroup>
                <Label>학교</Label>
                <SchoolSearch
                  initialSchool={initialSchool}
                  setSchool={handleSchoolChange}
                />
              </FormGroup>
              <FormGroup>
                <Label>생년월일</Label>
                <BirthDateContainer>
                  <BirthInput
                    type="number"
                    name="birthYear"
                    value={editedUser?.birthYear || ""}
                    onChange={handleInputChange}
                    placeholder="년"
                    required
                  />
                  <BirthInput
                    type="number"
                    name="birthMonth"
                    value={editedUser?.birthMonth || ""}
                    onChange={handleInputChange}
                    placeholder="월"
                    required
                  />
                  <BirthInput
                    type="number"
                    name="birthDay"
                    value={editedUser?.birthDay || ""}
                    onChange={handleInputChange}
                    placeholder="일"
                    required
                  />
                </BirthDateContainer>
              </FormGroup>
              <ButtonContainer>
                <CancelButton onClick={() => setIsEditing(false)}>
                  취소
                </CancelButton>
                <ConfirmButton
                  type="submit"
                  disabled={updateProfileMutation.isLoading}
                >
                  {updateProfileMutation.isLoading ? "저장 중..." : "완료"}
                </ConfirmButton>
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
                <DeleteButton onClick={handleDeleteButtonClick}>
                  회원 탈퇴
                </DeleteButton>
                <EditButton onClick={handleEditButtonClick}>수정</EditButton>
              </ButtonContainer>
            </InfoContainer>
          )}
        </Section>
      </Container>
      <PasswordConfirmModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onConfirm={handlePasswordConfirm}
        title="비밀번호 확인"
      >
        <Input
          type="password"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </PasswordConfirmModal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteAccount}
        title="회원 탈퇴 확인"
        message="정말로 탈퇴하시겠습니까? 게시글, 댓글, 게임 기록 등 모든 데이터가 삭제되고 복구할 수 없습니다."
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
  width: ${(props) => `${Math.max(0, Math.min(100, props.width))}%`};
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

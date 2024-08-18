import React, { useState, useEffect, useRef } from "react";
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
import {
  FaFileAlt,
  FaComments,
  FaBookmark,
  FaUserEdit,
  FaTrashAlt,
  FaChevronRight,
} from "react-icons/fa";
import ProfileImage from "../../components/ProfileImage";
import AttendanceCheck from "../../components/AttandanceCheck";

const MyPage: React.FC = () => {
  const [user, setUser] = useRecoilState(userState);
  const router = useRouter();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editedUser, setEditedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [scrappedPosts, setScrappedPosts] = useState<Post[]>([]);
  const [initialSchool, setInitialSchool] = useState<
    { id: string; KOR_NAME: string; ADDRESS: string } | undefined
  >(undefined);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(
    user?.profileImageUrl || null,
  );

  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user) {
      setEditedUser(user);
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

  const handleEditButtonClick = () => {
    router.push("/mypage/edit"); // "내 정보 수정" 페이지로 이동
  };

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

  const handleAddressChange = (
    field: "address1" | "address2",
    value: string,
  ) => {
    setEditedUser((prevState) => ({
      ...prevState!,
      [field]: value,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault(); // 폼 제출을 방지

    if (editedUser && user) {
      updateProfileMutation.mutate(editedUser);
    }
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
          <ProfileContainer>
            <UserInfo>
              <UserName>{user.name}님, 환영합니다</UserName>
              <UserId>@{user.userId}</UserId>
              <SchoolInfo>
                {user.schoolName} | {user.address1} {user.address2}
              </SchoolInfo>
            </UserInfo>
            <ProfileImage
              user={user}
              profileImageUrl={profileImageUrl}
              setProfileImageUrl={setProfileImageUrl}
            />
          </ProfileContainer>

          <ExperienceContainer>
            <LevelInfo>LV.{user.level}</LevelInfo>
            <ExperienceBar>
              <ExperienceFill
                width={(user.experience / (user.level * 10)) * 100}
              />
            </ExperienceBar>
            <ExperienceInfo width={(user.experience / (user.level * 10)) * 100}>
              {Math.round((user.experience / user.level) * 10)}%
            </ExperienceInfo>
          </ExperienceContainer>
        </Section>

        <Section>
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
          <AttendanceCheck />
        </Section>

        <Section>
          <Field onClick={handleEditButtonClick}>
            <LeftContent>
              <FaUserEdit />
              <Text>내 정보 수정</Text>
            </LeftContent>
            <RightContent>
              <FaChevronRight />
            </RightContent>
          </Field>
          <Field onClick={handleDeleteButtonClick}>
            <LeftContent>
              <FaTrashAlt />
              <Text>회원 탈퇴</Text>
            </LeftContent>
            <RightContent>
              <FaChevronRight />
            </RightContent>
          </Field>
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

const ExperienceContainer = styled.div`
  position: relative;
  margin-bottom: 20px;
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
  background-color: var(--primary-button);
  position: relative;
`;

const ExperienceInfo = styled.div`
  position: absolute;
  top: 65px; /* ExperienceFill 바로 아래 */
  left: ${(props: { width: number }) =>
    `calc(${props.width}% - 15px)`}; /* ExperienceFill의 끝지점 아래 */
  background-color: #fff;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  text-align: center;
  white-space: nowrap;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.4);
  font-weight: bold;

  &::before {
    content: "";
    position: absolute;
    top: -6px; /* ExperienceInfo 박스와 연결되는 화살표 */
    left: calc(50% - 5px);
    border-width: 0 5px 6px 5px;
    border-style: solid;
    border-color: transparent transparent #fff transparent;
  }
`;

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;

  @media (max-width: 768px) {
    padding: 0.5rem;
  }
`;

const Section = styled.section`
  margin-bottom: 1rem;
  padding-bottom: 1rem;
`;

const ProfileContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const UserName = styled.h1`
  font-size: 1.2rem;
  margin: 0;
`;

const UserId = styled.span`
  font-size: 0.875rem;
  color: #555;
`;

const SchoolInfo = styled.span`
  font-size: 0.75rem;
  color: #888;
`;

const ActivityContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
`;

const ActivityBox = styled.div`
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
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
  font-weight: bold;
  margin: 0;
`;

const IconWrapper = styled.div`
  font-size: 1.2rem;
  margin-bottom: 0.3rem;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Field = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  cursor: pointer;
  margin-bottom: 1rem;

  &:hover {
    background-color: #f7f7f7;
  }
`;

const LeftContent = styled.div`
  display: flex;
  align-items: center;
`;

const Text = styled.span`
  margin-left: 8px;
  font-size: 16px;
`;

const RightContent = styled.div`
  color: #aaa;
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

export default MyPage;

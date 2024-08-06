import React, { useEffect } from "react";
import Link from "next/link";
import styled from "@emotion/styled";
import { useRecoilState } from "recoil";
import { userState } from "../store/atoms";
import { useAuth } from "../hooks/useAuth";
import { useUser } from "../hooks/useUser";

const Navbar: React.FC = () => {
  const { user } = useAuth();
  const [currentUser, setCurrentUser] = useRecoilState(userState);

  // Fetch user data on mount
  const { data: fetchedUser } = useUser();

  useEffect(() => {
    if (fetchedUser) {
      setCurrentUser(fetchedUser);
    }
  }, [fetchedUser, setCurrentUser]);

  const calculateNextLevelExperience = (level: number) => {
    return level * 100;
  };

  const nextLevelExperience = calculateNextLevelExperience(
    currentUser?.level || 1,
  );
  const experienceProgress =
    (((currentUser?.experience || 0) % nextLevelExperience) /
      nextLevelExperience) *
    100;

  return (
    <Nav>
      <Container>
        <Logo href="/">인스쿨즈</Logo>
        <NavLinks>
          <Link href="/community/school-free">커뮤니티</Link>
          <Link href="/game">미니게임</Link>
        </NavLinks>
        <AccountWrapper>
          {currentUser && (
            <UserInfo>
              <LevelText>LEVEL {currentUser?.level}</LevelText>
              <ExperienceBarContainer>
                <ExperienceBarFill
                  style={{ width: `${experienceProgress}%` }}
                />
              </ExperienceBarContainer>
            </UserInfo>
          )}
          {user ? (
            <Link href="/mypage">
              <MyPageButton>내 정보</MyPageButton>
            </Link>
          ) : (
            <Link href="/login">로그인</Link>
          )}
        </AccountWrapper>
      </Container>
    </Nav>
  );
};

const Nav = styled.nav`
  background-color: #f8f9fa;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  width: 100%;
  box-sizing: border-box;
`;

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  box-sizing: border-box;
`;

const Logo = styled.a`
  font-weight: bold;
  font-size: 1.5rem;
  color: #333;
  text-decoration: none;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 1rem;

  a {
    text-decoration: none;
    color: #333;
    font-weight: bold;

    &:hover {
      color: #0070f3;
    }
  }
`;

const AccountWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem; /* Adjust this value to control spacing between elements */
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const LevelText = styled.div`
  font-size: 1rem;
  font-weight: bold;
`;

const ExperienceBarContainer = styled.div`
  width: 100px;
  height: 10px;
  background-color: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
  margin: 0.5rem 0;
`;

const ExperienceBarFill = styled.div`
  height: 100%;
  background-color: #0070f3;
  border-radius: 5px;
`;

const MyPageButton = styled.a`
  padding: 0.5rem 1rem;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  text-decoration: none;

  &:hover {
    background-color: #0056b3;
  }
`;

export default Navbar;

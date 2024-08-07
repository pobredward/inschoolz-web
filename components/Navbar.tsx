import React, { useEffect, useState } from "react";
import Link from "next/link";
import styled from "@emotion/styled";
import { useRecoilState } from "recoil";
import { userState } from "../store/atoms";
import { useAuth } from "../hooks/useAuth";
import { useUser } from "../hooks/useUser";
import { FiMenu, FiUser } from "react-icons/fi"; // 햄버거 메뉴와 프로필 아이콘 추가

const Navbar: React.FC = () => {
  const { user } = useAuth();
  const [currentUser, setCurrentUser] = useRecoilState(userState);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <Nav>
      <Container>
        <HamburgerMenu onClick={toggleMenu}>
          <FiMenu size={24} />
        </HamburgerMenu>
        <Logo href="/">인스쿨즈</Logo>
        <NavLinks isOpen={isMenuOpen}>
          <Link href="/community/school-free">커뮤니티</Link>
          <Link href="/game">미니게임</Link>
        </NavLinks>
        <AccountWrapper>
          {currentUser ? (
            <>
              <UserInfo>
                <LevelText>LV. {currentUser?.level}</LevelText>
              </UserInfo>
              <ProfileIcon href="/mypage">
                <FiUser size={24} />
              </ProfileIcon>
            </>
          ) : (
            <LoginLink href="/login">로그인</LoginLink>
          )}
        </AccountWrapper>
      </Container>
    </Nav>
  );
};

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  box-sizing: border-box;

  @media (max-width: 768px) {
    justify-content: flex-start;
  }
`;

const Logo = styled.a`
  font-weight: bold;
  font-size: 1.5rem;
  color: #333;
  text-decoration: none;
`;

const NavLinks = styled.div<{ isOpen: boolean }>`
  display: flex;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    position: absolute;
    top: 3.5rem;
    left: 0;
    background: white;
    width: 100%;
    display: ${(props) => (props.isOpen ? "block" : "none")};
    padding: 1rem 0;

    a {
      padding: 0.5rem 1rem;
      display: block;
    }
  }

  a {
    text-decoration: none;
    color: #333;
    font-weight: bold;

    &:hover {
      color: #0070f3;
    }
  }
`;

const HamburgerMenu = styled.div`
  display: none;
  cursor: pointer;

  @media (max-width: 768px) {
    display: block;
    margin-right: 1rem;
  }
`;

const AccountWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 768px) {
    position: absolute;
    right: 1rem;
    top: 1rem;
  }
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

const ProfileIcon = styled.a`
  display: flex;
  align-items: center;
  color: #333;
  text-decoration: none;

  &:hover {
    color: #0070f3;
  }
`;

const LoginLink = styled.a`
  display: flex;
  align-items: center;
  color: #333;
  text-decoration: none;
  font-weight: bold;

  &:hover {
    color: #0070f3;
  }
`;

const Nav = styled.nav`
  background-color: #f8f9fa;
  padding: 0.5rem 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 60px; // Navbar의 높이를 명시적으로 설정
`;

export default Navbar;

import React, { useEffect, useState } from "react";
import Link from "next/link";
import styled from "@emotion/styled";
import { useRecoilState } from "recoil";
import { userState } from "../store/atoms";
import { useAuth } from "../hooks/useAuth";
import { useUser } from "../hooks/useUser";
import { useLogout } from "../hooks/useLogout";
import { FiMenu, FiUser } from "react-icons/fi";
import { useRouter } from "next/router";

const Navbar: React.FC = () => {
  const { user } = useAuth();
  const [currentUser, setCurrentUser] = useRecoilState(userState);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const logout = useLogout();
  const router = useRouter();

  // Fetch user data on mount
  const { data: fetchedUser } = useUser();

  useEffect(() => {
    if (fetchedUser) {
      setCurrentUser(fetchedUser);
    }
  }, [fetchedUser, setCurrentUser]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const calculateNextLevelExperience = (level: number) => {
    return level * 100;
  };

  const calculateExperiencePercentage = (experience: number, level: number) => {
    const nextLevelExperience = calculateNextLevelExperience(level);
    return (experience / nextLevelExperience) * 100;
  };

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        setCurrentUser(null); // 사용자 상태 초기화
        setIsDropdownOpen(false); // 드롭다운 메뉴 닫기
        router.push("/"); // 홈페이지로 리다이렉트
      },
      onError: (error) => {
        console.error("Logout error:", error);
        alert("로그아웃 중 오류가 발생했습니다.");
      },
    });
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
                <LevelText>레벨: {currentUser?.level}</LevelText>
                <ExperienceBar>
                  <ExperienceFill
                    width={calculateExperiencePercentage(
                      currentUser.experience,
                      currentUser.level,
                    )}
                  />
                </ExperienceBar>
              </UserInfo>
              <ProfileIcon onClick={toggleDropdown}>
                <FiUser size={24} />
              </ProfileIcon>
              {isDropdownOpen && (
                <Dropdown>
                  <DropdownLink href="/mypage">내 정보</DropdownLink>
                  <DropdownButton onClick={handleLogout}>
                    로그아웃
                  </DropdownButton>
                </Dropdown>
              )}
            </>
          ) : (
            <>
              <UserInfo>
                <LevelText>레벨: 0</LevelText>
              </UserInfo>
              <ProfileIcon onClick={toggleDropdown}>
                <FiUser size={24} />
              </ProfileIcon>
              {isDropdownOpen && (
                <Dropdown>
                  <DropdownLink href="/login">로그인</DropdownLink>
                  <DropdownLink href="/signup">회원가입</DropdownLink>
                </Dropdown>
              )}
            </>
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
  position: relative;
  display: flex;
  align-items: center;

  @media (max-width: 768px) {
    position: absolute;
    right: 1rem;
    top: 1rem;
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 150px; // 드롭다운 메뉴의 최소 너비 설정
  margin-top: 0.5rem; // 프로필 아이콘과의 간격
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
  margin-left: 10px;

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

const DropdownLink = styled(Link)`
  display: block;
  padding: 10px 15px;
  color: #333;
  text-decoration: none;
  &:hover {
    background-color: #f5f5f5;
  }
`;

const DropdownButton = styled.button`
  display: block;
  width: 100%;
  padding: 10px 15px;
  color: #333;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  &:hover {
    background-color: #f5f5f5;
  }
`;

const ExperienceBar = styled.div`
  width: 50px;
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 4px;
`;

const ExperienceFill = styled.div<{ width: number }>`
  width: ${(props) => props.width}%;
  height: 100%;
  background-color: #4caf50;
`;

export default Navbar;

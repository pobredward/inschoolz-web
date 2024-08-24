import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import styled from "@emotion/styled";
import { useRecoilState, useRecoilValue } from "recoil";
import { userState } from "../store/atoms";
import { useUser } from "../hooks/useUser";
import { useLogout } from "../hooks/useLogout";
import { FiUser } from "react-icons/fi";
import {
  FaHome,
  FaComments,
  FaGamepad,
  FaTrophy,
  FaUser,
} from "react-icons/fa";
import { useRouter } from "next/router";
import { userExperienceState, userLevelState } from "../store/atoms";

const Navbar: React.FC = () => {
  const [currentUser, setCurrentUser] = useRecoilState(userState);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [logoSrc, setLogoSrc] = useState("/logo_1170x730.png");
  const logout = useLogout();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userExperience = useRecoilValue(userExperienceState);
  const userLevel = useRecoilValue(userLevelState);

  const { data: fetchedUser } = useUser();

  useEffect(() => {
    if (fetchedUser) {
      setCurrentUser(fetchedUser);
    }
  }, [fetchedUser, setCurrentUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setLogoSrc("/logo_240x240.png");
      } else {
        setLogoSrc("/logo_1170x730.png");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const calculateExperiencePercentage = (experience: number, level: number) => {
    const nextLevelExperience = level * 10;
    return (experience / nextLevelExperience) * 100;
  };

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        setCurrentUser(null);
        setIsDropdownOpen(false);
        router.push("/");
      },
      onError: (error) => {
        console.error("Logout error:", error);
        alert("로그아웃 중 오류가 발생했습니다.");
      },
    });
  };

  const getPageTitle = () => {
    const path = router.pathname;
    if (path === "/") return "홈";
    if (path.startsWith("/community")) return "커뮤니티";
    if (path.startsWith("/posts")) return "커뮤니티";
    if (path.startsWith("/game")) return "미니게임";
    if (path.startsWith("/ranking")) return "랭킹";
    if (path.startsWith("/mypage")) return "마이페이지";
    return "";
  };

  return (
    <>
      <Nav>
        <Container>
          <LeftSection>
            <LogoWrapper href="/">
              <LogoContainer>
                <Image
                  src={logoSrc}
                  alt="인스쿨즈 로고"
                  layout="fill"
                  objectFit="cover"
                  objectPosition="center"
                />
              </LogoContainer>
            </LogoWrapper>
            <DesktopMenu>
              <MenuLink href="/">홈</MenuLink>
              <MenuLink href="/community/national-free">커뮤니티</MenuLink>
              <MenuLink href="/game">미니게임</MenuLink>
              <MenuLink href="/ranking">랭킹</MenuLink>
              <MenuLink href="/mypage">내정보</MenuLink>
            </DesktopMenu>
          </LeftSection>
          <PageTitle>{getPageTitle()}</PageTitle>
          <UserSection>
            {currentUser && (
              <UserInfo>
                <LevelText>Lv.{userLevel}</LevelText>
                <ExperienceBar>
                  <ExperienceFill
                    width={calculateExperiencePercentage(
                      userExperience,
                      userLevel,
                    )}
                  />
                </ExperienceBar>
              </UserInfo>
            )}
            <ProfileIconWrapper>
              <ProfileIcon onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <FiUser size={24} />
              </ProfileIcon>
              <Dropdown ref={dropdownRef} isOpen={isDropdownOpen}>
                {currentUser ? (
                  <>
                    <DropdownLink href="/mypage">내 정보</DropdownLink>
                    <DropdownButton onClick={handleLogout}>
                      로그아웃
                    </DropdownButton>
                  </>
                ) : (
                  <>
                    <DropdownLink href="/login">로그인</DropdownLink>
                    <DropdownLink href="/signup">회원가입</DropdownLink>
                  </>
                )}
              </Dropdown>
            </ProfileIconWrapper>
          </UserSection>
        </Container>
      </Nav>
      <BottomNav>
        <BottomNavLink href="/" active={router.pathname === "/"}>
          <FaHome />
          <span>홈</span>
        </BottomNavLink>
        <BottomNavLink
          href="/community/national-free"
          active={router.pathname.startsWith("/community")}
        >
          <FaComments />
          <span>커뮤니티</span>
        </BottomNavLink>
        <BottomNavLink
          href="/game"
          active={router.pathname.startsWith("/game")}
        >
          <FaGamepad />
          <span>미니게임</span>
        </BottomNavLink>
        <BottomNavLink
          href="/ranking"
          active={router.pathname.startsWith("/ranking")}
        >
          <FaTrophy />
          <span>랭킹</span>
        </BottomNavLink>
        <BottomNavLink
          href="/mypage"
          active={router.pathname.startsWith("/mypage")}
        >
          <FaUser />
          <span>내 정보</span>
        </BottomNavLink>
      </BottomNav>
    </>
  );
};

const Nav = styled.nav`
  background-color: white;
  padding: 0rem 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 60px;

  @media (max-width: 768px) {
    height: 50px;
  }
`;

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
`;

const LogoWrapper = styled(Link)`
  display: flex;
  align-items: center;
`;

const LogoContainer = styled.div`
  position: relative;
  width: 117px;
  height: 37px;
  overflow: hidden;

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
  }
`;

const DesktopMenu = styled.div`
  display: none;
  gap: 1.5rem;

  @media (min-width: 769px) {
    display: flex;
  }
`;

const MenuLink = styled(Link)`
  text-decoration: none;
  color: #333;
  font-weight: bold;
  font-size: 1rem;

  &:hover {
    color: var(--primary-text);
  }
`;

const PageTitle = styled.h1`
  font-size: 1.2rem;
  font-weight: bold;
  margin: 0;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);

  @media (min-width: 769px) {
    display: none;
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const LevelText = styled.div`
  font-size: 0.875rem;
  font-weight: bold;

  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`;

const ExperienceBar = styled.div`
  width: 50px;
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 4px;

  @media (max-width: 768px) {
    width: 40px;
    height: 3px;
  }
`;

const ExperienceFill = styled.div<{ width: number }>`
  width: ${(props) => props.width}%;
  height: 100%;
  background-color: var(--primary-button);
`;

const ProfileIconWrapper = styled.div`
  position: relative;
`;

const ProfileIcon = styled.div`
  display: flex;
  align-items: center;
  color: #333;
  cursor: pointer;

  @media (max-width: 768px) {
    width: 20px;
  }
`;

const Dropdown = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 110px;
  opacity: ${(props) => (props.isOpen ? 1 : 0)};
  visibility: ${(props) => (props.isOpen ? "visible" : "hidden")};
  transform: translateY(${(props) => (props.isOpen ? "0" : "-10px")});
  transition:
    opacity 0.3s ease,
    transform 0.3s ease,
    visibility 0.3s;

  @media (max-width: 768px) {
    right: 0;
  }
`;

const DropdownLink = styled(Link)`
  display: block;
  padding: 10px 15px;
  color: #333;
  text-decoration: none;
  font-size: 1rem;
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
  font-size: 1rem;
  &:hover {
    background-color: #f5f5f5;
  }
`;

const BottomNav = styled.nav`
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;

  @media (max-width: 768px) {
    display: flex;
    justify-content: space-around;
    align-items: center;
    height: 60px;
  }
`;

const BottomNavLink = styled(Link)<{ active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: ${(props) => (props.active ? "green" : "#333")}; /* 텍스트 색상 변경 */
  font-size: 0.7rem;

  svg {
    font-size: 1.2rem; /* 아이콘 크기 조정 */
    margin-bottom: 2px;
    color: ${(props) =>
      props.active ? "green" : "#333"}; /* 아이콘 색상 변경 */
  }
`;

export default Navbar;

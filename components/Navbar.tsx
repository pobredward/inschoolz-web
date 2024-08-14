import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import styled from "@emotion/styled";
import { useRecoilState } from "recoil";
import { userState } from "../store/atoms";
import { useAuth } from "../hooks/useAuth";
import { useUser } from "../hooks/useUser";
import { useLogout } from "../hooks/useLogout";
import { FiUser } from "react-icons/fi";
import { useRouter } from "next/router";

const Navbar: React.FC = () => {
  const { user } = useAuth();
  const [currentUser, setCurrentUser] = useRecoilState(userState);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [logoSrc, setLogoSrc] = useState("/logo_1170x730.png");
  const logout = useLogout();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

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

    handleResize(); // 초기 로드 시 로고 이미지 설정
    window.addEventListener("resize", handleResize); // 윈도우 크기 변경 시 로고 이미지 설정

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

  return (
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
          <NavLinks>
            <NavLink href="/community/national-free">커뮤니티</NavLink>
            <NavLink href="/game">미니게임</NavLink>
            <NavLink href="/ranking">랭킹</NavLink>
          </NavLinks>
        </LeftSection>
        <AccountWrapper>
          {currentUser ? (
            <>
              <UserInfo>
                <LevelText>Lv.{currentUser?.level}</LevelText>
                <ExperienceBar>
                  <ExperienceFill
                    width={calculateExperiencePercentage(
                      currentUser.experience,
                      currentUser.level,
                    )}
                  />
                </ExperienceBar>
              </UserInfo>
              <ProfileIconWrapper>
                <ProfileIcon>
                  <FiUser size={24} />
                </ProfileIcon>
                <Dropdown>
                  <DropdownLink href="/mypage">내 정보</DropdownLink>
                  <DropdownButton onClick={handleLogout}>
                    로그아웃
                  </DropdownButton>
                </Dropdown>
              </ProfileIconWrapper>
            </>
          ) : (
            <>
              <ProfileIconWrapper>
                <ProfileIcon>
                  <FiUser size={24} />
                </ProfileIcon>
                <Dropdown>
                  <DropdownLink href="/login">로그인</DropdownLink>
                  <DropdownLink href="/signup">회원가입</DropdownLink>
                </Dropdown>
              </ProfileIconWrapper>
            </>
          )}
        </AccountWrapper>
      </Container>
    </Nav>
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

  @media (max-width: 768px) {
    gap: 0.3rem;
  }

  @media (max-width: 360px) {
    gap: 0.1rem;
  }
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

  @media (max-width: 350px) {
    width: 28px;
    height: 28px;
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 1rem;

  @media (max-width: 768px) {
    gap: 0.5rem;
  }

  @media (max-width: 350px) {
    gap: 0.2rem;
  }
`;

const NavLink = styled(Link)`
  text-decoration: none;
  color: #333;
  font-weight: bold;
  font-size: 1rem;

  &:hover {
    color: #7ed957;
  }

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }

  @media (max-width: 350px) {
    font-size: 0.7rem;
  }
`;

const AccountWrapper = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-right: 10px;
`;

const LevelText = styled.div`
  font-size: 0.875rem;
  font-weight: bold;
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
  background-color: #7ed957;
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
  min-width: 110px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition:
    opacity 0.3s ease,
    transform 0.3s ease,
    visibility 0.3s;

  @media (max-width: 768px) {
    right: 0;
  }
`;

const ProfileIconWrapper = styled.div`
  position: relative;

  &:hover ${Dropdown} {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
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

export default Navbar;

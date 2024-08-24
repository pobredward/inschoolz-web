import React, { useEffect, useRef, useState } from "react";
import Layout from "../../components/Layout";
import PostList from "../../components/PostList";
import { useRecoilState, useRecoilValue } from "recoil";
import {
  selectedCategoryState,
  userState,
  categoriesState,
} from "../../store/atoms";
import { useRouter } from "next/router";
import styled from "@emotion/styled";
import { FaPen, FaBars } from "react-icons/fa";
import Link from "next/link";

const CategoryPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useRecoilState(
    selectedCategoryState,
  );
  const router = useRouter();
  const { category } = router.query;
  const user = useRecoilValue(userState);
  const categories = useRecoilValue(categoriesState);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMajorCategory, setActiveMajorCategory] = useState("national");
  const pageRef = useRef(null);

  useEffect(() => {
    if (category) {
      setSelectedCategory(category as string);
      setActiveMajorCategory(category.toString().split("-")[0]);
    }
  }, [category, setSelectedCategory]);

  const getCategoryName = (categoryId: string) => {
    for (let cat of categories) {
      if (cat.subcategories) {
        for (let subcat of cat.subcategories) {
          if (subcat.id === categoryId) {
            return `${cat.name} > ${subcat.name}`;
          }
        }
      }
    }
    return "";
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setIsMobileMenuOpen(false);
    router.push(`/community/${categoryId}`);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (pageRef.current && !pageRef.current.contains(event.target as Node)) {
      setIsMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isNationalCategory = selectedCategory.startsWith("national-");

  return (
    <Layout>
      <PageContainer ref={pageRef}>
        <MobileHeader>
          <HamburgerIcon onClick={toggleMobileMenu}>
            <FaBars />
          </HamburgerIcon>
          <MobileTitle>{getCategoryName(selectedCategory)}</MobileTitle>
        </MobileHeader>
        <ContentWrapper>
          <CategoryPanel isOpen={isMobileMenuOpen}>
            <MajorCategoryList>
              {categories.map((cat) => (
                <MajorCategoryItem
                  key={cat.id}
                  onClick={() => setActiveMajorCategory(cat.id)}
                  isActive={activeMajorCategory === cat.id}
                >
                  {cat.name}
                </MajorCategoryItem>
              ))}
            </MajorCategoryList>
            <SubcategoryList>
              {categories
                .find((cat) => cat.id === activeMajorCategory)
                ?.subcategories?.map((subcat) => (
                  <SubcategoryItem
                    key={subcat.id}
                    onClick={() => handleCategorySelect(subcat.id)}
                    isActive={selectedCategory === subcat.id}
                  >
                    {subcat.name}
                  </SubcategoryItem>
                ))}
            </SubcategoryList>
          </CategoryPanel>
          <MainContent isMobileMenuOpen={isMobileMenuOpen}>
            {user || isNationalCategory ? (
              <>
                <CategoryHeader>
                  <CategoryTitle>
                    {getCategoryName(selectedCategory)}
                  </CategoryTitle>
                  {user && selectedCategory !== "national-hot" && (
                    <CreatePostButton
                      onClick={() =>
                        router.push(
                          `/community/${selectedCategory}/create-post`,
                        )
                      }
                    >
                      <FaPen />
                    </CreatePostButton>
                  )}
                </CategoryHeader>
                <PostList
                  selectedCategory={selectedCategory}
                  isLoggedIn={!!user}
                  isNationalCategory={isNationalCategory}
                />
              </>
            ) : (
              <LoginPromptContainer>
                <LoginPromptText>로그인이 필요합니다</LoginPromptText>
                <LoginButton href="/login">로그인</LoginButton>
              </LoginPromptContainer>
            )}
          </MainContent>
        </ContentWrapper>
      </PageContainer>
    </Layout>
  );
};

const PageContainer = styled.div`
  position: relative;
  overflow-x: hidden;
`;

const ContentWrapper = styled.div`
  display: flex;
`;

const CategoryPanel = styled.div<{ isOpen: boolean }>`
  display: flex;
  width: 280px;
  height: calc(100vh - 60px); // 모바일 헤더 높이를 고려
  background-color: white;
  transition: transform 0.3s ease-in-out;

  @media (max-width: 768px) {
    position: fixed;
    top: 60px; // 모바일 헤더 아래에 위치
    left: 0;
    transform: ${({ isOpen }) =>
      isOpen ? "translateX(0)" : "translateX(-100%)"};
    z-index: 1000;
  }
`;

const MajorCategoryList = styled.div`
  width: 100px;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
`;

const MajorCategoryItem = styled.div<{ isActive: boolean }>`
  padding: 1rem;
  cursor: pointer;
  background-color: ${({ isActive }) => (isActive ? "#f0f0f0" : "transparent")};
  &:hover {
    background-color: #f0f0f0;
  }
`;

const SubcategoryList = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
`;

const SubcategoryItem = styled.div<{ isActive: boolean }>`
  padding: 0.5rem;
  cursor: pointer;
  background-color: ${({ isActive }) => (isActive ? "#f0f0f0" : "transparent")};
  &:hover {
    background-color: #f0f0f0;
  }
`;

const MainContent = styled.div<{ isMobileMenuOpen: boolean }>`
  flex: 1;
  padding: 1rem;
  min-width: 0;
  transition: transform 0.3s ease-in-out;

  @media (max-width: 768px) {
    transform: ${({ isMobileMenuOpen }) =>
      isMobileMenuOpen ? "translateX(280px)" : "translateX(0)"};
  }
`;

const MobileHeader = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    padding: 0 1rem;
    background-color: white;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    z-index: 1001; // CategoryPanel보다 위에 오도록 z-index 증가
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); // 선택적: 그림자 효과 추가
  }
`;

const HamburgerIcon = styled.div`
  font-size: 1.5rem;
  cursor: pointer;
  margin-right: 1rem;
`;

const MobileTitle = styled.h2`
  margin: 0;
  font-size: 1.2rem;
`;

const CategoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const CategoryTitle = styled.h2`
  margin: 0;
  @media (max-width: 768px) {
    display: none;
  }
`;

const CreatePostButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: var(--primary-button);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background-color: var(--primary-hover);
  }
`;

const LoginPromptContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
`;

const LoginPromptText = styled.p`
  font-size: 18px;
  margin-bottom: 20px;
`;

const LoginButton = styled(Link)`
  padding: 10px 20px;
  background-color: var(--primary-color);
  color: white;
  text-decoration: none;
  border-radius: 5px;
  font-weight: bold;

  &:hover {
    background-color: var(--hover-color);
  }
`;

export default CategoryPage;

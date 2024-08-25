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
import { FaPen, FaBars, FaStar, FaSearch, FaUndo } from "react-icons/fa";
import Link from "next/link";
import { toggleFavoriteMinorGallery } from "../../services/userService";
import { Category } from "../../types";

const CategoryPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useRecoilState(
    selectedCategoryState,
  );
  const router = useRouter();
  const { category } = router.query;
  const [user, setUser] = useRecoilState(userState);
  const categories = useRecoilValue(categoriesState);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMajorCategory, setActiveMajorCategory] = useState("national");
  const pageRef = useRef(null);
  const [isMinorGalleryOpen, setIsMinorGalleryOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredGalleries, setFilteredGalleries] = useState<Category[]>([]);
  const [allMinorGalleries, setAllMinorGalleries] = useState<Category[]>([]);

  useEffect(() => {
    const minorGalleries =
      categories
        .find((cat) => cat.id === "national")
        ?.subcategories?.find((subcat) => subcat.id === "national-minor")
        ?.subcategories || [];
    setAllMinorGalleries(minorGalleries);
    setFilteredGalleries(minorGalleries);
  }, [categories]);

  const handleSearch = () => {
    const filtered = allMinorGalleries.filter((gallery) =>
      gallery.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredGalleries(filtered);
  };

  const handleReset = () => {
    setSearchTerm("");
    setFilteredGalleries(allMinorGalleries);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const toggleMinorGallery = () => {
    setIsMinorGalleryOpen(!isMinorGalleryOpen);
  };

  const handleMinorGallerySelect = (galleryId: string) => {
    handleCategorySelect(galleryId);
    setIsMinorGalleryOpen(false);
  };

  const handleToggleFavorite = async (galleryId: string) => {
    if (user) {
      const updatedUser = await toggleFavoriteMinorGallery(user.uid, galleryId);
      setUser(updatedUser); // 업데이트된 사용자 정보로 상태 갱신
    }
  };

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
            if (cat.id === "school") {
              return `${user?.schoolName} > ${subcat.name}`;
            } else if (cat.id === "regional") {
              return `${user?.address1} ${user?.address2} > ${subcat.name}`;
            } else {
              return `${cat.name} > ${subcat.name}`;
            }
          }
          if (subcat.subcategories) {
            for (let minorGallery of subcat.subcategories) {
              if (minorGallery.id === categoryId) {
                return `${cat.name} > ${minorGallery.name} 게시판`;
              }
            }
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
                ?.subcategories?.map((subcat) =>
                  subcat.id === "national-minor" ? (
                    <MinorGalleryContainer key={subcat.id}>
                      <MinorGalleryToggle onClick={toggleMinorGallery}>
                        {subcat.name}
                        {isMinorGalleryOpen ? " ▲" : " ▼"}
                      </MinorGalleryToggle>
                      {isMinorGalleryOpen && (
                        <>
                          <FavoriteGalleriesSection>
                            {user?.favoriteGalleries?.map((galleryId) => {
                              const gallery = allMinorGalleries.find(
                                (g) => g.id === galleryId,
                              );
                              return (
                                gallery && (
                                  <SubcategoryItem
                                    key={gallery.id}
                                    onClick={() =>
                                      handleCategorySelect(gallery.id)
                                    }
                                    isActive={selectedCategory === gallery.id}
                                  >
                                    <span>{gallery.name}</span>
                                    <StarIcon
                                      isFavorite={true}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleFavorite(gallery.id);
                                      }}
                                    >
                                      <FaStar />
                                    </StarIcon>
                                  </SubcategoryItem>
                                )
                              );
                            })}
                          </FavoriteGalleriesSection>
                          <SearchContainer>
                            <SearchInput
                              type="text"
                              placeholder="갤러리 검색"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              onKeyPress={handleKeyPress}
                            />
                            <SearchButton onClick={handleSearch}>
                              <FaSearch />
                            </SearchButton>
                            <ResetButton onClick={handleReset}>
                              <FaUndo />
                            </ResetButton>
                          </SearchContainer>

                          <MinorGalleryList>
                            {filteredGalleries.map((minorGallery) => (
                              <SubcategoryItem
                                key={minorGallery.id}
                                onClick={() =>
                                  handleCategorySelect(minorGallery.id)
                                }
                                isActive={selectedCategory === minorGallery.id}
                              >
                                <span>{minorGallery.name}</span>
                                <StarIcon
                                  isFavorite={user?.favoriteGalleries?.includes(
                                    minorGallery.id,
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleFavorite(minorGallery.id);
                                  }}
                                >
                                  <FaStar />
                                </StarIcon>
                              </SubcategoryItem>
                            ))}
                          </MinorGalleryList>
                        </>
                      )}
                    </MinorGalleryContainer>
                  ) : (
                    <SubcategoryItem
                      key={subcat.id}
                      onClick={() => handleCategorySelect(subcat.id)}
                      isActive={selectedCategory === subcat.id}
                    >
                      {subcat.name}
                    </SubcategoryItem>
                  ),
                )}
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

const FavoriteGalleriesSection = styled.div`
  margin-bottom: 1rem;
  margin-left: 1rem;
`;

const SearchContainer = styled.div`
  display: flex;
  margin-bottom: 1rem;
  margin-left: 1rem;
`;

const SearchInput = styled.input`
  flex-grow: 1;
  max-width: 100px;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px 0 0 4px;
`;

const SearchButton = styled.button`
  padding: 0.5rem;
  background-color: var(--primary-button);
  color: white;
  border: none;
  cursor: pointer;
`;

const ResetButton = styled(SearchButton)`
  border-radius: 0 4px 4px 0;
  background-color: #6c757d;
`;

const StarIcon = styled.span<{ isFavorite: boolean }>`
  color: ${({ isFavorite }) => (isFavorite ? "gold" : "#ccc")};
  cursor: pointer;
  font-size: 0.9rem;
`;

const MinorGalleryContainer = styled.div`
  margin-bottom: 10px;
`;

const MinorGalleryToggle = styled.div`
  padding: 0.5rem;
  cursor: pointer;
  &:hover {
    background-color: #f0f0f0;
  }
`;

const MinorGalleryList = styled.div`
  margin-left: 1rem;
  transition: max-height 0.3s ease-in-out;
  overflow: scroll;
`;

const PageContainer = styled.div`
  position: relative;
  overflow-x: hidden;
`;

const ContentWrapper = styled.div`
  display: flex;
`;
const CategoryPanel = styled.div<{ isOpen: boolean }>`
  display: flex;
  width: 320px; // 너비를 280px에서 320px로 증가
  height: calc(100vh - 60px);
  background-color: white;
  transition: transform 0.3s ease-in-out;

  @media (max-width: 768px) {
    position: fixed;
    top: 60px;
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

const SubcategoryList = styled.div`
  flex: 1;
  padding: 0.5rem;
  overflow-y: auto;
`;

const SubcategoryItem = styled.div<{ isActive: boolean }>`
  padding: 0.5rem;
  cursor: pointer;
  background-color: ${({ isActive }) => (isActive ? "#f0f0f0" : "transparent")};
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background-color: #f0f0f0;
  }
`;

const MajorCategoryItem = styled.div<{ isActive: boolean }>`
  padding: 1rem;
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
  font-size: 1.1rem;
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

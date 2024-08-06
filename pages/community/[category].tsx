import React, { useEffect } from "react";
import Layout from "../../components/Layout";
import CategoryList from "../../components/CategoryList";
import PostList from "../../components/PostList";
import { useRecoilState, useRecoilValue } from "recoil";
import {
  selectedCategoryState,
  userState,
  categoriesState,
} from "../../store/atoms";
import { useRouter } from "next/router";
import styled from "@emotion/styled";

const CategoryPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useRecoilState(
    selectedCategoryState,
  );
  const router = useRouter();
  const { category } = router.query;
  const user = useRecoilValue(userState);
  const categories = useRecoilValue(categoriesState);

  useEffect(() => {
    if (category) {
      setSelectedCategory(category as string);
    }
  }, [category, setSelectedCategory]);

  const getCategoryPath = () => {
    let categoryPath = "전국";
    categories.forEach((cat) => {
      cat.subcategories?.forEach((subcat) => {
        if (subcat.id === category) {
          categoryPath = `${cat.name} > ${subcat.name}`;
          if (cat.id === "regional") {
            categoryPath = `${user?.address1} ${user?.address2} > ${subcat.name}`;
          } else if (cat.id === "school") {
            categoryPath = `${user?.schoolName} > ${subcat.name}`;
          }
        }
      });
    });
    return categoryPath;
  };

  return (
    <Layout>
      <Container>
        <CategorySection>
          <CategoryList />
        </CategorySection>
        <ContentSection>
          <CategoryHeader>
            <h2>{getCategoryPath()}</h2>
            <CreatePostButton
              onClick={() =>
                router.push(`/community/${selectedCategory}/create-post`)
              }
            >
              글 작성
            </CreatePostButton>
          </CategoryHeader>
          <PostList selectedCategory={selectedCategory} />
        </ContentSection>
      </Container>
    </Layout>
  );
};

const Container = styled.div`
  display: flex;
  gap: 2rem;
  max-width: 100%;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const CategorySection = styled.div`
  flex: 1;
  @media (max-width: 768px) {
    order: 2;
  }
`;

const ContentSection = styled.div`
  flex: 3;
  @media (max-width: 768px) {
    order: 1;
  }
`;

const CategoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  h2 {
    margin: 0;
  }
`;

const CreatePostButton = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;

  &:hover {
    background-color: #0056b3;
  }
`;

export default CategoryPage;

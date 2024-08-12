import React, { useEffect, useState } from "react";
import styled from "@emotion/styled";
import Layout from "../components/Layout";
import CategoryList from "../components/CategoryList";
import PostList from "../components/PostList";
import CreatePostButton from "../components/CreatePostButton";
import { useRecoilState, useRecoilValue } from "recoil";
import { selectedCategoryState, userState } from "../store/atoms";
import { useRouter } from "next/router";

const CommunityPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useRecoilState(
    selectedCategoryState,
  );
  const user = useRecoilValue(userState);
  const router = useRouter();
  const [isNationalCategory, setIsNationalCategory] = useState(false);

  useEffect(() => {
    setSelectedCategory("national-all");
    setIsNationalCategory(selectedCategory.startsWith("national-"));
  }, [setSelectedCategory, selectedCategory]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    router.push(`/community/${categoryId}`);
    setIsNationalCategory(categoryId.startsWith("national-"));
  };

  return (
    <Layout>
      <Container>
        <CategorySection>
          <CategoryList onSelectCategory={handleCategorySelect} />
        </CategorySection>
        <ContentSection>
          <CreatePostButton />
          <PostList
            selectedCategory={selectedCategory}
            isLoggedIn={!!user}
            isNationalCategory={isNationalCategory}
          />
        </ContentSection>
      </Container>
    </Layout>
  );
};

const Container = styled.div`
  display: flex;
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

export default CommunityPage;

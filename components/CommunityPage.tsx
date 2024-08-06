import React, { useEffect } from "react";
import styled from "@emotion/styled";
import Layout from "../components/Layout";
import CategoryList from "../components/CategoryList";
import PostList from "../components/PostList";
import CreatePostButton from "../components/CreatePostButton";
import { useRecoilState } from "recoil";
import { selectedCategoryState } from "../store/atoms";

const CommunityPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useRecoilState(
    selectedCategoryState,
  );

  useEffect(() => {
    setSelectedCategory("national-all");
  }, [setSelectedCategory]);

  return (
    <Layout>
      <Container>
        <CategorySection>
          <CategoryList />
        </CategorySection>
        <ContentSection>
          <CreatePostButton />
          <PostList />
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

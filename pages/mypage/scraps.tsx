import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useRecoilValue } from "recoil";
import { userState, Post } from "../../store/atoms";
import Layout from "../../components/Layout";
import styled from "@emotion/styled";
import { fetchUserScraps } from "../../services/postService";
import { formatDate } from "../../utils/dateUtils";

const ScrapsPage: React.FC = () => {
  const user = useRecoilValue(userState);
  const router = useRouter();
  const [scrappedPosts, setScrappedPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserScraps(user.uid).then(setScrappedPosts);
    }
  }, [user]);

  return (
    <Layout>
      <Container>
        <h1>내 스크랩</h1>
        <PostContainer>
          {scrappedPosts.map((post) => (
            <PostItem
              key={post.id}
              onClick={() => router.push(`/posts/${post.id}`)}
            >
              <PostTitle>{post.title}</PostTitle>
              <PostContent>{post.content.substring(0, 100)}...</PostContent>
              <PostFooter>
                <PostDateAuthor>{formatDate(post.createdAt)}</PostDateAuthor>
                <PostActions>
                  <ActionItem>👍 {post.likes || 0}</ActionItem>
                  <ActionItem>💬 {post.comments || 0}</ActionItem>
                  <ActionItem>👁️ {post.views || 0}</ActionItem>
                  <ActionItem>🔖 {post.scraps || 0}</ActionItem>
                </PostActions>
              </PostFooter>
            </PostItem>
          ))}
        </PostContainer>
      </Container>
    </Layout>
  );
};

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;

  @media (max-width: 768px) {
    padding: 0.5rem;
  }
`;

const PostContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  @media (max-width: 769px) {
    gap: 0.2rem;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: #666;
`;

const PostItem = styled.div`
  padding: 1.2rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: #f9f9f9;
  }

  @media (max-width: 769px) {
    padding: 1rem 0.3rem;
  }
`;

const PostHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PostCategory = styled.span`
  font-size: 0.8rem;
  color: #6c757d;

  @media (max-width: 769px) {
    font-size: 0.6rem;
  }
`;

const PostTitle = styled.h4`
  margin: 0;
  flex-grow: 1;

  @media (max-width: 769px) {
    font-size: 0.8rem;
  }
`;

const PostContent = styled.p`
  margin: 0rem;
  color: #8e9091;
  line-height: 1.2;
  font-size: 0.9rem;

  @media (max-width: 769px) {
    font-size: 0.7rem;
  }
`;

const PostFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
`;

const PostDateAuthor = styled.span`
  font-size: 0.8rem;
  color: #6c757d;

  @media (max-width: 769px) {
    font-size: 0.6rem;
  }
`;

const PostActions = styled.div`
  display: flex;
  gap: 0.5rem;
  font-size: 0.7rem;
  color: #6c757d;

  @media (max-width: 769px) {
    gap: 0.4rem;
    font-size: 0.5rem;
  }
`;

const ActionItem = styled.span`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

export default ScrapsPage;

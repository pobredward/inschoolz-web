import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useRecoilValue, useRecoilState } from "recoil";
import { userState, categoriesState } from "../../store/atoms";
import { Post } from "../../types";
import Layout from "../../components/Layout";
import styled from "@emotion/styled";
import {
  collection,
  query,
  getDocs,
  getDoc,
  doc,
  limit,
  orderBy,
  startAfter,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { formatDate } from "../../utils/dateUtils";

const ScrapsPage: React.FC = () => {
  const user = useRecoilValue(userState);
  const router = useRouter();
  const [categories] = useRecoilState(categoriesState);
  const [scrappedPosts, setScrappedPosts] = useState<Post[]>([]);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchScraps();
  }, []);

  const fetchScraps = async () => {
    if (!user) return;
    setLoading(true);
    const scrapsRef = collection(db, `users/${user.uid}/scraps`);
    const q = query(scrapsRef, orderBy("createdAt", "desc"), limit(10));
    const querySnapshot = await getDocs(q);

    const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    setLastVisible(lastVisibleDoc);

    const scrappedPostsData = await Promise.all(
      querySnapshot.docs.map(async (scrapDoc) => {
        const postRef = doc(db, "posts", scrapDoc.id);
        const postSnap = await getDoc(postRef);
        return { id: scrapDoc.id, ...postSnap.data() } as Post;
      }),
    );

    setScrappedPosts(scrappedPostsData);
    setLoading(false);
  };

  const fetchMoreScraps = async () => {
    if (!user || !lastVisible) return;
    setLoading(true);
    const scrapsRef = collection(db, `users/${user.uid}/scraps`);
    const q = query(
      scrapsRef,
      orderBy("createdAt", "desc"),
      startAfter(lastVisible),
      limit(10),
    );
    const querySnapshot = await getDocs(q);

    const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    setLastVisible(lastVisibleDoc);

    const newScrappedPostsData = await Promise.all(
      querySnapshot.docs.map(async (scrapDoc) => {
        const postRef = doc(db, "posts", scrapDoc.id);
        const postSnap = await getDoc(postRef);
        return { id: scrapDoc.id, ...postSnap.data() } as Post;
      }),
    );

    setScrappedPosts([...scrappedPosts, ...newScrappedPostsData]);
    setLoading(false);
  };

  const getCategoryName = (categoryId: string) => {
    for (let cat of categories) {
      if (cat.subcategories) {
        for (let subcat of cat.subcategories) {
          if (subcat.id === categoryId) {
            return `${cat.name} | ${subcat.name}`;
          }
        }
      }
    }
    return "";
  };

  return (
    <Layout>
      <Container>
        <h1>내 스크랩</h1>
        <PostContainer>
          {scrappedPosts.map((post) => (
            <PostItem
              key={post.id}
              onClick={() =>
                router.push(`/community/${post.categoryId}/${post.id}`)
              }
            >
              <PostHeader>
                <PostTitle>{post.title}</PostTitle>
                <PostCategory>{getCategoryName(post.categoryId)}</PostCategory>
              </PostHeader>
              <PostContent>
                {post.content
                  ? post.content.substring(0, 100)
                  : "내용이 없습니다."}
                ...
              </PostContent>
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
        {lastVisible && (
          <LoadMoreButton onClick={fetchMoreScraps} disabled={loading}>
            {loading ? "로딩 중..." : "더 보기"}
          </LoadMoreButton>
        )}
      </Container>
    </Layout>
  );
};

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const PostContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
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
`;

const PostHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PostCategory = styled.span`
  font-size: 0.8rem;
  color: #6c757d;
`;

const PostTitle = styled.h4`
  margin: 0;
  flex-grow: 1;
`;

const PostContent = styled.p`
  margin: 0.5rem 0;
  color: #666;
`;

const PostFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
`;

const PostDateAuthor = styled.span`
  font-size: 0.8rem;
  color: #666;
`;

const PostActions = styled.div`
  display: flex;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #666;
`;

const ActionItem = styled.span`
  display: flex;
  align-items: center;
`;

const LoadMoreButton = styled.button`
  width: 100%;
  padding: 10px;
  margin-top: 1rem;
  background-color: #0070f3;
  color: white;
  border: none;
  cursor: pointer;

  &:disabled {
    background-color: #ccc;
  }
`;

export default ScrapsPage;

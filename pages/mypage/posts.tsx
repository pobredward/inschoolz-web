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

const PostsPage: React.FC = () => {
  const user = useRecoilValue(userState);
  const router = useRouter();
  const [categories] = useRecoilState(categoriesState);
  const [posts, setPosts] = useState<Post[]>([]);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   if (!user) {
  //     router.push("/login");
  //   } else {
  //     fetchPosts();
  //   }
  // }, [user, router]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    if (!user) return;
    setLoading(true);
    const postsRef = collection(db, `users/${user.uid}/posts`);
    const q = query(postsRef, orderBy("createdAt", "desc"), limit(10));
    const querySnapshot = await getDocs(q);

    const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    setLastVisible(lastVisibleDoc);

    const postsData = await Promise.all(
      querySnapshot.docs.map(async (postDoc) => {
        const postRef = doc(db, "posts", postDoc.id);
        const postSnap = await getDoc(postRef);
        return { id: postDoc.id, ...postSnap.data() } as Post;
      }),
    );

    setPosts(postsData);
    setLoading(false);
  };

  const fetchMorePosts = async () => {
    if (!user || !lastVisible) return;
    setLoading(true);
    const postsRef = collection(db, `users/${user.uid}/posts`);
    const q = query(
      postsRef,
      orderBy("createdAt", "desc"),
      startAfter(lastVisible),
      limit(10),
    );
    const querySnapshot = await getDocs(q);

    const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    setLastVisible(lastVisibleDoc);

    const newPostsData = await Promise.all(
      querySnapshot.docs.map(async (postDoc) => {
        const postRef = doc(db, "posts", postDoc.id);
        const postSnap = await getDoc(postRef);
        return { id: postDoc.id, ...postSnap.data() } as Post;
      }),
    );

    setPosts([...posts, ...newPostsData]);
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
        <h1>내 게시글</h1>
        <PostContainer>
          {posts.map((post) => (
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
                  ? getPostContentSnippet(post.content)
                  : "내용이 없습니다."} 
              </PostContent>
              <PostFooter>
                <PostDateAuthor>{formatDate(post.createdAt)}</PostDateAuthor>
                <PostActions>
                  <ActionItem>👍 {post.likes || 0}</ActionItem>
                  <ActionItem>💬 {post.comments || 0}</ActionItem>
                  <ActionItem>👁️ {post.views || 0}</ActionItem>
                </PostActions>
              </PostFooter>
            </PostItem>
          ))}
        </PostContainer>
        {lastVisible && (
          <LoadMoreButton onClick={fetchMorePosts} disabled={loading}>
            {loading ? "로딩 중..." : "더 보기"}
          </LoadMoreButton>
        )}
      </Container>
    </Layout>
  );
};

const getPostContentSnippet = (content: string) => {
  // <p> 태그를 기준으로 내용 분리
  const paragraphs = content
    .split(/<\/?p[^>]*>/g)
    .filter((paragraph) => paragraph.trim() !== "");

  // 첫 번째 <p> 문단 가져오기
  const firstParagraph = paragraphs[0] || "";

  // HTML 태그 제거
  const plainText = firstParagraph.replace(/<[^>]+>/g, "");

  // 모바일 여부에 따라 길이 제한
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
  const sliceLength = isMobile ? 20 : 45;

  // 글자 수 제한 적용
  return plainText.length > sliceLength
    ? plainText.slice(0, sliceLength) + "..."
    : plainText;
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

  @media (max-width: 769px) {
    font-size: 0.6rem;
  }
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

export default PostsPage;

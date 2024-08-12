import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { useRecoilState } from "recoil";
import { postsState, userState, categoriesState, Post } from "../store/atoms";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useRouter } from "next/router";
import { formatDate, formatTime } from "../utils/dateUtils";
import { FaThumbsUp, FaComment, FaEye, FaBookmark } from "react-icons/fa";

interface PostListProps {
  selectedCategory: string;
  isLoggedIn: boolean;
  isNationalCategory: boolean;
}

const PostList: React.FC<PostListProps> = ({
  selectedCategory,
  isLoggedIn,
  isNationalCategory,
}) => {
  const [posts, setPosts] = useRecoilState(postsState);
  const [categories] = useRecoilState(categoriesState);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sliceLength, setSliceLength] = useState(50);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSliceLength(30);
      } else {
        setSliceLength(50);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // 초기 화면 크기에 맞게 설정

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      if (isNationalCategory || isLoggedIn) {
        try {
          let q = query(
            collection(db, "posts"),
            where("categoryId", "==", selectedCategory),
          );

          const querySnapshot = await getDocs(q);
          const postsData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Post),
          }));

          // 클라이언트 측에서 정렬
          const sortedPosts = postsData.sort((a, b) => {
            return b.createdAt.toMillis() - a.createdAt.toMillis();
          });

          setPosts(sortedPosts);
        } catch (error) {
          console.error("Error fetching posts: ", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [selectedCategory, isLoggedIn, isNationalCategory, setPosts]);

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

  const handlePostClick = (postId: string) => {
    router.push(`/posts/${postId}`);
  };

  const formatPostMeta = (post: Post) => {
    const postDate =
      post.createdAt instanceof Date
        ? post.createdAt
        : new Date(post.createdAt.seconds * 1000);
    const date = formatDate(postDate);
    const time = formatTime(postDate);
    const author = post.author;
    const schoolName = post.schoolName;

    if (selectedCategory.startsWith("national-")) {
      return `${date} | ${author} | ${schoolName}`;
    } else {
      return `${date} | ${author}`;
    }
  };

  const renderPostContent = (content: string) => {
    return content.length > sliceLength
      ? `${content.slice(0, sliceLength)}...`
      : content;
  };

  if (loading) {
    return <LoadingMessage>로딩 중...</LoadingMessage>;
  }

  return (
    <PostContainer>
      {posts.map((post) => (
        <PostItem key={post.id} onClick={() => handlePostClick(post.id)}>
          <PostHeader>
            <PostTitle>{post.title}</PostTitle>
            {/* <PostCategory>{getCategoryName(post.categoryId)}</PostCategory> */}
          </PostHeader>
          <PostContent>{renderPostContent(post.content)}</PostContent>
          <PostFooter>
            <PostDateAuthor>{formatPostMeta(post)}</PostDateAuthor>
            <PostActions>
              {/* <ActionItem>
                <FaThumbsUp /> {post.likes || 0}
              </ActionItem>
              <ActionItem>
                <FaComment /> {post.comments || 0}
              </ActionItem>
              <ActionItem>
                <FaEye /> {post.views || 0}
              </ActionItem>
              <ActionItem>
                <FaBookmark /> {post.scraps || 0}
              </ActionItem> */}
              <ActionItem>👍 {post.likes || 0}</ActionItem>
              <ActionItem>💬 {post.comments || 0}</ActionItem>
              <ActionItem>👁️ {post.views || 0}</ActionItem>
              <ActionItem>🔖 {post.scraps || 0}</ActionItem>
            </PostActions>
          </PostFooter>
        </PostItem>
      ))}
    </PostContainer>
  );
};

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

export default PostList;

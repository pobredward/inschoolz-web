import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useRecoilValue, useRecoilState } from "recoil";
import { userState, categoriesState } from "../../store/atoms";
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

interface Comment {
  id: string;
  content: string;
  createdAt: any;
  isReply: boolean;
  parentId?: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: any;
  author: string;
  comments: number;
  likes: number;
  views: number;
  userComments: Comment[];
  categoryId: string;
}

const CommentsPage: React.FC = () => {
  const user = useRecoilValue(userState);
  const router = useRouter();
  const [categories] = useRecoilState(categoriesState);
  const [posts, setPosts] = useState<Post[]>([]);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCommentedPosts();
  }, []);

  const fetchCommentedPosts = async () => {
    if (!user) return;
    setLoading(true);
    const commentsRef = collection(db, `users/${user.uid}/comments`);
    const q = query(commentsRef, orderBy("createdAt", "desc"), limit(20));
    const querySnapshot = await getDocs(q);

    const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    setLastVisible(lastVisibleDoc);

    const postsMap = new Map<string, Post>();

    for (const commentDoc of querySnapshot.docs) {
      const commentData = commentDoc.data();
      const postRef = doc(db, "posts", commentData.postId);
      const postSnap = await getDoc(postRef);

      if (postSnap.exists()) {
        const postData = postSnap.data() as Post;
        if (postsMap.has(postData.id)) {
          const existingPost = postsMap.get(postData.id)!;
          existingPost.userComments.push({
            id: commentDoc.id,
            content: commentData.content,
            createdAt: commentData.createdAt,
            isReply: !!commentData.parentId,
            parentId: commentData.parentId,
          });
        } else {
          postsMap.set(postData.id, {
            ...postData,
            id: postSnap.id,
            userComments: [
              {
                id: commentDoc.id,
                content: commentData.content,
                createdAt: commentData.createdAt,
                isReply: !!commentData.parentId,
                parentId: commentData.parentId,
              },
            ],
          });
        }
      }
    }

    setPosts(Array.from(postsMap.values()));
    setLoading(false);
  };

  const fetchMoreCommentedPosts = async () => {
    if (!user || !lastVisible) return;
    setLoading(true);
    const commentsRef = collection(db, `users/${user.uid}/comments`);
    const q = query(
      commentsRef,
      orderBy("createdAt", "desc"),
      startAfter(lastVisible),
      limit(20),
    ); // Increased limit
    const querySnapshot = await getDocs(q);

    const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    setLastVisible(lastVisibleDoc);

    const newPostsMap = new Map<string, Post>(
      posts.map((post) => [post.id, post]),
    );

    for (const commentDoc of querySnapshot.docs) {
      const commentData = commentDoc.data();
      const postRef = doc(db, "posts", commentData.postId);
      const postSnap = await getDoc(postRef);

      if (postSnap.exists()) {
        const postData = postSnap.data() as Post;
        if (newPostsMap.has(postData.id)) {
          const existingPost = newPostsMap.get(postData.id)!;
          existingPost.userComments.push({
            id: commentDoc.id,
            content: commentData.content,
            createdAt: commentData.createdAt,
            isReply: commentData.isReply,
          });
        } else {
          newPostsMap.set(postData.id, {
            ...postData,
            id: postSnap.id,
            userComments: [
              {
                id: commentDoc.id,
                content: commentData.content,
                createdAt: commentData.createdAt,
                isReply: commentData.isReply,
              },
            ],
          });
        }
      }
    }

    setPosts(Array.from(newPostsMap.values()));
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
        <h1>내 댓글</h1>
        <PostContainer>
          {posts.map((post) => (
            <PostItem
              key={post.id}
              onClick={() => router.push(`/posts/${post.id}`)}
            >
              <PostHeader>
                <PostTitle>{post.title}</PostTitle>
                <PostCategory>{getCategoryName(post.categoryId)}</PostCategory>
              </PostHeader>
              <PostContent>{post.content.substring(0, 100)}...</PostContent>
              <CommentSection>
                <CommentHeader>
                  내 댓글 ({post.userComments.length}):
                </CommentHeader>
                {post.userComments.map((comment) => (
                  <CommentContent key={comment.id} isReply={comment.isReply}>
                    {comment.isReply && <ReplyIndicator>↳ </ReplyIndicator>}
                    {comment.content}
                    <CommentDate>{formatDate(comment.createdAt)}</CommentDate>
                  </CommentContent>
                ))}
              </CommentSection>
              <PostFooter>
                <PostDateAuthor>
                  {formatDate(post.createdAt)} | {post.author}
                </PostDateAuthor>
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
          <LoadMoreButton onClick={fetchMoreCommentedPosts} disabled={loading}>
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

const PostTitle = styled.h4`
  margin: 0;
  flex-grow: 1;
`;

const PostCategory = styled.span`
  font-size: 0.8rem;
  color: #6c757d;

  @media (max-width: 769px) {
    font-size: 0.6rem;
  }
`;

const PostContent = styled.p`
  margin: 0.5rem 0;
  color: #666;
`;

const CommentSection = styled.div`
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #f0f0f0;
  border-radius: 4px;
`;

const CommentHeader = styled.h5`
  margin: 0 0 0.5rem 0;
  color: #333;
`;

const CommentDate = styled.span`
  font-size: 0.8rem;
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

const CommentContent = styled.div<{ isReply: boolean }>`
  margin: 0.25rem 0;
  color: #444;
  font-size: 0.9rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: ${(props) => (props.isReply ? "1rem" : "0")};
  background-color: ${(props) => (props.isReply ? "#e8e8e8" : "transparent")};
`;

const ReplyIndicator = styled.span`
  color: #888;
  margin-right: 0.5rem;
`;

export default CommentsPage;

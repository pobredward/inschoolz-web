// PostItem.tsx

import React from "react";
import Link from "next/link";
import styled from "@emotion/styled";
import { Post } from "../store/atoms";

const PostItemContainer = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 15px;
`;

const PostTitle = styled.h3`
  margin: 0 0 10px 0;
  font-size: 18px;
`;

const PostContent = styled.p`
  margin: 0 0 10px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%; // 부모 요소의 너비를 초과하지 않도록 설정
`;

const PostMeta = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #666;
`;

interface PostItemProps {
  post: Post;
}

const PostItem: React.FC<PostItemProps> = ({ post }) => {
  const formatDate = (date: any) => {
      let postDate;
      if (date instanceof Date) {
          postDate = date;
      } else if (date?.toDate) {
          postDate = date.toDate();
      } else if (date?.seconds) {
          postDate = new Date(date.seconds * 1000);
      } else {
          postDate = new Date(date);
      }
      return new Intl.DateTimeFormat("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          weekday: "short",
      }).format(postDate);
  };


  return (
    <PostItemContainer>
      <Link href={`/community/post/${post.id}`}>
        <a>
          <PostTitle>{post.title}</PostTitle>
          <PostContent>{post.content}</PostContent>
          <PostMeta>
            <span>{post.author}</span>
            <span>{formatDate(post.date)}</span>
          </PostMeta>
        </a>
      </Link>
    </PostItemContainer>
  );
};

export default PostItem;

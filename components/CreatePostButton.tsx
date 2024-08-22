import React from "react";
import styled from "@emotion/styled";
import { useRecoilValue } from "recoil";
import { selectedCategoryState } from "../store/atoms";
import { useRouter } from "next/router";

const CreatePostButton: React.FC = () => {
  const selectedCategory = useRecoilValue(selectedCategoryState);
  const router = useRouter();

  const handleClick = () => {
    if (selectedCategory) {
      router.push(`/community/${selectedCategory}/create-post`);
    } else {
      alert("카테고리를 먼저 선택해주세요.");
    }
  };

  return <Button onClick={handleClick}>게시글 작성</Button>;
};

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: var(--primary-button);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  margin: 1rem 0;

  &:hover {
    background-color: var(--primary-hover);
  }
`;

export default CreatePostButton;

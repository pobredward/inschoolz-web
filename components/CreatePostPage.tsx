import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";
import Layout from "../components/Layout";
import { useRecoilState } from "recoil";
import { useRouter } from "next/router";
import { createPost } from "../services/postService";
import {
  userState,
  User,
  selectedCategoryState,
  categoriesState,
} from "../store/atoms";

const CreatePostPage: React.FC = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [user] = useRecoilState<User | null>(userState);
  // const [selectedCategory] = useRecoilState(selectedCategoryState);
  const [categories] = useRecoilState(categoriesState);
  const router = useRouter();
  const { category: categoryParam } = router.query;

  useEffect(() => {
    if (categoryParam) {
      setCategory(categoryParam as string);
    }
    if (!user) {
      // 사용자가 로그인하지 않은 경우 로그인 페이지로 리다이렉트
      router.push("/login");
    }
  }, [categoryParam, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log(user);

    if (!user) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    const newPost = {
      title,
      content,
      author: user.userId,
      authorId: user.uid,
      categoryId: category,
      address1: user.address1 || "",
      address2: user.address2 || "",
      schoolId: user.schoolId || "",
      schoolName: user.schoolName || "",
    };

    try {
      await createPost(newPost);
      router.push(`/community/${category}`);
    } catch (e) {
      console.error("Error adding document: ", e);
      alert("게시글 작성에 실패했습니다.");
    }
  };

  return (
    <Layout>
      <Container>
        <ContentSection>
          <h1>게시글 작성</h1>
          <Form onSubmit={handleSubmit}>
            <Label htmlFor="title">제목</Label>
            <Input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Label htmlFor="category">카테고리</Label>
            <Select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">카테고리 선택</option>
              {categories.map((cat) => (
                <optgroup key={cat.id} label={cat.name}>
                  {cat.subcategories?.map((subcat) => (
                    <option key={subcat.id} value={subcat.id}>
                      {subcat.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
            <Label htmlFor="content">내용</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
            <ButtonContainer>
              <SubmitButton type="submit">작성하기</SubmitButton>
              <BackButton type="button" onClick={() => router.back()}>
                목록으로 돌아가기
              </BackButton>
            </ButtonContainer>
          </Form>
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

const ContentSection = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Label = styled.label`
  font-size: 1rem;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
`;

const Textarea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  min-height: 200px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const SubmitButton = styled.button`
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

const BackButton = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: #ccc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;

  &:hover {
    background-color: #aaa;
  }
`;

const PostAuthor = styled.div`
  font-size: 1rem;
  font-weight: bold;
  color: #495057;
`;

export default CreatePostPage;

import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";
import Layout from "../components/Layout";
import { useRecoilState } from "recoil";
import {
  postsState,
  selectedCategoryState,
  userState,
  categoriesState,
} from "../store/atoms";
import { useRouter } from "next/router";
import CategoryList from "../components/CategoryList";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

const CreatePostPage: React.FC = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [posts, setPosts] = useRecoilState(postsState);
  const [selectedCategory] = useRecoilState(selectedCategoryState);
  const [categories] = useRecoilState(categoriesState);
  const [user] = useRecoilState(userState);
  const router = useRouter();
  const { category: categoryParam } = router.query;

  useEffect(() => {
    if (categoryParam) {
      setCategory(categoryParam as string);
    }
  }, [categoryParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    const newPost = {
      title,
      content,
      author: user.name || "익명",
      authorId: user.uid || "",
      date: new Date(),
      categoryId: category,
      address1: user.address1 || "",
      address2: user.address2 || "",
      schoolId: user.schoolId || "",
      schoolName: user.schoolName || "",
      likes: 0,
      comments: 0,
      likedBy: [],
    };

    try {
      const docRef = await addDoc(collection(db, "posts"), newPost);
      setPosts((oldPosts) => [{ id: docRef.id, ...newPost }, ...oldPosts]);
      router.push(`/community/${category}`);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  return (
    <Layout>
      <Container>
        <CategorySection>
          <CategoryList />
        </CategorySection>
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
              disabled
            >
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
            <Button type="submit">작성하기</Button>
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

const Button = styled.button`
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

export default CreatePostPage;

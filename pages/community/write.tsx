import React, { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styled from '@emotion/styled';
import Layout from '../../components/Layout';
import { useAuth } from '../../hooks/useAuth';
import { useRecoilValue } from 'recoil';
import { categoriesState, Category } from '../../store/atoms';
import { createPost } from '../../services/postService';

const WriteContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const WriteForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Input = styled.input`
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Textarea = styled.textarea`
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  min-height: 200px;
`;

const Select = styled.select`
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const SubmitButton = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }
`;

const WritePage: NextPage = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const { user } = useAuth();
  const router = useRouter();
  const categories = useRecoilValue(categoriesState);

  const flattenCategories = (cats: Category[]): Category[] => {
    return cats.reduce((acc: Category[], cat) => {
      if (cat.subcategories) {
        return [...acc, ...flattenCategories(cat.subcategories)];
      }
      return [...acc, cat];
    }, []);
  };

  const flatCategories = flattenCategories(categories);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    try {
      await createPost({
        title,
        content,
        categoryId,
        authorId: user.uid,
        authorName: user.name || '익명',
        address1: user.address1,
        address2: user.address2,
        schoolId: user.schoolId,
      });
      alert('게시글이 작성되었습니다.');
      router.push(`/community/${categoryId}`);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('게시글 작성에 실패했습니다.');
    }
  };

  return (
    <Layout>
      <Head>
        <title>게시글 작성 | 인스쿨즈</title>
      </Head>
      <WriteContainer>
        <h1>게시글 작성</h1>
        <WriteForm onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="">카테고리 선택</option>
            {flatCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
          <Textarea
            placeholder="내용"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
          <SubmitButton type="submit">게시글 작성</SubmitButton>
        </WriteForm>
      </WriteContainer>
    </Layout>
  );
};

export default WritePage;
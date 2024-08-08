import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styled from '@emotion/styled';
import { isAdminAuthenticated, clearAdminAuthToken } from '../../utils/adminAuth';

const AdminDashboard: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
    }
  }, [router]);

  const handleLogout = () => {
    clearAdminAuthToken();
    router.push('/admin/login');
  };

  return (
    <Container>
      <h1>관리자 대시보드</h1>
      <nav>
        <LinkStyled href="/admin/experience-settings">
          경험치 설정
        </LinkStyled>
        {/* 추후 다른 관리자 페이지 링크 추가 */}
      </nav>
      <LogoutButton onClick={handleLogout}>로그아웃</LogoutButton>
    </Container>
  );
};

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const LinkStyled = styled(Link)`
  display: block;
  margin: 10px 0;
  padding: 10px;
  background-color: #f0f0f0;
  text-decoration: none;
  color: #333;
  border-radius: 4px;

  &:hover {
    background-color: #e0e0e0;
  }
`;

const LogoutButton = styled.button`
  margin-top: 20px;
  padding: 10px;
  background-color: #ff4d4d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #ff3333;
  }
`;

export default AdminDashboard;
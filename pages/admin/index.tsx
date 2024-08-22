// pages/admin/index.tsx

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useRecoilValue } from "recoil";
import { userState } from "../../store/atoms";
import Layout from "../../components/Layout";
import styled from "@emotion/styled";
import ReportManagement from "../../components/admin/ReportManagement";
import { useAuth } from "../../hooks/useAuth"; // useAuth 훅 추가

const AdminPage: React.FC = () => {
  const user = useRecoilValue(userState);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"reports" | "users">("reports");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user: authUser, loading } = useAuth();

  useEffect(() => {
    const checkAuthorization = async () => {
      if (loading) {
        // 아직 인증 정보를 로드 중인 경우
        return;
      }

      if (!authUser) {
        // 사용자가 로그인하지 않은 경우
        router.push("/login");
      } else if (!authUser.isAdmin) {
        // 사용자가 관리자가 아닌 경우
        router.push("/");
      } else {
        // 사용자가 관리자인 경우
        setIsAuthorized(true);
      }
      setIsLoading(false);
    };

    checkAuthorization();
  }, [authUser, router, loading]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthorized) {
    return null; // 또는 접근 거부 메시지
  }

  return (
    <Layout>
      <AdminContainer>
        <h1>관리자 페이지</h1>
        <TabContainer>
          <Tab
            active={activeTab === "reports"}
            onClick={() => setActiveTab("reports")}
          >
            신고 관리
          </Tab>
          <Tab
            active={activeTab === "users"}
            onClick={() => setActiveTab("users")}
          >
            사용자 관리
          </Tab>
        </TabContainer>
        {activeTab === "reports" && <ReportManagement />}
        {activeTab === "users" && <div>사용자 관리 컴포넌트</div>}
      </AdminContainer>
    </Layout>
  );
};

const AdminContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 2rem;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  margin-right: 1rem;
  background-color: ${(props) =>
    props.active ? "var(--primary-button)" : "#f0f0f0"};
  color: ${(props) => (props.active ? "white" : "black")};
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

export default AdminPage;

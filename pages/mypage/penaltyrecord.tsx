import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styled from "@emotion/styled";
import Layout from "../../components/Layout";
import { useRecoilValue } from "recoil";
import { userState } from "../../store/atoms";
import { Warning } from "../../types";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { formatDate } from "../../utils/dateUtils";

const PenaltyRecordPage: React.FC = () => {
  const user = useRecoilValue(userState);
  const router = useRouter();
  const [warnings, setWarnings] = useState<Warning[]>([]);

  useEffect(() => {
    const fetchWarnings = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setWarnings(userDoc.data().warnings || []);
        }
      }
    };
    fetchWarnings();
  }, [user]);

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <Layout>
      <Container>
        <Title>제재 기록</Title>
        {warnings.length === 0 ? (
          <NoWarnings>제재 기록이 없습니다.</NoWarnings>
        ) : (
          <WarningList>
            {warnings.map((warning, index) => (
              <WarningItem key={index}>
                <WarningDate>{formatDate(warning.date)}</WarningDate>
                <WarningReason>
                  사유: {warning.reason.join(", ")}
                  {warning.customReason && ` (${warning.customReason})`}
                </WarningReason>
                <WarningContent>
                  {warning.contentType === "post" ? "게시글" : "댓글"}:{" "}
                  {warning.contentTitle}
                </WarningContent>
                <ContentDate>
                  작성일: {formatDate(warning.contentCreatedAt)}
                </ContentDate>
                <ViewButton
                  onClick={() =>
                    router.push(
                      `/posts/${warning.postId}${warning.contentType === "comment" ? `#comment-${warning.contentId}` : ""}`,
                    )
                  }
                >
                  내용 보기
                </ViewButton>
              </WarningItem>
            ))}
          </WarningList>
        )}
        <BackButton onClick={() => router.push("/mypage")}>
          마이페이지로 돌아가기
        </BackButton>
      </Container>
    </Layout>
  );
};

const ContentDate = styled.p`
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.5rem;
`;

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 2rem;
`;

const NoWarnings = styled.p`
  font-size: 1.2rem;
  color: #666;
`;

const WarningList = styled.ul`
  list-style: none;
  padding: 0;
`;

const WarningItem = styled.li`
  background-color: #f8f8f8;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const WarningDate = styled.p`
  font-weight: bold;
  margin-bottom: 0.5rem;
`;

const WarningReason = styled.p`
  margin-bottom: 0.5rem;
`;

const WarningContent = styled.p`
  margin-bottom: 0.5rem;
`;

const ViewButton = styled.button`
  background-color: var(--primary-button);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: var(--primary-hover);
  }
`;

const BackButton = styled.button`
  background-color: var(--gray-button);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 2rem;

  &:hover {
    background-color: var(--gray-hover);
  }
`;

export default PenaltyRecordPage;

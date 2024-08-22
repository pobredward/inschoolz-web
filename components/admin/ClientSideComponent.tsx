import React from "react";
import { useRouter } from "next/router";
import { ReportedContent, CompletedReport, Report } from "../../types";
import styled from "@emotion/styled";

interface ClientSideComponentProps {
  activeTab: "pending" | "completed";
  reportedContents: ReportedContent[];
  completedReports: CompletedReport[];
  handleShowReports: (reports: Report[]) => void;
  handleWarn: (content: ReportedContent) => void;
  handleDelete: (content: ReportedContent) => void;
  handleComplete: (content: ReportedContent) => void;
  handleReactivate: (content: CompletedReport) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

const ClientSideComponent: React.FC<ClientSideComponentProps> = ({
  activeTab,
  reportedContents,
  completedReports,
  handleShowReports,
  handleWarn,
  handleDelete,
  handleComplete,
  handleReactivate,
  currentPage,
  setCurrentPage,
}) => {
  const router = useRouter();

  const handleContentTypeClick = (
    content: ReportedContent | CompletedReport,
  ) => {
    const path =
      content.type === "post"
        ? `/posts/${content.id}`
        : `/posts/${content.postId}#comment-${content.id}`;
    router.push(path);
  };

  const formatDate = (date: any) => {
    if (date && date.toDate) {
      return date.toDate().toLocaleString();
    }
    return new Date(date).toLocaleString();
  };

  if (activeTab === "pending") {
    return (
      <>
        <h2>신고된 컨텐츠</h2>
        {reportedContents.length === 0 ? (
          <p>신고된 컨텐츠가 없습니다.</p>
        ) : (
          reportedContents.map((content) => (
            <ContentItem key={content.id}>
              <ContentType onClick={() => handleContentTypeClick(content)}>
                {content.type === "post" ? "게시글" : "댓글"}:{" "}
                {content.title || "제목 없음"}
              </ContentType>
              <ContentText>{content.content}</ContentText>
              <ContentAuthor>작성자: {content.author}</ContentAuthor>
              <ReportCount>신고 수: {content.reportCount}</ReportCount>
              <ButtonContainer>
                <ReportReasonButton
                  onClick={() => handleShowReports(content.reports)}
                >
                  사유
                </ReportReasonButton>
                <WarnButton
                  onClick={() => handleWarn(content)}
                  disabled={content.isWarned || content.isFired}
                >
                  경고
                </WarnButton>
                <DeleteButton
                  onClick={() => handleDelete(content)}
                  disabled={content.isFired}
                >
                  삭제
                </DeleteButton>
                <CompleteButton onClick={() => handleComplete(content)}>
                  보관
                </CompleteButton>
              </ButtonContainer>
            </ContentItem>
          ))
        )}
      </>
    );
  } else {
    return (
      <>
        <h2>처리 완료된 신고</h2>
        {completedReports.length === 0 ? (
          <p>처리 완료된 신고가 없습니다.</p>
        ) : (
          completedReports.map((report) => (
            <CompletedItem key={report.id}>
              <ContentType onClick={() => handleContentTypeClick(report)}>
                {report.type === "post" ? "게시글" : "댓글"}
              </ContentType>
              <ContentText>{report.content}</ContentText>
              <ContentAuthor>작성자: {report.author}</ContentAuthor>
              <CompletedDate>
                처리 일시: {formatDate(report.completedAt)}
              </CompletedDate>
              <ReactivateButton onClick={() => handleReactivate(report)}>
                재검토
              </ReactivateButton>
            </CompletedItem>
          ))
        )}
        {completedReports.length >= 20 * currentPage && (
          <LoadMoreButton onClick={() => setCurrentPage((prev) => prev + 1)}>
            더 보기
          </LoadMoreButton>
        )}
      </>
    );
  }
};


const ContentItem = styled.div`
  border: 1px solid #ddd;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
`;

const ReactivateButton = styled.button`
  background-color: #ffa500;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 0.5rem;

  &:hover {
    background-color: #ff8c00;
  }
`;

const ContentType = styled.div`
  font-weight: bold;
  margin-bottom: 0.5rem;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const ContentText = styled.div`
  margin-bottom: 0.5rem;
`;

const ContentAuthor = styled.div`
  font-style: italic;
  margin-bottom: 0.5rem;
`;

const ReportCount = styled.div`
  color: red;
  margin-bottom: 0.5rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
`;

const WarnButton = styled.button`
  background-color: #ffc107;
  color: black;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
`;

const DeleteButton = styled.button`
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
`;

const ReportReasonButton = styled.button`
  background-color: #4a90e2;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #357ae8;
  }
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 1rem;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  background-color: ${(props) => (props.active ? "#4a90e2" : "#f0f0f0")};
  color: ${(props) => (props.active ? "white" : "black")};
  border: none;
  cursor: pointer;
  margin-right: 0.5rem;
`;

const CompleteButton = styled.button`
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #45a049;
  }
`;

const CompletedItem = styled(ContentItem)`
  background-color: #f9f9f9;
`;

const CompletedDate = styled.div`
  font-size: 0.8rem;
  color: #666;
`;

const LoadMoreButton = styled.button`
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #f0f0f0;
  border: none;
  cursor: pointer;
  &:hover {
    background-color: #e0e0e0;
  }
`;

export default ClientSideComponent;

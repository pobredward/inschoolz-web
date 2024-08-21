// components/modal/ReportModal.tsx

import React from "react";
import styled from "@emotion/styled";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  reportReasons: string[];
  selectedReasons: string[];
  onReasonChange: (reason: string) => void;
  customReason: string;
  onCustomReasonChange: (reason: string) => void;
  onSubmit: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  title,
  reportReasons,
  selectedReasons,
  onReasonChange,
  customReason,
  onCustomReasonChange,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>
        <ModalBody>
          <ReportForm>
            <p>신고 사유를 선택해주세요 (복수 선택 가능):</p>
            {reportReasons.map((reason) => (
              <label key={reason}>
                <input
                  type="checkbox"
                  checked={selectedReasons.includes(reason)}
                  onChange={() => onReasonChange(reason)}
                />{" "}
                {reason}
              </label>
            ))}
            <textarea
              placeholder="추가 설명 (선택사항)"
              value={customReason}
              onChange={(e) => onCustomReasonChange(e.target.value)}
            />
            <SubmitButton onClick={onSubmit}>신고하기</SubmitButton>
          </ReportForm>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ModalTitle = styled.h2`
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
`;

const ModalBody = styled.div``;

const ReportForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

  label {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  textarea {
    width: 100%;
    height: 100px;
    padding: 5px;
    margin-top: 10px;
  }
`;

const SubmitButton = styled.button`
  align-self: flex-end;
  padding: 5px 10px;
  background-color: #ff4d4d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #ff0000;
  }
`;

export default ReportModal;

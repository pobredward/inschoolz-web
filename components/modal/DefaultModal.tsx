import React from "react";
import styled from "@emotion/styled";

interface DefaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  height?: string;
}

const DefaultModal: React.FC<DefaultModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  height = "auto",
}) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent height={height} onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>
        <ModalBody height={height}>
          {message.split("\n").map((line, index) => (
            <p key={index}>{line}</p>
          ))}
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

const ModalContent = styled.div<{ height: string }>`
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 90%;
  width: 400px;
  max-height: ${(props) => props.height}; /* 높이를 설정 */
  height: ${(props) => props.height}; /* 설정된 높이 적용 */

  @media (max-width: 768px) {
    width: 90%;
    max-width: 250px;
    padding: 1.5rem;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  color: #666;
`;

const ModalBody = styled.div<{ height: string }>`
  font-size: 1rem;
  line-height: 1.5;
  overflow-y: auto;
  max-height: calc(
    ${(props) => props.height} - 60px
  ); /* 전체 높이에서 헤더의 높이(약 60px)만큼을 제외 */
`;

export default DefaultModal;

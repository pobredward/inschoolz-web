import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

interface ExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  expGained: number;
  newLevel?: number;
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

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
  animation: ${fadeIn} 0.3s ease-out;
`;

const ModalContent = styled.div`
  background-color: #fff;
  padding: 2rem;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 90%;
  width: 400px;
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 1rem;
`;

const ExperienceInfo = styled.p`
  font-size: 1.2rem;
  color: #4caf50;
  margin-bottom: 1rem;
`;

const LevelUpInfo = styled.p`
  font-size: 1.5rem;
  color: #ff9800;
  font-weight: bold;
  margin-bottom: 1rem;
`;

const CloseButton = styled.button`
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #45a049;
  }
`;

const ExperienceModal: React.FC<ExperienceModalProps> = ({ isOpen, onClose, expGained, newLevel }) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <Title>경험치 획득!</Title>
        <ExperienceInfo>+{expGained} EXP를 획득하셨습니다!</ExperienceInfo>
        {newLevel && <LevelUpInfo>레벨 {newLevel}로 올랐습니다!</LevelUpInfo>}
        <CloseButton onClick={onClose}>확인</CloseButton>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ExperienceModal;
import React from "react";
import Link from "next/link";
import Layout from "../../components/Layout";
import Leaderboard from "../../components/game/Leaderboard";
import styled from "@emotion/styled";
import { FaBolt, FaFeather } from "react-icons/fa";

const GamePage: React.FC = () => {
  return (
    <Layout>
      <GameContainer>
        <SectionTitle>미니게임</SectionTitle>
        <GameSection>
          <GameCard href="/game/reactiongame">
            <IconWrapper>
              <FaBolt size={24} />
            </IconWrapper>
            <GameText>반응속도 게임</GameText>
          </GameCard>
          <GameCard href="/game/flappybird">
            <IconWrapper>
              <FaFeather size={24} />
            </IconWrapper>
            <GameText>플래피 버드</GameText>
          </GameCard>
        </GameSection>
        <SectionTitle>리더보드</SectionTitle>
        <LeaderboardSection>
          <Leaderboard />
        </LeaderboardSection>
      </GameContainer>
    </Layout>
  );
};

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 0.5rem;
  }
`;

const SectionTitle = styled.h2`
  text-align: center;
  margin-bottom: 1rem;
  width: 100%;
`;

const GameSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 2rem;
`;

const GameCard = styled(Link)`
  display: flex;
  align-items: center;
  padding: 1.5rem;
  background-color: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  text-decoration: none;
  color: #333;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background-color: #f0f0f0;
  border-radius: 50%;
  margin-right: 1rem;
`;

const GameText = styled.span`
  font-size: 1.2rem;
  font-weight: bold;
`;

const LeaderboardSection = styled.div`
  width: 100%;
`;

export default GamePage;

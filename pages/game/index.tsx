import React, { useState } from "react";
import Link from "next/link";
import styled from "@emotion/styled";
import ReactionGame from "../../components/game/ReactionGame";
import Layout from "../../components/Layout";

const GamePage: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const handleGameSelect = (game: string) => {
    setSelectedGame(game);
  };

  return (
    <Layout>
      <Container>
        {selectedGame === null ? (
          <>
            <h1>Select a Game</h1>
            <GameList>
              <li>
                <GameLink onClick={() => handleGameSelect("reaction")}>
                  Reaction Game
                </GameLink>
              </li>
              {/* 다른 게임이 추가되면 여기에 추가 */}
            </GameList>
            <Link href="/game/halloffame">
              <HallOfFameLink>명예의 전당</HallOfFameLink>
            </Link>
          </>
        ) : (
          <GameContainer>
            {selectedGame === "reaction" && <ReactionGame />}
          </GameContainer>
        )}
      </Container>
    </Layout>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 50px;
`;

const GameList = styled.ul`
  list-style-type: none;
  padding: 0;
`;

const GameLink = styled.a`
  padding: 10px 20px;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  font-size: 18px;
  margin-bottom: 10px;
  display: inline-block;

  &:hover {
    background-color: #0056b3;
  }
`;

const HallOfFameLink = styled.a`
  padding: 10px 20px;
  background-color: #ff6347;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  font-size: 18px;
  margin-top: 20px;
  display: inline-block;

  &:hover {
    background-color: #e55347;
  }
`;

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export default GamePage;

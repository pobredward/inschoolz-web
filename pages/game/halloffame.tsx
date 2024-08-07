import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styled from '@emotion/styled';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Layout from '../../components/Layout';

const HallOfFame: React.FC = () => {
  const [scores, setScores] = useState<any[]>([]);

  useEffect(() => {
    const fetchScores = async () => {
      const q = query(collection(db, 'scores'), orderBy('time'), limit(10));
      const querySnapshot = await getDocs(q);
      const scoresData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setScores(scoresData);
    };

    fetchScores();
  }, []);

  return (
    <Layout>
      <Container>
        <Title>명예의 전당</Title>
        <ScoreTable>
          <thead>
            <tr>
              <th>순위</th>
              <th>유저명</th>
              <th>학교명</th>
              <th>점수</th>
              <th>지역</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((score, index) => (
              <tr key={score.id}>
                <td>{index + 1}</td>
                <td>{score.user}</td>
                <td>{score.schoolName}</td>
                <td>{score.time} ms</td>
                <td>{score.address1} {score.address2}</td>
              </tr>
            ))}
          </tbody>
        </ScoreTable>
        <Link href="/game">
          <BackLink>게임 선택으로 돌아가기</BackLink>
        </Link>
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

const Title = styled.h1`
  margin-bottom: 20px;
`;

const ScoreTable = styled.table`
  width: 100%;
  max-width: 800px;
  border-collapse: collapse;
  margin: 0 auto;

  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }

  th {
    background-color: #f2f2f2;
  }

  tbody tr:nth-of-type(even) {
    background-color: #f9f9f9;
  }
`;

const BackLink = styled.a`
  padding: 10px 20px;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  font-size: 18px;
  margin-top: 20px;
  display: inline-block;

  &:hover {
    background-color: #0056b3;
  }
`;

export default HallOfFame;

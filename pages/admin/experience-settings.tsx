// pages/admin/experience-settings.tsx

import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { experienceSettingsRef } from '../../lib/firebase';
import { getExperienceSettings } from '../../utils/experience';
import styled from '@emotion/styled';

const ExperienceSettingsPage = () => {
  const [settings, setSettings] = useState({
    postCreation: 0,
    commentCreation: 0,
    reactionGameThreshold: 0,
    reactionGameExperience: 0,
    flappyBirdThreshold: 0,
    flappyBirdExperience: 0,
    friendInvitation: 0,
    maxDailyGames: 0,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const currentSettings = await getExperienceSettings();
      setSettings(currentSettings);
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: parseInt(value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateDoc(doc(experienceSettingsRef, 'default'), settings);
    alert('설정이 업데이트되었습니다.');
  };

  return (
    <Container>
      <h1>경험치 설정</h1>
      <Form onSubmit={handleSubmit}>
        {Object.entries(settings).map(([key, value]) => (
          <FormGroup key={key}>
            <label htmlFor={key}>{key}</label>
            <Input
              type="number"
              id={key}
              name={key}
              value={value}
              onChange={handleChange}
            />
          </FormGroup>
        ))}
        <Button type="submit">설정 저장</Button>
      </Form>
    </Container>
  );
};

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FormGroup = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Input = styled.input`
  width: 100px;
  padding: 5px;
`;

const Button = styled.button`
  padding: 10px;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
`;

export default ExperienceSettingsPage;

import React, { useState } from "react";
import styled from "@emotion/styled";
import { updateUserProfile } from "../../lib/firebase";

const BirthdayModal = ({ isOpen, onClose, user, setUser }) => {
  const [birthYear, setBirthYear] = useState(user?.birthYear || "");
  const [birthMonth, setBirthMonth] = useState(user?.birthMonth || "");
  const [birthDay, setBirthDay] = useState(user?.birthDay || "");
  const [error, setError] = useState("");

  const handleChange = async () => {
    try {
      await updateUserProfile(user.uid, { birthYear, birthMonth, birthDay });
      setUser((prevUser) => ({
        ...prevUser,
        birthYear,
        birthMonth,
        birthDay,
      }));
      onClose();
    } catch (error) {
      console.error("Error updating birthday:", error);
      setError("생년월일 업데이트 중 오류가 발생했습니다.");
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay>
      <Modal>
        <h2>생년월일 변경</h2>
        <Input
          type="number"
          value={birthYear}
          onChange={(e) => setBirthYear(e.target.value)}
          placeholder="년 (YYYY)"
        />
        <Input
          type="number"
          value={birthMonth}
          onChange={(e) => setBirthMonth(e.target.value)}
          placeholder="월 (MM)"
        />
        <Input
          type="number"
          value={birthDay}
          onChange={(e) => setBirthDay(e.target.value)}
          placeholder="일 (DD)"
        />
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Button onClick={handleChange}>변경</Button>
        <Button onClick={onClose} secondary>취소</Button>
      </Modal>
    </Overlay>
  );
};

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const ErrorMessage = styled.div`
  color: red;
  margin-bottom: 1rem;
`;

const Button = styled.button<{ secondary?: boolean }>`
  padding: 0.75rem 1.5rem;
  background-color: ${(props) => (props.secondary ? "#ccc" : "#0070f3")};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  margin-right: ${(props) => (props.secondary ? "0" : "0.5rem")};

  &:hover {
    background-color: ${(props) => (props.secondary ? "#999" : "#0056b3")};
  }
`;

export default BirthdayModal;

import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { updateUserProfile } from "../../lib/firebase";
import SchoolSearch from "../SchoolSearch";

const SchoolModal = ({ isOpen, onClose, user, setUser }) => {
  const [newSchool, setNewSchool] = useState(user?.schoolName || "");
  const [error, setError] = useState("");
  const [isChangingAllowed, setIsChangingAllowed] = useState(true);

  useEffect(() => {
    const lastChanged = user?.lastSchoolChanged?.toDate();
    if (lastChanged) {
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastChanged.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setIsChangingAllowed(diffDays > 30);
    }
  }, [user]);

  const handleChange = async () => {
    if (!isChangingAllowed) {
      setError("학교 정보는 30일에 한 번만 변경할 수 있습니다.");
      return;
    }

    try {
      await updateUserProfile(user.uid, { schoolName: newSchool, lastSchoolChanged: new Date() });
      setUser((prevUser) => ({
        ...prevUser,
        schoolName: newSchool,
        lastSchoolChanged: new Date(),
      }));
      onClose();
    } catch (error) {
      console.error("Error updating school:", error);
      setError("학교 업데이트 중 오류가 발생했습니다.");
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay>
      <Modal>
        <h2>학교 변경</h2>
        <SchoolSearch
          address1={user?.address1}
          address2={user?.address2}
          setSchool={(school) => setNewSchool(school.KOR_NAME)}
        />
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Button onClick={handleChange} disabled={!isChangingAllowed}>변경</Button>
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

export default SchoolModal;

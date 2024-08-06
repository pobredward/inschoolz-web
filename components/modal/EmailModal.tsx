import React, { useState } from "react";
import styled from "@emotion/styled";
import { updateUserProfile } from "../../lib/firebase";
import { User } from "../../store/atoms";

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  user,
  setUser,
}) => {
  const [newEmail, setNewEmail] = useState(user?.email || "");
  const [error, setError] = useState("");

  const handleChange = async () => {
    try {
      console.log("Updating email for user:", user);
      await updateUserProfile(user.uid, { email: newEmail });
      setUser((prevUser) => ({
        ...prevUser!,
        email: newEmail,
      }));
      onClose();
    } catch (error) {
      console.error("Error updating email:", error);
      setError(`이메일 업데이트 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay>
      <Modal>
        <h2>이메일 변경</h2>
        <Input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="새 이메일 입력"
        />
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Button onClick={handleChange}>변경</Button>
        <Button onClick={onClose} secondary>
          취소
        </Button>
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

export default EmailModal;

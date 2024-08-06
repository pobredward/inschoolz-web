import React, { useState } from "react";
import styled from "@emotion/styled";
import { updateUserProfile } from "../../lib/firebase";
import AddressSelector from "../AddressSelector";

const AddressModal = ({ isOpen, onClose, user, setUser }) => {
  const [address1, setAddress1] = useState(user?.address1 || "");
  const [address2, setAddress2] = useState(user?.address2 || "");
  const [error, setError] = useState("");

  const handleChange = async () => {
    try {
      await updateUserProfile(user.uid, { address1, address2 });
      setUser((prevUser) => ({
        ...prevUser,
        address1,
        address2,
      }));
      onClose();
    } catch (error) {
      console.error("Error updating address:", error);
      setError("지역 업데이트 중 오류가 발생했습니다.");
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay>
      <Modal>
        <h2>지역 변경</h2>
        <AddressSelector
          address1={address1}
          address2={address2}
          setAddress1={setAddress1}
          setAddress2={setAddress2}
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

export default AddressModal;

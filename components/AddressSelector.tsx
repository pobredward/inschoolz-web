import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase"; // 클라이언트 측 Firebase 설정

interface AddressSelectorProps {
  address1: string;
  address2: string;
  setAddress1: (value: string) => void;
  setAddress2: (value: string) => void;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({
  address1,
  address2,
  setAddress1,
  setAddress2,
}) => {
  const [address1Options, setAddress1Options] = useState<string[]>([]);
  const [address2Options, setAddress2Options] = useState<string[]>([]);

  useEffect(() => {
    const fetchAddress1Options = async () => {
      const querySnapshot = await getDocs(collection(db, "regions"));
      const options = querySnapshot.docs.map((doc) => doc.id);
      setAddress1Options(options);
    };
    fetchAddress1Options();
  }, []);

  useEffect(() => {
    const fetchAddress2Options = async () => {
      if (address1) {
        const docRef = doc(db, "regions", address1);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAddress2Options(docSnap.data().sigungu);
        }
      } else {
        setAddress2Options([]);
      }
    };
    fetchAddress2Options();
  }, [address1]);

  return (
    <>
      <Select
        value={address1}
        onChange={(e) => {
          setAddress1(e.target.value);
          setAddress2("");
        }}
      >
        <option value="">시/도 선택</option>
        {address1Options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
      <Select
        value={address2}
        onChange={(e) => setAddress2(e.target.value)}
        disabled={!address1}
      >
        <option value="">시/군/구 선택</option>
        {address2Options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    </>
  );
};

const Select = styled.select`
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

export default AddressSelector;

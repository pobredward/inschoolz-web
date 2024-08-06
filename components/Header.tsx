import React from "react";
import styled from "@emotion/styled";
import Navbar from "./Navbar";

const Header: React.FC = () => {
  return (
    <HeaderWrapper>
      <Navbar />
    </HeaderWrapper>
  );
};

const HeaderWrapper = styled.header`
  background-color: #f0f0f0;
  padding: 1rem;
`;

export default Header;

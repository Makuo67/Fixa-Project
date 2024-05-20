import styled from "styled-components";

export const StyledLayout = styled.div`
  height: fit-content;
  display: flex;
  flex-direction: column;
  // background-color: ${(prop) => (prop.isPayment ? "#F2FAFD" : "white")};
  background-color: #f2fafd;
  width: 100%;
  
  .content-layout {
    width: 100%;
    display: flex;
    flex-direction: row;
    flex-grow: 1;
  }
  .main {
    flex-grow: 1;
  }

  .ant-divider-horizontal {
    margin: 0px;
    margin-bottom: 10px;
    margin-top: 10px;
  }

  .image-svg {
    fill: black;
  }

`;

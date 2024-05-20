import styled from "styled-components";

export const Content = styled.div`
  flex-grow: 1;
  padding: ${(prop) => (prop.isWorkerProfile ? "0px" : "0 40px")};
  margin-bottom: 40px;
`;

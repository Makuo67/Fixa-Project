import styled from "styled-components";

export const StyledProfileModals = styled.div`
  .actionButton {
    font-style: normal;
    font-weight: 450;
    font-size: 18px;
    line-height: 22px;
    color: white;
    background: var(--primary);
    height: 38px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 8px 0px;
    gap: 8px;
    box-shadow: 0px 2px 0px rgba(0, 0, 0, 0.043);
    border-radius: 5px;
    width: 120px;
    height: 38px;
    margin-left: 80px;
  }
  .cancelButton {
    font-style: normal;
    font-weight: 450;
    font-size: 18px;
    line-height: 22px;
    color: black;
    height: 38px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 8px 0px;
    gap: 8px;
    background: white;
    box-shadow: 0px 2px 0px rgba(0, 0, 0, 0.043);
    border-radius: 5px;
    border: 1px solid var(--tertiary);
    width: 120px;
    height: 38px;
  }
  .ant-input {
    width: 280px;
    height: 35px;
    border: 1px solid #ccdbe1;
    border-radius: 5px;
  }
`;

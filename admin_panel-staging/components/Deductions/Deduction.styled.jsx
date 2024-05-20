import styled from "styled-components";

export const StyledDeductions = styled.div`
.container {
  height: fit-content;
  display: flex;
  flex-direction: column;
  background: #FFF !important;
  padding: 10px 20px;
  border-radius: 4px;
  gap: 10px;
}
   .deductions-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 10px;
    gap: 12px;
    height: 44px;
    background: #e4eef3;
    border-radius: 5px;

    span {
      font-style: normal;
      font-weight: 500;
      font-size: 16px;
      line-height: 20px;
      color: #414a52;
      width: 100%;
    }
  }

  .Add-deductions-container{
    .ant-select-selector {
      border: 1px solid #ccdbe1;
      border-radius: 5px;
      line-height: 0px;
    }
  }
  .deductions-container {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    padding: 2px 4px;
    width: 100%;
    height: 64px;

    span {
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 12px 24px;
      gap: 12px;
      width: 100%;
      height: 40px;
      border-radius: 5px;
      border: 1px solid #d4d7d9;
    }
    .icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 44px;
      width: 44px;
      border: 2px solid #e4eef3;
      border-radius: 5px;
      cursor: pointer;
    }
    .ant-select-selector {
      border: 1px solid #ccdbe1;
      border-radius: 5px;
      line-height: 0px;
    }
  }

  .submit-buttons-container {
    display: flex;
    padding: 20px 0px;
    align-items: center;
    justify-content: end;
    gap: 20px; 

    .save {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      padding: 9px 15px;
      gap: 10px;
      width: 144px;
      height: 40px;
      background: var(--primary);
      color: var(--button-color);
      border-radius: 5px;
      border: none;
    }

    .cancel {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      padding: 9px 15px;
      gap: 10px;
      width: 144px;
      height: 38px;
      background: #e4eef3;
      color: #000;
      border-radius: 5px;
      border: none;
    }
  }
`;

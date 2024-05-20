import styled from "styled-components";

export const StyledProjectRates = styled.div`
  padding: 0px !important;
  margin: 0px !important;
  .container {
    background-color: #ffffff;
    padding: 0px;
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .project-rates-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 24px;
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
    }
  }

  .rate-container,
  .add-rates-container {
    display: flex;
    // flex-wrap: wrap;
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    padding: 10px;
    width: 100%;
    height: 64px;

    input {
      padding: 12px 24px;
      gap: 12px;
      width: 550px;
      height: 40px;
      background: #f7fbfe;
      border: 1px solid #d4d7d9;
      border-radius: 5px;
      order: 0;
      flex: 1;
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
  

  .add-button-container {
    display: flex;
    padding: 10px;
    
    .add-button {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      padding: 12px 24px;
      gap: 8px;
      width: 100px;
      height: 42px;
      border: 1px solid var(--tertiary);
      border-radius: 5px;

      span {
        font-style: normal;
        font-weight: 500;
        font-size: 14px;
        line-height: 18px;
        display: flex;
        align-items: center;
        color: #000;
      }
    }
  }

  .submit-buttons-container {
    display: flex;
    padding: 10px;
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
      border: none;
      color: #ffffff;
      border-radius: 5px;
    }

    .cancel {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      padding: 9px 15px;
      gap: 10px;
      width: 144px;
      height: 40px;
      background: #ffffff;
      color: #000;
      border-radius: 5px;
      border: 1px solid var(--tertiary);
    }
  }
`;

import styled from "styled-components";

export const StyledEditor = styled.div`
  .form {
    display: flex;
    margin: 20px 0px 0px 30px;
  }
  .cancel {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 8px 16px;
    width: 140px;
    height: 40px;
    background: #ffffff;
    border: 1px solid var(--tertiary);
    box-shadow: 0px 2px 0px rgba(0, 0, 0, 0.016);
    border-radius: 5px;
  }
  .save {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 8px 16px;
    gap: 8px;
    width: 140px;
    height: 38px;
    background: var(--primary);
    border: none;
    color: #ffffff;
    box-shadow: 0px 2px 0px rgba(0, 0, 0, 0.043);
    border-radius: 5px;
  }
  .button, .button:hover {
    font-style: normal;
    font-weight: 450;
    font-size: 14px;
    line-height: 22px;
    // color: white;
    height: 38px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 8px 0px;
    gap: 8px;
    background: var(--primary);
    border: none;
    box-shadow: 0px 2px 0px rgba(0, 0, 0, 0.043);
    border-radius: 5px;
    width: 120px;
    height: 38px;
    margin-top: 125px;
    margin-left: 215px;
  }
  .dragger {
    height: 50px;
    width: 200px;
  }
  .left-inputs {
    margin-left: 40px;
  }
  .ant-input {
    width: 330px;
    height: 40px;
    border: 1px solid #ccdbe1;
    border-radius: 5px;
  }
  .ant-upload.ant-upload-drag {
    width: 330px;
    height: 150px;
    background: #f2fafd;
  }
  .ant-upload.ant-upload-drag p.ant-upload-hint {
    font-size: 13px;
  }
  .ant-upload.ant-upload-drag p.ant-upload-text {
    font-size: 13px;
  }

  .input {
    margin-top: 30px;
  }

  .title {
    font-style: normal;
    font-weight: 500;
    font-size: 24px;
    line-height: 30px;
    color: #000000;
    display: flex;
    justify-content: flex-start;
    text-align: center;
    width: 140px;
    height: 30px;
    position: relative;
    top: 12px;
  }

  .import {
    font-style: normal;
    font-weight: 500;
    font-size: 21px;
    line-height: 30px;
    color: #000000;
  }
  .supervisor {
    font-size: 15px;
    line-height: 10px;
    width: 10px;
    height: 5px;
    top: 5px;
  }

  .changepass {
    font-size: 16px;
  }

  .modalTitle {
    display: flex;
    justify-content: flex-start;
    text-align: center;
    width: fit-content;
    height: 30px;
    position: relative;
    top: 12px;
  }
`;

export default StyledEditor;

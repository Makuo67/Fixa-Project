import styled from "styled-components";

export const StyledAddClient = styled.div`
  .progress {
    background: #f2fafd;
    padding: 12px;
    width: 750px;
    height: 52px;
  }
  .client-info {
    display: flex;
    gap: 50px;
    padding: 40px;
  }
  .nextButton {
    font-style: normal;
    font-weight: 450;
    font-size: 18px;
    line-height: 22px;
    color: white;
    height: 38px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 8px 0px;
    gap: 8px;
    background: #00a1de;
    box-shadow: 0px 2px 0px rgba(0, 0, 0, 0.043);
    border-radius: 5px;
    width: 120px;
    height: 38px;
    margin-left: 20px;
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

    box-shadow: 0px 2px 0px rgba(0, 0, 0, 0.043);
    border-radius: 5px;
    width: 120px;
    height: 38px;
    margin-left: 215px;
  }
  .buttons {
    display: flex;
  }
  .buttons2 {
    display: flex;
    margin-top: 50px;
    gap: 50px;
  }

  .ant-input {
    width: 330px;
    height: 40px;
    border: 1px solid #ccdbe1;
    border-radius: 5px;
  }
  .ant-select {
    width: 330px;
    border: 1px solid #ccdbe1;
    border-radius: 5px;
    line-height: 0px;
  }
  .ant-upload.ant-upload-drag {
    background: #f2fafd;
    padding: 10px;
    height: 180px;
    font-size: 15px;
  }

  .ant-upload-text-icon {
    display: ${props => (props.progress === 100 ? `none` : `block`)};
  }
`;

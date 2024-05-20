import styled from "styled-components";

export const StyledInvoice = styled.div`
  .title {
    font-family: "Circular Std";
    font-style: normal;
    font-weight: 500;
    font-size: 32px;
    line-height: 40px;
    color: #003447;
  }
  .sub-title {
    font-family: "Circular Std";
    font-style: normal;
    font-weight: 450;
    font-size: 24px;
    text-transform: capitalize;
    color: #798c9a;
  }

  .input-container {
    width: 70%;
  }
  .inputs {
    display: flex;
    gap: 50px;
    justify-content: space-between;
    div {
      flex-grow: 1;
      /* width: 100%; */
    }
  }
  .invoice-inputs {
    display: flex;
  }
  .divider {
    margin-left: 30px;
  }
  .upload {
    gap: 50px;
    margin-left: 30px;
  }
  .ant-upload.ant-upload-drag {
    background: #f2fafd;
    padding: 10px;
    height: 150px;
    width: 100%;
    font-size: 4px;
  }
  .ant-upload.ant-upload-drag p.ant-upload-text {
    font-size: 12px;
  }
  .form {
    background: white;
    padding: 40px;
    width: 100%;
  }
  .ant-input {
    width: 100%;
    height: 40px;
    border: 1px solid #ccdbe1;
    border-radius: 5px;
  }

  .ant-picker:hover,
  .ant-picker-focused {
    border-color: #40a9ff;
    border-right-width: 1px;
  }
  .ant-picker-focused {
    border-color: #40a9ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    border-right-width: 1px;
    outline: 0;
  }

  .ant-picker {
    width: 100%;
    height: 40px;
    border: 1px solid #ccdbe1;
    border-radius: 5px;
  }
  .ant-select {
    width: 100%;
    border: 1px solid #ccdbe1;
    border-radius: 5px;
    line-height: 0px;
  }
  .ant-divider-vertical {
    height: 95%;
    border-left: 3px solid #f2fafd;
  }
  .buttons {
    display: flex;
    margin-top: 20px;
    float: right;
  }

  .settingsHeader {
    display: flex;
    justify-content: space-between;
    padding: 40px 40px 20px 0px;
  }
  .invoiceCard {
    width: 60%;
    height: 500px;
    border: 1px solid #ccdbe1;
    border-radius: 5px;
    margin-left: 18%;
    padding: 24px 48px;
  }
  .main-heading {
    text-align: center;
  }
  .sub-heading {
    color: #798c9a;
    font-family: "Circular Std";
    font-style: normal;
    font-weight: 450;
    font-size: 16px;
    line-height: 150%;
  }
  .invoice-detail {
    color: #798c9a;
    font-family: "Circular Std";
    font-style: normal;
    font-weight: 450;
    font-size: 12px;
    line-height: 150%;
  }
  .invoice-info {
    margin-left: 10px;

    .detail-item {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
    }
  }
  .invoice-detail {
    width: 124px;
    margin: 0;
  }
  .detail-data {
    font-family: "Circular Std";
    font-style: normal;
    font-weight: 450;
    font-size: 14px;
    line-height: 150%;
    color: #37414d;
    margin: 0;
    width: calc(100% - 200px);
  }

  .company-name {
  }

  .detail-data-status-draft {
    width: 70px;
    height: 19px;
    background: #dcebf1;
    border-radius: 10px;
    font-family: "Circular Std";
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 15px;
    color: #2c3336;
    padding: 3px;
    padding-left: 10px;
  }

  .files {
    margin-top: 28px;
    display: flex;
  }

  .files div {
    width: 100%;
  }
  .file-name {
    color: #00a1de;
    text-decoration: underline;
    cursor: pointer;
    display: flex;
    align-items: center;
  }
  .editButton {
    font-style: normal;
    font-weight: 450;
    font-size: 18px;
    line-height: 22px;
    color: #ffffff;
    background: green;
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
    width: 150px;
    height: 38px;
    margin: 0 auto;
    margin-top: 24px;
  }
  .invoice-divider {
    margin-top: 20px;
    height: 1px;
    width: 100%;
    border: 0;
    background: #a8bec5;
  }
  @media screen and (max-width: 1248px) {
    .invoiceCard {
      width: 80%;
      margin-left: 10%;
    }
  }
  @media screen and (max-width: 1024px) {
    .invoiceCard {
      width: 90%;
      margin-left: 6%;
    }
  }
  @media screen and (max-width: 1280px) {
    .ant-upload.ant-upload-drag {
      height: 180px;
    }
  }
`;

export const StyledTeaxtArea = styled.div`
  .ant-input {
    width: 100%;
  }
`;

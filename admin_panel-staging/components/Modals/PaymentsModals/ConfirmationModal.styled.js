import styled from "styled-components";

export const StyledConfirmationModal = styled.div`
  .content {
    text-align: center;
    /* padding-left: 50px; */
    /* padding-top: 20px; */
  }

  button {
    background: #00a1de;
    border: none;
    border-radius: 5px;
    font-style: normal;
    font-weight: 700;
    font-size: 18px;
    line-height: 22px;
    color: white;
    padding: 10px;
    cursor: pointer;
    width: 60%;
  }

  // .enter-otp {
  //   /* padding-left: 40px; */
  //   padding-bottom: 20px;
  //   display: flex;
  //   flex-direction: column;
  //   align-items: center;
  // }

  .inputStyle {
    width: 40px !important;
    height: 35px;
    border-radius: 7px;
    border: 0.5px solid #d4d7d9;
    background: white;
    color: black;
    font-size: 15px;
    margin-right: 10px;
  }

  // .verification {
  //   /* margin-left: 140px; */
  //   /* margin-top: 60px; */
  // }
  
  .message {
    /* width: 333px; */
    font-family: "Circular Std";
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    color: #757c8a;
  }

  .messageSending {
    font-family: "Circular Std";
    font-style: normal;
    font-weight: 600;
    font-size: 20px;
    color: #757c8a;
  }
  .ant-select-selector {
    background: green;
  }
  .inputStyle2 {
    width: 40px !important;
    height: 35px;
    border-radius: 7px;
    border: 0.5px solid #d4d7d9;
    background: white;
    color: white;
    font-size: 15px;
    margin-right: 10px;
  }
`;

export const ModalTitle = styled.div`
  .text-styles {
    font-style: normal;
    font-weight: 620;
    font-size: 17px;
    line-height: 30px;
    color: #000000;
  }

  .modalTitle {
    display: flex;
    justify-content: flex-start;
    text-align: center;
    width: 140px;
    height: 30px;
    position: relative;
    top: 12px;
    font-size: 10px;
    color: black;
  }
`;

export const Message = styled.div`
  .messageStyle {
    width: 333px;
    font-family: "Circular Std";
    font-style: normal;
    font-weight: 700;
    font-size: 16px;
    color: #757c8a;
  }
`;


export const StyledDeductionsSummary = styled.div`
    font-weight: 500;
    font-size: 16px;
    padding: 24px;
    
  .confirmation-text {
    font-weight: bolder;
    font-size: 16px;
    text-align: center;
    padding-bottom: 16px;
  }

  .earnings-container {
    display: flex;
    flex-direction: column;
    gap: 12px;

  }
  .earnings-container > div {
     background-color: #E4EEF3;
    padding: 12px;
    border-radius: 5px;
  }
  .earnings-item {
    display: flex;
    justify-content: space-between;
    div {
      font-weight: bolder;
      font-size: 20px;
      width: 50%;
    }
  }
  .earnings-subitem {
   
    display: flex;
    justify-content: space-between;
    font-weight: normal;
    font-size: 16px;

    div {
      
      font-weight: normal;
      font-size: 16px;
      width: 50%;
    }
    .label {
      padding-left: 12px;
      text-transform: capitalize;
      font-weight: bold;
    }
  }

  .earnings-summary {
    background-color: #E4EEF3;
    padding: 12px;
    border-radius: 5px;
    display: flex;
    justify-content: space-between;
  }

`

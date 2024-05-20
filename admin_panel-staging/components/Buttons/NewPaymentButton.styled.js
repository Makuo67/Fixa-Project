import styled from "styled-components";

export const StyledPaymentButton = styled.div`
  .newPayment {
    display: "flex";
    flex-direction: "column";
    align-items: "center";
    padding: "8px 0px";
    gap: 8px;
    width: 168px;
    height: 40px;
    // background: #00a1de;
    background-color: "var(--primary)",
    box-shadow: 0px 2px 0px 0px rgba(0, 0, 0, 0.04);
    border-radius: 5px;
    color: "var(--button-color)";
  }
  .inviteButton{
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    // background: #00A1DE;
    background: var(--primary);
    border: none;
    box-shadow: 0px 2px 0px 0px rgba(0, 0, 0, 0.04);
    border-radius: 5px;
    padding: 8px 0px;
    gap: 8px;
    width: 168px;
    height: 40px;
    font-style: normal;
    font-weight: 450;
    font-size: 14px;
    line-height: 22px;
    color: "var(--button-color)"
  }
  .newButton {
    font-style: normal;
    font-weight: 450;
    font-size: 14px;
    line-height: 22px;
    color: "var(--button-color)"
    width: ${(props) => props.isTax ? "100% !important" : props.isCasual ? "100% !important" : "auto"};
    height: 40px !important;
    background: var(--primary);
    border:none;
  }
  .exportPayment {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 8px 0px;
    gap: 8px;
    background: var(--primary);
    // background: #00a1de;
    box-shadow: 0px 2px 0px 0px rgba(0, 0, 0, 0.04);
    border-radius: 5px;
    border: none;
    width: 120px;
    height: 40px;
  }
  .disabled {
    opacity: 0.5;
  }
  
  .payoutButtonContainer {
    display: flex;
    position: relative;
    flex-direction: row;
    align-items: start;
    padding: 0px;
    gap: 5px;
    right: 15px;
  }

  // .addPayee {
  //   display: flex;
  //   flex-direction: row;
  //   justify-content: center;
  //   align-items: center;
  //   padding: 8px 5px;
  //   //  gap: 5px;
  //   font-style: normal;
  //   font-weight: 450;
  //   font-size: 14px;
  //   line-height: 22px;
  //   color: "var(--button-color)";
  //   width: fit-content;
  //   height: 40px;
  //   background: var(--primary);
  //   box-shadow: 0px 2px 0px 0px rgba(0, 0, 0, 0.04);
  //   border-radius: 5px;
  //   border: none;
  // }
  .uploadCsvexcel {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: flex-start;
    padding: 8px 5px;
    width: 168px;
    height: 40px;
    color: #000;
  }

  .actionButton {
    font-style: normal;
    font-weight: 450;
    font-size: 15px;
    line-height: 22px;
    color: "var(--button-color)";
    background: var(--primary);
    border:none;
    height: 40px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 8px 0px;
    gap: 8px;
    // background: #00a1de;
    box-shadow: 0px 2px 0px 0px rgba(0, 0, 0, 0.04);
    border-radius: 5px;
    width: 120px;
    height: 40px;
  }
  .closeButton{
    font-style: normal;
    font-weight: 450;
    font-size: 18px;
    line-height: 22px;
    color: "var(--button-color)";
    background: green;
    height: 40px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 8px 0px;
    gap: 8px;
    background: var(--primary);
    box-shadow: 0px 2px 0px 0px rgba(0, 0, 0, 0.04);
    border-radius: 5px;
    width: 120px;
    height: 40px;
  }
  .rerunButton{
    font-style: normal;
    font-weight: 450;
    font-size: 18px;
    line-height: 22px;
    color: "var(--button-color)";
    height: 40px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 8px 0px;
    gap: 8px;
    box-shadow: 0px 2px 0px 0px rgba(0, 0, 0, 0.04);
    border-radius: 5px;
    height: 40px;
    // background:#00a1de;
    background: var(--primary);
    border:none;
    width: 260px;
  }
  .smsButton {
    font-style: normal;
    font-weight: 450;
    font-size: 15px;
    line-height: 22px;
    color: "var(--button-color)";
    height: 40px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 8px 8px;
    gap: 8px;
    // background: #00A1DE;
    background: var(--primary);
    border:none;
    box-shadow: 0px 2px 0px 0px rgba(0, 0, 0, 0.04);
    border-radius: 5px;
    width: fit-content;
    height: 40px;
  }

  .closePayoutButton{
    font-style: normal;
    font-weight: 350;
    font-size: 18px;
    line-height: 22px;
    color: "var(--button-color)";
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 8px 0px;
    gap: 5px;
    // background: #389E0D;
    background: var(--primary);
    border:none;
    box-shadow: 0px 2px 0px rgba(0, 0, 0, 0.043);
    border-radius: 5px;
    width: 148px;
    height: 40px;
  }
`;

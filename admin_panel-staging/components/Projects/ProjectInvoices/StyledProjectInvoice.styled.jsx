import styled from "styled-components";

export const StyledProjectInvoice = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  .invoice-header-right{
    display: flex;
    justify-content: space-between;
    
    h2{
      font-style: normal;
      font-weight: 500;
      font-size: 24px;
      line-height: 30px;
      color: #24282C;
    }
    .new-invoice-button{
      padding: 4px 16px;
      width: 111px;
      height: 40px;
      background: #00A1DE;
      color: #ffffff;
      box-shadow: 0px 2px 0px rgba(0, 0, 0, 0.043);
      border-radius: 5px;
    }
  }
  .certificate, .ebm{
    display: flex;
    justify-content: center;
    align-items: center;
    font-style: normal;
    font-weight: 300;
    font-size: 20px;
    line-height: 22px;
    text-align: center;
    .ebm_text, .certificate_text {
      font-style: normal;
      font-weight: 450;
      font-size: 14px;
      line-height: 22px;
      text-decoration-line: underline;
      color: #00A1DE;
    }
  }
`;

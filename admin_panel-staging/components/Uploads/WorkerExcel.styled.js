import styled from "styled-components";

export const StyledUploadButton = styled.div`
.next, .next:hover{
  height: 40px;
  background: var(--primary);
  border-radius: 5px;
  border: none;
  color: var(--secondary);
}
`
const Content = styled.div`
  .import {
    font-style: normal;
    font-weight: 500;
    font-size: ${(prop) => (prop.confirmPayment ? "16px" : "24px")};
    /* line-height: 30px; */
    color: #000000;
  }
  .info {
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 20px;
    color: #000000;
  }
  .edit-shifts {
    display: flex;
    justify-content: flex-start;
    text-align: center;
    position: relative;
    top: 12px;
    font-size: 20px;
  }

  .modalTitle {
    display: flex;
    justify-content: flex-start;
    text-align: center;
    width: 100%;
    // it was 140px !!
    height: 30px;
    position: relative;
    top: 12px;
  }
  
  .payrollContent {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-left: 24px;
    gap: 34px;
    isolation: isolate;
    width: 500px;
    height: 325px;
    border-radius: 10px;
  }
  .contentTitle {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0px;
    gap: 5px;
    width: 500px;
    height: 65px;
  }

  .payrollBody {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: 0px;
    gap: 24px;
    width: 500px;
    height: 94px;
  }

  .payrollProject {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0px;
    width: 340px;
    height: 92px;
  }

  .payrollPeriod {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0px;
    width: 341.5px;
    height: 94px;
  }
  .payoutContent {
    display: flex;
    flex-direction: column;
    padding-left: 24px;
    gap: 20px;
    isolation: isolate;
    width: 550px;
    height: 325px;
    border-radius: 10px;
  }
  .payoutBody {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0px;
    width: 500px;
    height: 345px;
  }
  .payoutInputSection {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0px 0px 24px;
    width: 500px;
    height: 92px;
  }

  .payoutTextAreaSection {
    height: 150px;
  }

  .PayeeContent{
    display: flex;
    flex-direction: column;
    padding-left: 24px;
    gap: 20px;
    isolation: isolate;
    width: 400px;
    height: 325px;
    border-radius: 10px; 
  }
  // .ant-modal-content {
  //   width: 450px;
  // }

  .payeeBody{
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0px;
    width: 400px;
    height: 345px;  
    .ant-select-selector {
      border: 1px solid #ccdbe1;
      border-radius: 5px;
      line-height: 0px;
    }
  }

  .payeeInputSection {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0px 0px 24px;
    width: 350px;
    height: 92px;
  }

  .excelContent {
    display: flex;
    flex-direction: column;
    padding-left: 24px;
    gap: 20px;
    width: 620px;
    height: 325px;
    border-radius: 10px; 
  }
  
  // .excelTitle {
  //   display: flex;
  //   justify-content: flex-start;
  //   text-align: center;
  //   height: 30px;
  //   position: relative;
  //   top: 20px;
  // }

  .excelBody{
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 34px;
  }

  .excelproject {
    display: flex;
    flex-direction: row;
    gap: 20px;
    border-radius: 10px; 
  }

  .excelDescription {
    width: 756px;
  }

  .excelContentPayout {
    display: flex;
    flex-direction: column;
    padding-left: 24px;
    gap: 20px;
    width: 700px;
    height: 250px;
    border-radius: 10px; 
  }

  .excelBodyPayout{
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 34px;
    width: 700px;
    height: 350px;
  }

  .fileInfoSection{
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0px;
    gap: 12px;
    
    // width: 904px;
    height: 59px;
  }

  .fileName {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 0px;
    gap: 11px;
    
    width: 700px;
    height: 36px;
  }

  .progressSection {
    width: 700px;
    height: 11px;
    left: 0px;
    top: 48px;
  
  }

  .excelErrorWrapper {
    display: flex;
    border: medium solid red;
    border-width: 2px;
    height: 50px;
    border-radius: 5px;
    margin-top: 5px;
    padding: 5px 5px 6px 10px;
    justify-content: flex-start;
    width: 700px;
    flex-direction: row;
    align-items: center;
    padding: 24px;
    gap: 24px; 
    background: #FFFFFF;    
  }

  .excelErrorTitle {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: 10px;
    gap: 10px;
  }

  .errorCountTitle{
    margin-top: 9px;
    color: #FF0000;
    ;
  }

  .excelErrorSection {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: 4px 1px;
    gap: 20px;
  }

.excelError {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 4px 8px;
  background: #FFDCDC;
  border-radius: 5px;
  // width: 110px;
  height: 26px;
}

.excelErrorName{
  font-style: normal;
  font-weight: 500;
  font-size: 15px;
  line-height: 18px;
  color: #FF0000;
   
}

.excelReupload {
  display:flex;
  cursor: pointer;
}

.excelErrorcancelBtn {
  display: flex;
flex-direction: column;
justify-content: center;
align-items: center;
padding: 5px 16px;
width: 154px;
height: 50px;

background: #FFFFFF;
border: 1px solid var(--tertiary);

box-shadow: 0px 2px 0px rgba(0, 0, 0, 0.016);
border-radius: 5px;
}

.excelErrorNextBtn {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 5px 16px;
  width: 125px;
  height: 40px;
  color: white;
  background: var(--primary);
  // opacity: 0.5;
  box-shadow: 0px 2px 0px rgba(0, 0, 0, 0.043);
  border-radius: 5px;
  border: none;
}

.payee_name_section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 8px 12px;
  gap: 4px;
  width: 400px;
  height: 276px;
  background: #FFFFFF;
  box-shadow: 0px 4px 24px rgba(30, 71, 84, 0.21);
  border-radius: 5px;
}

.payee_name_selection {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8px 12px;
  gap: 12px;
  
  width: 376px;
  height: 36px;

  background: #DFF3FB;
  border-radius: 5px;
}

.payee_name_inner_selection{
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 6px;
  
  width: 148px;
  height: 20px;
}

.payee_name_add_new{
  width: 60px;
  height: 20px;
  
  font-family: 'Circular Std';
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: #00A1DE;
}

.payee_name_add_new_text{
  width: 82px;
  height: 20px;
  font-family: 'Circular Std';
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 20px;
  color: #1C2123;
}

// .uploadSection {
//   display: flex;
//   height: 150px;
//   width: 600px;
//   padding: 9px 16px;
//   flex-direction: column;
//   align-items: center;
//   gap: 10px;
//   bottom: 20px;
//   background: #FFFFFF !important;
//   border: 2px dashed #00A1DE !important;
// }

.ant-upload-drag-container {
  display: flex !important;
  flex-direction: column;
  align-items: center;
  justify-content: center;

}

.ant-upload-drag-icon {
  margin: 0px !important;
  padding: 10px !important;
}

// .uploadText {
//   display: flex;
//   width: 300px;
//   padding: 5px 10px;
//   gap: 10px;
//   border-radius: 5px;
//   background: var(--primary);
//   color: white !important;
//   justify-content: center;
// }

.uploadHint {
lor:  var(--primary) !important;
  text-align: center;
  font-size: 10px;
}

.uploadSectionWorkforce {
  display: flex;
  height: fit-content;
  width: 100%;
  padding: 9px 16px;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  bottom: 20px;
  background: #FFFFFF !important;
  border: 2px dashed var(--primary) !important;
}

.claimContent {
  display: flex;
  padding: 24px;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  align-self: stretch;
}

.claimTableContent {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  align-self: stretch;
}

// .claimBody {
//   display: flex;
//   flex-direction: column;
//   align-items: flex-start;
//   gap: 12px;
//   align-self: stretch;
// }

// .claimTitleSection {
//   color: #000;
//   font-size: 15px;
//   font-style: normal;
//   font-weight: 300;
//   line-height: normal;
// }

.claimDescriptionSection {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px 0px 24px;
  width: 100%;
  height: 92px;
}

.claimTextAreaSection {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  align-self: stretch;
  height: 150px;
}

.registerPayment {
  display: flex;
  flex-direction: column;
  padding-left: 24px;
  padding-right: 24px;
  gap: 20px;
  width: 550px;
  height: 362px;
  border-radius: 10px;
}

.registerPaymentDetails {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.registerInputSection {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  height: 92px;
}

.registerInputSection h3 {
  font-size: 20px;
  font-style: normal;
  font-weight: 450;
  line-height: 150%;
}

.invoiceInfoTitle {
  color: var(--neutral-7, #798C9A);
  font-family: Circular Std;
  font-size: 20px;
  font-style: normal;
  font-weight: 450;
  line-height: 150%;
}

.invoiceInfoSection {
  display: flex;
  align-items: flex-start;
  align-self: stretch;
}

.invoiceInfoItems {
  display: flex;
  width: 170px;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.invoiceInfoItems p {
  color: var(--neutral-7, #798C9A);
  font-size: 16px;
  font-style: normal;
  font-weight: 450;
  line-height: normal;
}

.numbers p {
  color: #37414D !important;
}

.registerTitle {
  display: flex;
  padding-left: 24px;
  justify-content: flex-start;
  text-align: center;
  width: 50%;
  height: 30px;
  position: relative;
  top: 12px;
}

  `;
export default Content;

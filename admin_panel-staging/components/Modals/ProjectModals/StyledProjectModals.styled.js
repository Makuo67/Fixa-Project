import styled from "styled-components";

export const StyledProjectModals = styled.div`
.projectModalContainer {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    /* padding: 10px 40px; */
    gap: 19px;
    // width:100%;
    background: #FFFFFF;
    border-radius: 5px;
    // height: 800px;

    .ant-form {
        height: fit-content;
    }
}

.ant-modal-body {
    padding: 0px;
}

.formContainer {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    /* grid-template-columns: 100% 100%; */
    align-items: flex-start;
    padding: 0px;
    gap: 19px;
    /* width:32vw; */
    // height: 631.9px;
    height: fit-content;
}

.rightLeftSection {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0px;
    gap: 15px;
    width:100%;
}

.rightLeftSection h3 {
    margin: 0px;
}

.ant-form-item {
    width: 100%;
}

.ant-form-item-control-input-content  {
 width: 100%;
}

.modelInput {
    width: 100% !important;
    height: 36px;
    background: #FFFFFF;
    border: 1px solid #CCDBE1;
    border-radius: 5px;

    .ant-select-selector {
        border: 1px solid #CCDBE1;
        border-radius: 5px;
        line-height: 0px;
        height: 36px;
    }
}

.lowerPartLeftSection {
    position: relative;
}

.clientManagerPart {
    top: 30px;
}

.logoPart {
    position: relative;
    top: 12px;
}

.shiftsPart {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0px;
    // height: 86px;
}

.shiftsPart h2 {
    margin: 0px;
}

.shifts {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding-top: 10px;
    gap: 10px;

    .ant-checkbox-wrapper {
        padding: 6px 12px;
        gap: 2px;
        
        width: 81px;
        height: 32px;
        background: #DFF3FB;
        border-radius: 5px;
    }
}

.buttonsSection {
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 0px;
    gap: 23px;
    // top: 58px;
    height: 40px;
}

.cancelButton {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 8px 16px;
    height: 40px;
    width: 140px;
    
    font-size: 16px;
    line-height: 24px;
    background: #FFFFFF;
    color: rgba(0, 0, 0, 0.85);
    border: 1px solid var(--tertiary);
    
    box-shadow: 0px 2px 0px rgba(0, 0, 0, 0.016);
    border-radius: 5px;
}

.saveButton{
    height: 40px;
    width: fit-content;
    border: none;
    border-radius: 5px;
    // width: 100px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--primary);
    color: #FFFFFF;
  }
// .saveButton {
//     padding: 8px 16px;
//     gap: 8px;
//     height: 40px;
//     width: 140px;

//     color: #FFFFFF;
//     background: #00A1DE;
//     border: 1px solid #00A1DE;
//     box-shadow: 0px 2px 0px rgba(0, 0, 0, 0.043);
//     border-radius: 5px;
// }

`;
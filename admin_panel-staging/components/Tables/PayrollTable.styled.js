import styled from "styled-components";

export const StyledModal = styled.div`
  text-align: center;
  padding: 40px;
  .ant-result {
    padding-top: 0px;
    padding-bottom: 0px;
  }
`;

export const StyledPayment = styled.div`
  .statusSpace {
    display: flex;
    flex-direction: column;
    align-items: flex-start !important;
  }
  .date {
    color: #798c9a;
    font-weight: bold;
    font-size: 12px;
    line-height: 15px;
  }
  .search {
    width: 378.75px;
    border-radius: 5px;
  }
  .open {
    background-color: #fff1b8;
    color: #faad14;
    border: none;
    border-radius: 20px;
    font-weight: bold;
    cursor: default;
    font-size: 12px;
    height: 19px;
    //width: fit-content;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 2px;
  }
  .unpaid {
    background-color: #dcebf1;
    color: #505e64;
    border: none;
    border-radius: 20px;
    font-weight: bold;
    cursor: default;
    font-size: 12px;
    height: 19px;
    //width: fit-content;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 2px;
  }
  .closed {
    background-color: #d9f7be;
    color: #389e0d;
    border: none;
    border-radius: 20px;
    font-weight: bold;
    cursor: default;
    font-size: 12px;
    height: 19px;
    //width: fit-content;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 2px;
  }
  .failed {
    background-color: #fff1f0;
    color: #f5222d;
    border: none;
    border-radius: 20px;
    font-weight: bold;
    cursor: default;
    font-size: 12px;
    height: 19px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 2px;
  }

  .ant-table-row {
    cursor: pointer;
  }
`;
export const StyledSettings = styled.div`
  font-family: 'Circular Std' !important;

  .settingsHeader {
    display: flex;
    justify-content: space-between;
    padding: 40px 0px 40px 0px;
  }

  .settings-0 {
    display: flex;
    flex-direction: row;
    gap: 20px;
    padding: 8px;
  }
  .logo{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 70px;
    height: 70px;
    border: 1px solid var(--secondary);
    border-radius: 50%;
    font-weight: 700;
    cursor: pointer;
    background-color: var(--secondary);

    &:hover {
      // border: 1px solid var(--primary);
      scale: 1.1;
    }
  }

  .editcompanyinfo {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 4px 16px;
    gap: 4px;
    width: 150px;
    height: 40px;
    border: 1px solid #CCDBE1;
    border-radius: 5px;
    flex: none;
    order: 1;
    flex-grow: 0;
    font-style: normal;
    font-weight: 450;
    font-size: 12px;
    line-height: 15px;
    text-align: center;
    color: #FA8C16;
  }

  .companyinfo {
    display: flex;
    flex-direction: column;
    font-style: normal;
    font-weight: 450;
    font-size: 14px;
    width: 400px;
    gap: 10px;
  }

  .companytitle {
    font-weight: 500 !important;
    font-size: 24px !important;
    line-height: 30px !important;
    color: #24282C;
    flex: none;
    order: 0;
    flex-grow: 0;
  }

  .companybody, .companyfooter {
    display: flex;
    justify-content: space-between;
  }

  .tin, .email {
    align-self: flex-start;
    width: 50%;
  }

  .address-0, .tin-0, .phone-0, .email-0 {
    color: #798C9A;
  }

  .users {
    display: flex;
    width: 61px;
    height: 20px;
    font-style: normal;
    font-weight: 700;
    font-size: 16px;
    line-height: 20px;
    color: #000000;
    gap: 4px;
  }

  .viewButton {
    box-sizing: border-box;

    /* Auto layout */

    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 4px 12px;
    gap: 4px;
    width: 80px;
    height: 30px;
    border: 1px solid #CCDBE1;
    border-radius: 5px;
    flex: none;
    order: 4;
    flex-grow: 0;
    font-style: normal;
    font-weight: 450;
    font-size: 14px;
    line-height: 18px;
    color: #505E64;
  }

  .search {
    width: 378.75px;
    border-radius: 12px !important;
  }
`;

export const StyledExpandedPayment = styled.div`
  .upper {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: 12px;
    gap: 12px;

    flex: none;
    order: 1;
    align-self: stretch;
    flex-grow: 0;
  }
  .expanded {
    /* Auto layout */
    width: 100%;
    height: 176.32px;
    background: #f2fafd !important;
    border-radius: 5px;
    display: flex;
    flex-direction: column;
  }
  .innerUnpaid-1 {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 12px;
    gap: 12px;

    width: fit-content;
    height: 120px;
    border: 1px solid #ccdbe1;
    border-radius: 5px;
    flex: none;
    order: 0;
    align-self: stretch;
    flex-grow: 1;
  }
  .innerUnpaid-3 {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 12px;
    gap: 12px;

    width: fit-content;
    height: 160px;
    border: 1px solid #ccdbe1;
    border-radius: 5px;
    flex: none;
    order: 0;
    align-self: stretch;
    flex-grow: 1;
  }
  .innerUnpaid-1-1 {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    width: 50%;
    gap: 8px;
  }
  .innerUnpaid-2-2 {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    justify-content: space-between;
    width: 50%;
  }
  .edit {
    cursor: pointer;
  }
  .innerUnpaid-1-1-1 {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    width: fit-content;
  }
  .innerUnpaid-2-2-2 {
    display: flex;
    flex-direction: column;
    gap: 2px;
    align-items: flex-start;
    width: fit-content;
  }
  .innerUnpaid-2 {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 12px;
    gap: 8px;

    width: fit-content;
    height: 120px;
    border: 1px solid #ccdbe1;
    border-radius: 5px;
    flex: none;
    order: 1;
    align-self: stretch;
    flex-grow: 1;
  }
  .unpaidButtons {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: flex-start;
    padding: 0px 12px;
    gap: 12px;

    width: 100%;
    height: 31px;

    /* Inside auto layout */

    flex: none;
    order: 1;
    align-self: stretch;
    flex-grow: 0;
  }
  .delete {
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 8px 0px;
    gap: 8px;

    width: 87px;
    height: 31px;
    border: 1px solid #f5222d;
    border-radius: 5px;
    background: inherit;
    color: #f5222d;
    font-weight: 500;

    flex: none;
    order: 0;
    flex-grow: 0;
  }
  .view {
    box-sizing: border-box;

    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 8px;
    gap: 8px;

    width: fit-content;
    height: 31px;
    background: inherit;
    color: #00a1de;
    font-weight: 500;
    
    border: 1px solid #32c1f7;
    border-radius: 5px;

    /* Inside auto layout */

    flex: none;
    order: 1;
    flex-grow: 0;
  }

  .claims {
    width: 120px !important;

  }
  .title {
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 15px;
    text-transform: capitalize;
    color: #798c9a;
  }
  .value {
    font-size: 12px;
    text-transform: capitalize;
    font-weight: 500;
    color: #24282c;
    display: flex;
    gap: 12px;
  }
  .valued {
    width: 349px;
    height: 60px;
    font-family: "Circular Std";
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 15px;
    color: #24282c;
    flex: none;
    order: 0;
    flex-grow: 1;
  }
  .value > span:last-child {
    color: #f5222d;
  }
`;

export const StyledPayrollTable = styled.div`
  border-radius: 8px !important;
  box-shadow: 0px 0px 12px rgba(39, 55, 54, 0.2);

  .extra-nodes {
    padding: 14px 30px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;

    h3 {
      margin: 0;
      padding: 0;
    }

    .stats {
      display: flex;

      div {
        margin-left: 10px;
      }
    }
  }

  .ant-table-pagination.ant-pagination {
    margin: 10px;
    padding: 10px 30px;
  }

  table > thead > tr > th:first-child {
    padding-left: 20px;
  }

  table > thead > tr > th {
    font-style: normal;
    // font-weight: 500;
    font-size: 14px;
    line-height: 15px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    background: #F7F9FA !important;
    color: #24282C;
    border-top: 1px solid #d5ebec;
    border-bottom: 1px solid #d5ebec;
  }

  table > tbody > tr > td.ant-table-cell:first-child {
    padding-left: 20px;
  }

  .ant-row {
    background: #ffffff !important;
    border-radius: 12px 12px 0px 0px !important;
  }

  .ant-pagination {
    background: #F7F9FA !important;
    border-radius: 0px 0px 12px 12px !important;
    border-top: 1px solid #d5ebec;
    border-bottom: 1px solid #d5ebec;
  }

  .ant-input-search > .ant-input-group > .ant-input-group-addon:last-child .ant-input-search-button:not(.ant-btn-primary) {
    display: none;
  }

  .ant-input-search > .ant-input-group > .ant-input-group-addon:last-child {
    border-right: 1px solid #d9d9d9;
  }

  .ant-input-affix-wrapper {
    border: 1px solid #d9d9d9;
    border-radius: 5px !important;
  }

  .payoutActions {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: 0px;
    gap: 12px;
  }
`;

export const StyledDeductionsModal = styled.div`
  .close {
    background: red !important;
  }
  .add {
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    align-items: center;
    padding: 4px 12px;
    width: 150px;
    height: 30px;
    background: #dff3fb;
    color: #0291c8;
    font-size: 12px;
    line-height: 22px;
    border: 1px solid #b6ebff;
    box-shadow: 0px 2px 0px rgba(0, 0, 0, 0.016);
    border-radius: 2px;
    flex: none;
    order: 3;
    flex-grow: 0;
  }
  .field {
    border: 1px solid #ccdbe1;
    padding: 12px;
    font-family: "Circular Std";
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 18px;
    color: rgba(0, 0, 0, 0.85);
    margin-bottom: 12px;
    border-radius: 5px;
  }

  .icon {
    cursor: pointer;
    display: flex;
    justify-content: flex-end;
  }
  .remove {
    cursor: pointer;
  }
  .space {
    border: 1px solid #ccdbe1;
    padding: 12px;
    font-family: "Circular Std";
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 18px;
    color: rgba(0, 0, 0, 0.85);
    margin-bottom: 12px;
    border-radius: 5px;
    display: flex;
    flex-direction: column;
  }
  .addedField {
    width: 450px !important;
    border: 1px solid #ccdbe1;
    border-radius: 5px;
  }

  .ant-select-selector {
    border: 1px solid #ccdbe1;
    border-radius: 5px;
    line-height: 0px;
  }

  .buttons {
    display: flex;
    justify-content: center;
    gap: 12px;
    padding: 12px;
  }
  .buttonSave {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 5px 16px;

    width: 125px;
    height: 40px;

    background: var(--primary);
    color: var(--button-color);
    box-shadow: 0px 2px 0px rgba(0, 0, 0, 0.043);
    border-radius: 5px;
    border: none;
    flex: none;
    order: 1;
    flex-grow: 0;
    z-index: 0;
  }
  .buttonCancel {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 5px 16px;

    width: 125px;
    height: 40px;

    background: #fff;
    color: #000;
    box-shadow: 0px 2px 0px rgba(0, 0, 0, 0.043);
    border-radius: 5px;
    border: 1px solid var(--tertiary);
    flex: none;
    order: 1;
    flex-grow: 0;
    z-index: 0;
  }
`;

export const StyledExpandedPayout = styled.div`
  .container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 12px;
    gap: 12px;
    width: auto;
    height: 158px;

    /* Neutral/2 */

    background: #f2fafd;
    border-radius: 5px;

    /* Inside auto layout */

    flex: none;
    order: 1;
    align-self: stretch;
    flex-grow: 0;
  }

  .innerContainer {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 12px;
    gap: 12px;
    // width: 898px
    height: 134.32px;

    /* Neutral/2 */

    background: #f2fafd;
    border-radius: 5px;

    /* Inside auto layout */

    flex: none;
    order: 0;
    align-self: stretch;
    flex-grow: 0;
  }

  .reference {
    box-sizing: border-box;

    /* Auto layout */

    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 12px;
    gap: 12px;

    width: 238.5px;
    height: 110.32px;

    /* Neutral/5 */

    border: 1px solid #ccdbe1;
    border-radius: 5px;

    /* Inside auto layout */

    flex: none;
    order: 0;
    align-self: stretch;
    flex-grow: 1;
  }

  .referenceValue {
    // width: 83px;
    height: 30px;

    font-family: "Circular Std";
    font-style: normal;
    font-weight: bold;
    font-size: 15px;
    line-height: 30px;
    text-transform: uppercase;

    /* Neutral/11 */

    color: #24282c;

    /* Inside auto layout */

    flex: none;
    order: 0;
    flex-grow: 0;
  }

  .timeValuepart {
    width: 190px;
    height: 60px;
    font-style: normal;
    font-weight: bold;
    font-size: 15px;
    line-height: 30px;
    text-transform: uppercase;

    /* Neutral/11 */

    color: #24282c;
    flex: none;
    order: 0;
    align-self: stretch;
    flex-grow: 0;
  }

  .message {
    box-sizing: border-box;

    /* Auto layout */

    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 12px;
    gap: 12px;

    width: 373px;
    height: 110.32px;

    /* Neutral/5 */

    border: 1px solid #ccdbe1;
    border-radius: 5px;

    /* Inside auto layout */

    flex: none;
    order: 2;
    align-self: stretch;
    flex-grow: 0;
  }

  .messageValue {
    width: 349px;
    height: 60px;

    font-family: "Circular Std";
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 15px;

    /* Neutral/11 */

    color: #24282c;

    /* Inside auto layout */

    flex: none;
    order: 0;
    flex-grow: 1;
  }
`;

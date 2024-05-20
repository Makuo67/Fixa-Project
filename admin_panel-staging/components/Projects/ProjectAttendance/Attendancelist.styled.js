import styled from "styled-components";

export const StyledSpin = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;
export const StyledAttendance = styled.div`
  .stats {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 12px;
    padding-bottom: 20px;
  }
  .wrapper {
    margin: 0px 0px;
  }

  .form {
    margin: 0px 0px;
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 10px;
  }

  .ant-picker {
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: 8px 12px;
    width: 256px;
    height: 40px;
    background: #ffffff;
    border: 1px solid #ccdbe1;
    border-radius: 5px;
  }

  .ant-divider-horizontal {
    display: flex;
    clear: both;
    width: 100%;
    min-width: 100%;
    margin: -20px 0px 20px;
  }
  .button {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 8px 0px;
    gap: 8px;
    width: 92px;
    height: 38px;
    background-color: var(--primary);
    box-shadow: 0px 2px 0px rgba(0, 0, 0, 0.043);
    border-radius: 5px;
    border: none;
  }
  .buttonE {
    border-radius: 5px;
    width: 100px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .button .icon {
    color: white;
  }
  .approved {
    width: fit-content;
    height: fit-content;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 600;
    background-color: #d9f7be;
    color: #389e0d;
    border: none;
    border-radius: 20px;
    font-weight: normal;
    cursor: default;
  }
  .pending {
    background-color: #fff1b8;
    color: #fa8c16;
    border: none;
    border-radius: 20px;
    font-weight: normal;
    cursor: default;
    width: fit-content;
    height: fit-content;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 600;
  }
  .declined {
    background-color: #ffd8bf;
    color: #f5222d;
    border: none;
    border-radius: 20px;
    font-weight: normal;
    cursor: default;
    width: fit-content;
    height: fit-content;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 600;
  }
  .statusSpace {
    display: flex;
    justify-content: space-between;
  }
  .statusSpace .iconStatus {
    color: #798c9a;
    cursor: pointer;
  }
  .ant-table-row-expand-icon ant-table-row-expand-icon-expanded {
    height: 100px;
  }

  .ant-table-row-expand-icon {
    color: #1890ff;
    outline: none;
    cursor: pointer;
    /* transition: color 0.3s; */
    position: relative;
    float: left;
    box-sizing: border-box;
    width: 17px;
    height: 17px;
    padding: 0;
    color: inherit;
    line-height: 17px;
    background: transparent;
    // border: 1px solid #f0f0f0;
    border: none;
    border-radius: 2px;
    transform: scale(0.94117647);
    transition: all 0.3s;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  button,
  html [type="button"],
  [type="reset"],
  [type="submit"] {
    -webkit-appearance: button;
  }
  // .ant-table-cell .buttons{
  //     background-color: black;
  //     display: flex;
  //     align-items: flex-end;
  // }
`;

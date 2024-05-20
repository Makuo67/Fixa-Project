import styled from "styled-components";

export const StyledExpandedAttendance = styled.div`
  border-radius: 0px !important;
  .ant-modal-content {
    border-radius: 0px !important;
  }
  .container {
    background: #f2fafd !important;
    border-radius: 5px;
    width: inherit;
  }
  .numbers {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
  }
  .inner {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    // gap: 0px;
    margin: 12px;

    width: 152.14px;
    height: 82.32px;

    /* Neutral/5 */
    border: 1px solid #ccdbe1;
    border-radius: 5px;
  }
  .inner h2 {
    color: #798c9a;
  }
  .inner span {
    color: black;
  }
  .inner-approved {
    display: flex;
    flex-direction: column;
    padding: 12px;
    gap: 0px;
    margin: 12px;

    width: 152.14px;
    height: 82.32px;

    /* Neutral/5 */
    border: 1px solid #52c41a;
    border-radius: 5px;
    background-color: #f6ffed;
  }
  .inner-approved h1 {
    color: #798c9a;
    font-size: 12px;
  }
  .inner-approved span {
    color: black;
    color: #24282c;
    font-weight: bold;
  }
  .inner-declined {
    display: flex;
    flex-direction: column;
    padding: 12px;
    gap: 0px;
    margin: 12px;

    width: 152.14px;
    height: 82.32px;

    /* Neutral/5 */
    border: 1px solid #f5222d;
    border-radius: 5px;
    background-color: #fff1f0;
  }
  .inner-declined h1 {
    color: #798c9a;
    font-size: 12px;
  }
  .inner-declined span {
    color: black;
    color: #24282c;
    font-weight: bold;
  }

  .buttons {
    width: 100%;
    // background-color: blue;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    //position: relative;
    //left: 700px;
  }

  .buttons Button {
    margin: 10px;
  }
  .list .decline .approve {
    font-family: "Circular Std";
    font-style: normal;
    font-weight: bold;
    font-size: 12px;
    line-height: 15px;
    margin: 10px;
  }
  .list {
    color: #00a1de;
    border-radius: 5px;
    border: 1px solid #00a1de;
  }
  .decline {
    color: #f5222d;
    border-radius: 5px;
    border: 1px solid #f5222d;
  }
  .approve {
    color: #52c41a;
    border-radius: 5px;
    border: 1px solid #52c41a;
  }
`;

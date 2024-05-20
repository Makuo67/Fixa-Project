import styled from "styled-components";

export const StyledProjectName = styled.div`
  .container {
    text-align: left;
    padding-top: 10px;
    width: 100%;
  }
  .supervisorButton {
    align-items: center;
    padding: 4px 16px;
    color: white;
    width: 131px;
    height: 40px;
    background: #00a1de;
    box-shadow: 0px 2px 0px rgba(0, 0, 0, 0.043);
    border-radius: 5px;
    font-family: "Circular Std";
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 22px;
    text-align: center;
  }
  .project-name-header {
    display: flex;
    align-items: start;
    justify-content: space-between;
  }
  .tabs-container {
    padding: 0px;
    width: 100%
  }

  .tabs-container .ant-tabs {
    width: 100% !important;
  }

  .tabs-container .ant-tabs .ant-tabs-nav-wrap .ant-tabs-nav-list {
    width: 500px !important;
  }

  .project-name-header-left {
    display: flex;
    gap: 20px;
  }
  .name {
    display: flex;
    flex-direction: column;
  }
  .name-sub {
    display: flex;
    gap: 20px;
    p {
      font-style: normal;
      font-weight: 500;
      font-size: 16px;
      line-height: 20px;
      color: #0291c8;
    }
    .dropdown {
      background-color: red !important;
    }
  }

  .cardImage {
    width: 53px;
    height: 54px;
    border-radius: 6px;
  }
`;

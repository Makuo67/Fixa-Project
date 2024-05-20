import styled from "styled-components";

export const StyledProfileTabs = styled.div`
  width: 100%;

  .ant-tabs {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    color: rgba(0, 0, 0, 0.85);
    font-size: 14px;
    font-variant: tabular-nums;
    line-height: 1.5715;
    list-style: none;
    font-feature-settings: "tnum";
    display: flex;
  }

  .ant-tabs-content {
    position: relative;
    width: 100%;
  }
  .ant-tabs {
    background: #f2fafd;
    // background: red;
    width: 100%;
    width: 100%;
    height: 100%;
  }
  .ant-tabs-nav {
    background: #f2fafd;
    padding-left: 80px;
  }
  active .ant-tabs-tab-btn {
    color: #1890ff;
    text-shadow: 0 0 0.25px currentcolor;
  }
`;

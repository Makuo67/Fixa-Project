import styled from "styled-components";

export const StyledWorkHistory = styled.div`
  width: 100%;
  .worker-history {
    margin: 0 80px;
  }
  .filter-input {
    margin-right: 50px;
  }
  .filter-headers {
    font-family: "circular-std" !important;
    color: rgba(0, 0, 0, 0.85);
    font-size: 10px;
  }
  .buttonCancel{
    height: 40px;
    border-radius: 5px;
    border: 1px solid var(--secondary);
    &:hover{
      color: var(--primary);
    }
  }
  .buttonApply{
    height: 40px;
    background: var(--primary);
    border-radius: 5px;
    border: none;
    &:hover{
      opacity: 0.75;
      color: var(--secondary);
    }
  }
  .stats {
    display: flex;
    align-items: flex-start;
    margin-top: 20px;
  }
  .stat {
    margin-right: 200px;
    height: 10px;
    width: 100%;
  }
  .input {
    width: 100%;
    height: 30px;
    border-radius: 5px;
    color: rgba(0, 0, 0, 0.25);
    margin-bottom: 10px;
  }
  .date-input {
    width: 500px;
  }
  .worker-hist-filters {
    margin-bottom: 20px;
    margin-left: 200px;
  }
  .filters {
    display: flex;
    margin-right: 100px;
  }
  .card {
    background: #e4eef3;
    width: 100%;
    height: 100px;
    border-radius: 7px;
    padding-left: 30px;
    padding-top: 10px;
    margin-bottom: 20px;
  }
  .history-table {
    background: white;
    margin-top: 20px;
  }
  h5 {
    font-family: "circular-std" !important;
  }
  .filter-body {
    background: #e4eef3;
    padding: 10px 20px;
    border-radius: 5px;
  }
  .filter-fields {
    display: flex;
    gap: 10px;
    > div {
      width: 100%;
    }

`;

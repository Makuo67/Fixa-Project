import styled from "styled-components";

export const StyledProjectSupervisors = styled.div`
  .search {
    width: 378.75px;
    border-radius: 8px !important;
  }
  .supervisor-modal {
    display: flex;
    justify-content: flex-end;
    padding-bottom: 10px;
  }
  .supervisorButton{
    display: flex;
    align-items: center;
    padding: 4px 16px;
    color: white;
    width: fit-content;
    height: 40px;
    background: var(--primary);
    border: none;
    box-shadow: 0px 2px 0px rgba(0, 0, 0, 0.043);
    border-radius: 5px;
    font-family: "Circular Std";
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 22px;
    text-align: center;
  }
  .submit-buttons-container{
    margin: 10px 0;
  }
  .save {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      padding: 9px 15px;
      gap: 10px;
      width: 144px;
      height: 40px;
      background: var(--primary);
      border: none;
      color: #ffffff;
      border-radius: 5px;
    }

    .cancel {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      padding: 9px 15px;
      gap: 10px;
      width: 144px;
      height: 40px;
      background: #ffffff;
      color: #000;
      border-radius: 5px;
      border: 1px solid var(--tertiary);
    }
`;

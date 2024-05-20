import styled from "styled-components";

export const StyledEditUserProfile = styled.div`
  .heading {
    width: 110px;
    height: 22px;

    /* Body/regular */

    font-family: "Circular Std";
    font-style: normal;
    font-weight: 450;
    font-size: 14px;
    line-height: 22px;
  }

  .content {
    padding-left: 25px;
  }
  .avatar-container {
    display: flex;
    flex-direction: row;
    gap: 20px;
    height: 80px;
  }
  .avatar {
    height: 70px;
    width: 70px;
    border-radius: 50%;
    background-color: #f2fafd;
    :hover {
      cursor: pointer;
      border: 1px solid #00a1de;
      height: 75px;
      width: 75px;
      transition: 0.4s;
    }
  }
  .avatar.selected {
    border: 2px solid #00a1de;
  }

  .personal-info {
    display: flex;
    margin-top: 5px;
  }
  .form {
    padding-left: 20px;
  }

  .actionButton {
    font-style: normal;
    font-weight: 450;
    font-size: 18px;
    line-height: 22px;
    color: white;
    height: 38px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 8px 0px;
    gap: 8px;
    background: var(--primary);
    box-shadow: 0px 2px 0px rgba(0, 0, 0, 0.043);
    border-radius: 5px;
    width: 120px;
    height: 38px;
    margin-left: 215px;
  }

  .ant-input {
    width: 330px;
    height: 40px;
    border: 1px solid #ccdbe1;
    border-radius: 5px;
  }
  // .ant-select {
  //   width: 330px;
  //   border: 1px solid #ccdbe1;
  //   border-radius: 5px;
  //   line-height: 0px;
  // }
  .input {
    margin-top: 30px;
  }
  .payments {
    margin-top: 45px;
  }
  .left-inputs {
    margin-left: 40px;
  }
`;

export default StyledEditUserProfile;

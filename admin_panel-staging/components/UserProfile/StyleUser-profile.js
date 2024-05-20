import styled from "styled-components";

export const StyledUserProfile = styled.div`
  .profile {
    display: flex;
    flex-direction: column;
    gap: 18px;
    background: white;
    width: 50%;
    height: 500px;
    padding: 40px 40px;
    border-radius: 8px;
  }

  .change-password {
    margin: 40px 0px 0px 70px;
    background: red;
  }

  .loader {
    // margin: 0px 0px 0px 10px;
  }

  .settingsHeader {
    display: flex;
    justify-content: space-between;
    padding: 40px 0px 40px 0px;
  }

  .ant-skeleton-avatar {
    width: 135px;
    height: 135px;
  }

  .avatar-component {
    position: relative;
    width: 135px;
    height: 135px;
    font-weight: bold;
    border-radius: 50%;
    color: #0291c8;
    background-color: #f2fafd;
    display: flex;
    align-items: center;
    justify-content: center;

    :hover {
      cursor: pointer;
      opacity: 0.6;
    }
  }

  .image-1 {
    width: 135px;
    height: 135px;
  }
  
  .image:hover::after {
    content: url('data:image/svg+xml,%3Csvg xmlns="http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg" width="34" height="34" viewBox="0 0 24 24"%3E%3Cpath fill="%230291c8" d="M20 4h-3.17L15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h4.05l1.83-2h4.24l1.83 2H20v12zM12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5s5-2.24 5-5s-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3s3 1.35 3 3s-1.35 3-3 3z"%2F%3E%3C%2Fsvg%3E');
    position: absolute;
    left: 40%;
    top: 40%;
  }

  .initials {
    font-size: 15px;
    width: 25px;
    height: 25px;
    transition: width 0.5s, height 0.5s, rotate 0.1s ease-in-out;
  }

  .initials:hover {
    content: url('data:image/svg+xml,%3Csvg xmlns="http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg" width="34" height="34" viewBox="0 0 24 24"%3E%3Cpath fill="%230291c8" d="M20 4h-3.17L15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h4.05l1.83-2h4.24l1.83 2H20v12zM12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5s5-2.24 5-5s-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3s3 1.35 3 3s-1.35 3-3 3z"%2F%3E%3C%2Fsvg%3E');
    cursor: pointer;
    width: 45px;
    height: 45px;
    rotate: 360deg;
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

  .user-names {
    font-family: "Circular Std";
    font-style: normal;
    font-weight: 550;
    font-size: 24px;
    color: #24282c;
  }

  .worker-status {
    height: 23px;
    border-radius: 10px;
  }

  .title {
    height: 18px;
    font-family: "Circular Std";
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 18px;
    color: #0291c8;
    margin-top: 15px;
  }

  .contacts {
    width: 71px;
    height: 15px;
    font-family: "Circular Std";
    font-style: normal;
    font-weight: 550;
    font-size: 12px;
    line-height: 15px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #24282c;
    margin-top: 20px;
    margin-bottom: 10px;
    color: #414a52;
  }

  .actionButton {
    font-style: normal;
    font-weight: 450;
    font-size: 18px;
    line-height: 22px;
    color: #fa8c16;
    height: 38px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 8px 0px;
    gap: 8px;
    background: white;
    box-shadow: 0px 2px 0px rgba(0, 0, 0, 0.043);
    border-radius: 5px;
    width: 120px;
    height: 38px;
  }

  .deactivate {
    color: red;
    margin-left: 20px;
    width: 130px;
  }

  .activate {
    color: #0da35b;
    margin-left: 20px;
    width: 130px;
  }

  .changePasswordButton {
    width: 200px;
    // margin-right: 20px;
  }

  .updateButton {
    width: 200px;
    height: 100px;
    font-size: 10px;
    background: green;
  }

  .ant-input {
    width: 330px;
    height: 40px;
    border: 1px solid #ccdbe1;
    border-radius: 5px;
  }
`;

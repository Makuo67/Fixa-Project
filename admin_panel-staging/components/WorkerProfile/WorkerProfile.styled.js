import styled from "styled-components";

export const StyledProfile = styled.div`
  .profile {
    justify-content: space-around;
    margin: 50px;
  }
  .worker-actions {
    display: flex;
    margin-left:100px;
  }
  .profile-info {
    display: flex;
  }
  .dispay-with-icon {
    display: flex;
  }
  .verified-icon {
    padding-left: 10px;
    padding-right: 10px;
    margin-top: 5px;
  }
  .image {
    border-radius: 50%;
    height: 150px;
    margin-right: 50px;
  }
  .name {
    text-transform: capitalize;
    font-family: "Circular Std";
    font-style: normal;
    font-weight: 700;
    font-size: 24px;
    line-height: 30px;
  }
  .worker-status {
    height: 23px;
    margin-top: 5px;
    border-radius: 10px;
  }

  .trades {
    display: flex;
  }
  .ratings {
    display: flex;
  }
  #rating-1 {
    // background: #ff8a33;
    background: #dcebf1;
    width: 35px;
    height: 23px;
    color: white;
    font-weight: bold;
    border-top-left-radius: 3px;
    border-bottom-left-radius: 3px;
    margin-right: 10px;
    padding-left: 15px;
  }
  #rating-2 {
    color: white;
    background: #dcebf1;
    width: 35px;
    height: 23px;
    margin-right: 10px;
    padding-left: 15px;
  }
  #rating-3 {
    background: #dcebf1;
    color: white;
    font-weight: bold;
    width: 35px;
    height: 23px;
    margin-right: 10px;
    padding-left: 15px;
  }
  #rating-4 {
    background: #dcebf1;
    color: white;
    font-weight: bold;
    width: 35px;
    height: 23px;
    margin-right: 10px;
    padding-left: 15px;
  }
  #rating-5 {
    background: #dcebf1;
    color: white;
    font-weight: bold;
    border-top-right-radius: 3px;
    border-bottom-right-radius: 3px;
    width: 35px;
    height: 23px;
    margin-right: 10px;
    padding-left: 15px;
    border-left: 5px;
  }
  .ass-button {
    color: #ff8a33;
    background: white;
    height: 23px;
    width: 120px;
    font-weight: 550;
    font-size: 11px;
    border-radius: 5px;
    border: 1px solid #798c9a;
    padding: 2px;
  }
  .list {
    display: flex;
    font-size: 13px;
    font-family: "circular-std" !important;
  }
  .phone {
    padding-left: 30px;
  }
  .idNum {
    padding-left: 5px;
  }
  .button {
    margin-right: 8px;
    display: flex;
    flex-direction: row;
    align-items: center;
    background-color: #ffffff;
    gap: 12px;
    border: 1px solid #a8bec5;
    padding: 8px 12px;
    border-radius: 6px;
  }
  .text-normal {
    font-family: "circular-std-medium";
    font-style: normal;
    font-weight: 450;
    font-size: 14px;
    line-height: 18px;
  }
  .text-red {
    font-family: "circular-std-medium";
    font-style: normal;
    font-weight: 450;
    font-size: 14px;
    line-height: 18px;
  }
  .momo-verified {
    padding-left:5px;
    color: #32c1f7;
    display: flex;
    align-items: center;
  }
  .momo-verified .momo-statement {
    margin-left: 5px; 
  }
 
  .momo-not-verified {
    color: red;
    padding-left: 10px;
  }
 
  .profile-info-status {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  .profile-info-details-text {
    font-family: "circular-std";
    font-style: normal;
    font-weight: 700;
    font-size: 24px;
    margin-right: 12px;
    line-height: 30px;
    color: #24282c;
  }
  .profile-info-details-text-icon {
    width: 20px;
    height: 20px;
    border-radius: 100px;
    margin-right: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #00a1de;
  }
  .profile-info-details-text-icon-active {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 1px 5px;
    gap: 5px;
    width: 57.04px;
    height: 17px;
    background: #e8fafa;
    border-radius: 10px;
  }
  .profile-info-details-text-icon-active-dot {
    width: 6.04px;
    height: 5.66px;
    border-radius: 100px;
    background: #0da35b;
  }
  .profile-info-details-text-icon-active-text {
    font-family: "circular-std";
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 15px;
    color: #0da35b;
  }
  .profile-info-service {
    margin-top: 8px;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
  }
  .profile-info-assess-worker {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    margin-top: 8px;
  }
  .profile-info-assess-worker-rating {
    width: 200px;
    height: 20px;
    background: #dcebf1;
    border-radius: 8px;
  }
  .profile-info-date-onboarded {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    margin-top: 8px;
  }
  .profile-info-date-onboarded-text {
    font-family: "circular-std-medium";
    font-style: normal;
    font-weight: 450;
    font-size: 12px;
    line-height: 20px;
    color: #414a52;
    margin-right: 20px;
  }

  .button-action {
    height: 30px;
    font-size: 15px;
    padding-left: 10px;
    border: 1px solid blue;
    margin-left: 20px;
    border: 1px solid gray;
    background: white;
    border-radius: 3px;
  }
  .button-action1 {
    height: 38px;
    width: 143px;
    margin-right: 8px;
    display: flex;
    flex-direction: row;
    align-items: center;
    background-color: #ffffff;
    border: 1px solid #a8bec5;
    border-radius: 6px;
  }
  .button-action-donwload {
    margin-top: 20px;
    margin-left: 300px;
  }
  .action-icon {
    padding-right: 10px;
    padding-left: 5px;
  }

  .activate-button {
    font-size: 15px;
  }
  .activate-icon {
    height: 5px;
    padding-right: 5px;
  }
  .not-available {
    color: red;
  }

  .worker-assessment {
    display: flex;
  }
  .ass-button {
    color: #ff8a33;
  }
  .fields {
    display: flex;
    padding-left: 35px;
  }
  .assessment {
    height: 50px;
    margin-bottom: 20x;
    border-radius: 5px;
    padding-left: 20px;
    background: red;
    height: 50px;
    padding-bottom: 5px;
  }
  .ass-modal-title {
    color: red;
    margin-left: 500px;
  }
  .assment-category {
    height: 200px;
  }
  .assess-text {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #6a7178;
    font-family: "circular-std" !important;
    padding-left: 8px;
  }
  .assess-title {
    color: #24282c;
    font-size: 16px;
    font-weight: 500;
    font-family: "circular-std" !important;
    padding-left: 15px;
  }
  .assesment-card {
    border-radius: 5px;
    box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px;
    margin-bottom: 20px;
  }
  hr.solid {
    border: 0.2px solid #ccdbe1;
  }
  .assessButtons {
    background: green;
  }
  .rating {
    display: flex;
    padding-bottom: 20px;
  }
  .ratings {
    align-items: center;
  }
  .raking {
    background: #fa8c16;
    color: white;
    font-family: "Circular Std";
    font-style: normal;
    font-weight: 450;
    font-size: 12px;
    padding-left: 10px;
    padding-right: 10px;
    border-radius: 5px;
    height: 20px;
    margin-right: 5px;
  }
  .worker-services {
    display: flex;
  }
  .worker-trade-container {
    margin-right: 10px;
    background: transparent;
    border: 1px solid #a8bec5;
    border-radius: 5px;
    height: fit-content;
    width: fit-content;
    padding: 8px 12px;
  }
  .worker-trades-card {
    width: 100%;
    height: fit-content;
    background: #DFF3FB;
    color: #0291C8 !important;
    // border: 1px solid white;
    border-radius: 5px;
  }
  .trade {
    text-align: center;
    padding: 4px;
    // padding-left: 10px;
    // color: #414a52;
    font-family: "circular-std";
    font-weight: 700;
    font-size: 13px;
text-transform: capitalize;
  }
  .daily_rate {
    font-family: "Circular Std";
    padding-top: 5px;
    font-style: normal;
    font-weight: 600;
    font-size: 12px;
    line-height: 20px;
  }
  .worker-ranking {
    display: flex;
    margin-top: 15px;
  }
  .ranking-title {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 2px 10px;
    gap: 10px;
    width: 65px;
    height: 19px;
    background: #ff993a;
    border-radius: 5px 1px 1px 5px;
    color: white;
    margin-right: 20px;
    margin-top: 0;
  }
  .rate-stars {
    margin-right: 20px;
    padding-top: 0px;
  }
  .attendances-details {
    display: flex;
  }
  .attendances-details-contacts {
    margin-left: 20px;
  }
  .verify-warning {
    font-family: "Circular Std";
    font-style: normal;
    font-weight: bold;
    font-size: 16px;
    line-height: 24px;
  }

  .momo-and-phone{
    display: flex;
`;

import styled from "styled-components";

export const StyledProjectDetails = styled.div`
  .project-details {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 80px;

    span {
      font-size: 13px;
      color: #798C9A;
      text-transform: capitalize;
      line-height: 20px;
    }

    p {
      font-size: 14px;
      color: #24282C;
      font-weight: 500;
    }
  }
  .user-details {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 50px;

    .user-details-client, .user-details-manager {
      display: flex;
      flex-direction: column;
      gap: 5px;
      span{
        font-size: 12px;
        color: #798C9A;
        text-transform: capitalize;
        line-height: 20px;
      }
      .names{
        font-style: normal;
        font-weight: 500;
        font-size: 16px;
        color: #000000;
        text-transform: capitalize;
      }
    }
`;

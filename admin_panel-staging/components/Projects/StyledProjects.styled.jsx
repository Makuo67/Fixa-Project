import styled from "styled-components";

export const StyledProjectsStyled = styled.div`
  .container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    gap: 20px;
    @media (max-width: 768px) {
      width: 100%;
    }
  }

  .header {
    display: flex;
    justify-content: space-between;
    flex-direction: row;
    width: 100%;
    gap: 20px;
    align-items: center;
  }

  .project-title {
    display: flex;
    align-items: center;
    padding: 0px;
    gap: 12px;
  }

  .project-title h1 {
    font-size: 32px;
    color: #171832;
    width: 120px;
    height: 40px;
  }

  // .new-project-btn {
  //   width: 137px;
  //   height: 40px;
  //   background: #00A1DE;
  //   box-shadow: 0px 2px 0px rgba(0, 0, 0, 0.043);
  //   border-radius: 5px;
  // }
  .new-project-btn {
     height: 40px;
    width: fit-content;
    border: none;
    border-radius: 5px;
    // width: 100px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--primary);
    color: var(--button-color);
  }

  .cards {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 12px;
    gap: 24px;
  }

  .cardsWrapper {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    // grid-template-columns: repeat(auto-fill, minmax(100%, 1fr));
    gap: 24px;
    width:  100%;
  }

  .viewMoreBtnWrapper {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 6px 24px;
    gap: 10px;
    height: 62px;
  }

  .viewMoreBtn {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 8px 0px;
    gap: 8px;
    width: 180px;
    height: 38px;
    color: var(--secondary);
    background: var(--primary);
    box-shadow: 0px 2px 0px rgba(0, 0, 0, 0.043);
    border-radius: 5px; 
    border: none;
  }
`;

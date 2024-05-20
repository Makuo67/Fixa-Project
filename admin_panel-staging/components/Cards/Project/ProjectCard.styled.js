import styled from "styled-components";

const ProjectCardStyled = styled.div`
  .cardContainer {
    display: block;
    flex-direction: column;
    align-items: center;
    padding: 12px 6px;
    width: 100%;
    background: var(--secondary);
    box-shadow: 0px 4px 24px rgba(40, 62, 70, 0.1);
    border-radius: 15px;
    cursor: pointer;
    transition: 100ms all linear;
  }

  .cardContainer:hover {
    // border: 1px solid var(--tertiary);
  }

  .cardMainSection {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    padding: 12px 0px 12px 20px;
    gap: 12px;
    width: 100%;
    height: 78px;
    border-radius: 10px;
  }

  .cardBottomSection{
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 0px;
  }

  .cardImage {
    width: 53px;
    height: 54px;
    border-radius: 6px;
  }

  .projectMainInfo {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0px;
    // gap: 4px;
    width: 414.5px;
    height: 54px;
  }

  .projectMainInfo h2 {
    font-size: 24px;
    line-height: 30px;
    color: #1C2123;
    margin:0px;
  }

  .projectMainSubInfo{
    display: flex;
    gap: 4px;
    width: 100%;
  }

  .projectMainSubInfo h3 {
    font-size: 16px;
    line-height: 20px;
    color: var(--tertiary);
  }

  .cardTextStatus{
    font-size: 15px;
    text-align: center;
    margin: 0px;
    svg {
      margin-bottom: 2px;
    }
  }

  .cardTextStatusOngoing {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: 1px 5px;
    gap: 5px;
    height: 22px;
    border-radius: 10px;
    color: #FAAD14;
    background: #FFF7E6;
  }
  
  .cardTextStatusOngoing span {
    height: 20px;
  }

  .cardTextStatusOnHold {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: 1px 5px;
    gap: 5px;
    height: 22px;
    border-radius: 10px;
    color: #F5222D;
    background: #FFF1F0;
  }


  .cardTextStatusCompleted {
    color: #389E0D;
    background: #F6FFED;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: 1px 5px;
    gap: 5px;
    height: 22px;
    border-radius: 10px;
  }

  .cardTextStatusCompleted span {
    height: 20px;
  }

  .cardTextStatusNotStarted {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: 1px 5px;
    gap: 5px;
    height: 22px;
    border-radius: 10px;
    color: #2C3336;
    background: #DCEBF1;
  }

  .cardTextStatusNotStarted span {
    height: 20px;
  }

  .cardDivider {
    width: 100%;
    height: 0px;
    border: 1px solid #DCEBF1;
  }

  .detailsContainer{
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 2px;
    gap: 12px;
    
    width: 100%;
    height: 60px;
  }

  .detailsSection {
    display: flex;
    align-items: center;
    align-content: center;

    padding: 0px 12px;
    gap: 2px;
    width: 0;
    flex: 1 1 0px;
    /* height: 50px; */
  }

 .detailsSectionMiddle {
    /* width: 110% !important; */
 }

  .detailsSectionHeading {
    color: #798c9a !important;
    /* width:  100%; */
  }

  .detailsSectionHeadingSpan {
    width: 18px;
    height: 18px;
    border-radius: 2px;
  }

  .detailsSectionHeading h4 {
    font-weight: 500;
    font-size: 10px;
    line-height: 18px;
  }

  .detailsExpected {
    /* position: relative;
    right: 5px;
    display: flex;
    gap: 2px;
    justify-content: center;
    align-items: flex-end; */
  }
    
  .detailsTitle{
    width: 100px;
    overflow: visible;
    line-height: 0px;
    font-size: 12px;
    line-height: 18px;
    white-space: nowrap;
  }
  .detailsSectionInfo {
      margin:0px;
      color: #171832;
      line-height: 18px;
      font-size: 14px;
      /* margin-left: 22px; */
  }
  .detail-item-container{
    .flex {
      display: flex;
      gap: 5px;
    }
    .filler{
      width:18px ;
    }
  }
  `;
export default ProjectCardStyled;
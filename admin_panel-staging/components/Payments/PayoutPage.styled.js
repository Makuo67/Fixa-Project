import styled, { css } from 'styled-components';

export const PayoutPageStyles = styled.div`
.payoutContainer {
    display: flex;
    flex-direction: column;
    align-items: 'flex-start';
    padding: 0px;
    gap: 12px;
}

.progressSection{
    display: flex;
    flex-direction: column;
    padding: 1px 20px;
    gap: 2px;
    height: 69px;   
}

.progressSectionInfo{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 0px;
    gap: 12px;
    
    // width: 1057px;
    height: 26px;  
}

.progressSectionMessage{
display: flex;
flex-direction: row;
align-items: center;
padding: 0px;
gap: 16px;

width: 310px;
height: 26px;
}

.progressSuccess{
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: 4px 10px;
    gap: 10px;
    width: 130px;
    height: 30px;
    
    background: #D9F7BE;
    border-radius: 5px;
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    color: #389E0D;
}

.progressFailed{
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: 4px 10px;
    gap: 10px;
    width: 90px;
    height: 30px;
    background: #FFDCDC;
    border-radius: 5px;

    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    color: #FF0000;
}

.filterSection{
    display: flex;
    flex-direction: column;
}

.aggregatesSection {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 12px 0px;
    gap: 19px;
    // width: 1024px;
    height: 94px;
}

// .ant-table-wrapper {
//     ${({ showPayoutButtons }) => showPayoutButtons && css`height: 550px;`}
//     }

.tableSection {
    background: #FFFFFF;
    box-shadow: 0px 0px 12px rgba(39, 55, 54, 0.2);
    border-radius: 8px;
}

.inTable {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    width: -webkit-fill-available;
    background: 'white';
    top: 800px;
    z-index: 1;
 }

`;

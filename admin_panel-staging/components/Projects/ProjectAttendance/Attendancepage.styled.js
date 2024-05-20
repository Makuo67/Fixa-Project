import styled from "styled-components";

export const AttendancePageStyles = styled.div`
.wrapper {
    display: flex;
    flex-direction: column;
    gap: 20px 5px;
    width: 100%;
}
.cardSection {
    display: flex;
    flex-direction: row;
    gap: 20px;
    width: 80vw;

    .card-1 {
        width: 250px;
    }
    .card-2::-webkit-scrollbar {
        display: none;
    }
    .card-2{
        width: calc(100% - 10px);
        display:flex;
        flex-direction: row;
        flex-grow: 1;
        align-items: start;
        justify-content: start;
        gap: 20px;
        overflow-x: scroll;  
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
    }
}

.buttonActions{
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 6px 15px;
    border-radius: 5px;
    width: 134px;
    height: 40px;
}

.buttonDecline {
    color: #F5222D;
    border: 1px solid #FF4D4F;
}
.buttonApprove {
    color: #F5222D;
    border: 1px solid #73D13D;
}

.ant-row-space-between {
    background-color: white;
    padding-left: 100px;
}

.ant-table-cell {
    letter-spacing: 0.05em;
    font-weight: 500;
    font-size: 14px;
    line-height: 18px;
}

`;

import styled from "styled-components";

export const DrawerStyles = styled.div`
.outerDiv {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 22px 14px;
    background: #DCEBF1;
    border-radius: 10px;
    box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
    height: fit-content;
    width: 98%;
    overflow-y: scroll;
}

.ant-space {
    display: flex;
    width: auto;
    justify-content: space-between;
    width: 100%;
}

.buttonActions {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 4px 12px;
    border-radius: 5px;
    width: 140px;
    height: 65px;
    color: #F5222D;
    
    border: 1px solid #00A1DE;
}
.buttonActionSkeleton {
    display: flex;
    flex-direction: column;
    border-radius: 5px;
    right: 5px;
    width: 140px;
    height: 65px;
    min-width: 140px;
    
}
.buttonAggregatesSkeleton {
    display: flex;
    flex-direction: column;
    border-radius: 5px;
    right: 5px;
    width: 280px;
    height: 107px;
    min-width: 140px;
    
}

.secondInner {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 10px;
}

.total {
    display: flex;
    justify-content: flex-start;
    width: 92.5px;
}

`;

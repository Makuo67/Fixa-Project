import { Icon } from "@iconify/react";
import React from "react";
import styled from "styled-components";
import { LoadingOutlined } from "@ant-design/icons";

const Container = styled.div`
    border-radius: 8px;
    border: 1px solid #dcebf1;
    box-shadow: 0px 4px 24px 0px rgba(29, 63, 78, 0.10);
    background-color: #fff;
    padding: 20px;
    color: #003447;
    display: flex;
    flex-direction: column;
    gap: 6px;

.number {
    color: #00A1DE;
    font-size: 34px;
    letter-spacing: 1.2px;
}
.extra {
    display: flex;
    padding: 4px 0px;
    gap: 20px;
}

`
const TitleH3 = styled.h3`
    color: #414a52;
    font-size: 12px;
    text-transform: uppercase;
    margin-bottom: 0;
`

const IconContainer = styled.div`
    display:flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

.icon-bg {
    border-radius: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 2px;
    background-color: ${(props) =>
        props.gender === "male" ? "#b6ebff" : "#ffd6e7"};
}

`;

const NewStats = ({ title, loading, error, data }) => {
    return <Container>
        <TitleH3>{title}</TitleH3>
        <div className="number">
            {loading ? <LoadingOutlined /> : error ? '-' : data?.total}
        </div>
        <div className="extra">
            <IconContainer gender="male">
                <div className="icon-bg"><Icon icon="vaadin:male" color="#0291c8" /></div>
                <div>{loading ? <LoadingOutlined /> : error ? '-' : data?.male}</div>
            </IconContainer>
            <IconContainer gender="female">
                <div className="icon-bg"><Icon icon="fa:female" color="#c41d7f" /></div>
                <div>{loading ? <LoadingOutlined /> : error ? '-' : data?.female}</div>
            </IconContainer>

        </div>
    </Container>
}

export default NewStats
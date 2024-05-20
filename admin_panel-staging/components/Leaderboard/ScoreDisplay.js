import React from "react";
import styled from "styled-components";
import { CaretUpOutlined, CaretDownOutlined, LineOutlined, MinusOutlined } from "@ant-design/icons";

const ScoreContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

const ScoreValue = styled.h3`
  margin: 0;
  width: 50px;
`;

export const ArrowUp = styled(CaretUpOutlined)`
  color: #3f8600;
  width: 16px;
`;

export const ArrowDown = styled(CaretDownOutlined)`
  color: #cf1322;
  width: 16px;
`;
export const Neutral = styled(MinusOutlined)`
  color: #798C9A;
  width: 16px;
`;


const Difference = styled.span`
  color: ${(props) => (props.positive ? "#389E0D" : props.negative ? "#CF1322" : "inherit")};
`;

const ScoreDisplay = ({ value, difference }) => {
  const isPositive = difference > 0;
  const isNegative = difference < 0;

  return (
    <ScoreContainer>
      <ScoreValue>{value}</ScoreValue>
      {isPositive ? <ArrowUp /> : isNegative ? <ArrowDown /> : <LineOutlined />}
      <Difference positive={isPositive} negative={isNegative}>
        {difference}%
      </Difference>
    </ScoreContainer>
  );
};

export default ScoreDisplay;

import React from "react";
import styled from "styled-components";
import { LoadingOutlined } from "@ant-design/icons";
import { Skeleton } from "antd";
import { capitalizeAll } from "@/utils/capitalizeAll";

export const Container = styled.div`
  border-radius: 8px;
  border: 1px solid #dcebf1;
  box-shadow: 0px 4px 24px 0px rgba(29, 63, 78, 0.10);
  background-color: #fff;
  padding: 20px;
  color: #003447;
  height: 100%;

  h3 {
    color: #414a52;
    font-family: "Circular Std";
    font-size: 12px;
    text-transform: uppercase;
    margin-bottom: 0;
  }

  .places {
    height: calc(100% - 20px);
    display: flex;
    gap: 6px;
    align-items: flex-end;
  }
`;

const PlaceContainer = styled.div`
  border-top-right-radius: 10px;
  border-top-left-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: ${({ skeleton }) => skeleton ? "0" : "20px"};
  color:${({ height }) => height != 180 ? "#003447" : "#fff"};
  height: ${({ height }) => height}px;
  width: 100%;
  background: ${({ bgColor }) => bgColor};

  .score {
    border-radius: 10px;
    background: ${({ scoreBgColor }) => scoreBgColor};
    padding: 2px 12px;
    color: #003447;
  }

  .ant-skeleton-element {
    width: 100%;
  }
`;

const TopPerformers = ({ loading, first, second, third }) => {
  const checkWorkerStageObject = (stageWorker) => {
    if (
      stageWorker &&
      stageWorker.name !== undefined &&
      stageWorker.name !== "" &&
      stageWorker.name !== "undefined undefined" &&
      stageWorker.score !== undefined &&
      stageWorker.score !== ""
    ) {
      return true;
    } else {
      return false;
    }
  }

  return (
    <Container>
      <h3>Top Performers</h3>
      <div className="places">
        {loading ?
          (
            <>
              <PlaceContainer skeleton={true}>
                <Skeleton.Button active={true} size="large" shape="default" style={{ height: 143, borderRadius: "5px", width: '100%' }}
                />
              </PlaceContainer>
              <PlaceContainer skeleton={true}>
                <Skeleton.Button active={true} size="large" shape="default" style={{ height: 180, borderRadius: "5px", width: '100%' }} />
              </PlaceContainer>
              <PlaceContainer skeleton={true}>
                <Skeleton.Button active={true} size="large" shape="default" style={{ height: 113, borderRadius: "5px", width: '100%' }} />
              </PlaceContainer>
            </>

          ) : (
            <>
              {second && checkWorkerStageObject(second) && (
                <PlaceContainer height={143} bgColor="#67d5ff" scoreBgColor="#b6ebff">
                  <div className="name">{loading ? <LoadingOutlined /> : capitalizeAll(second.name)}</div>
                  <div className="place">2nd</div>
                  <div className="score">{loading ? <LoadingOutlined /> : second.score}</div>
                </PlaceContainer>
              )}
              {
                first && checkWorkerStageObject(first) && (
                  <PlaceContainer height={180} bgColor="#00a1de" scoreBgColor="#b6ebff">
                    <div className="name">{loading ? <LoadingOutlined /> : capitalizeAll(first.name)}</div>
                    <div className="place">1st</div>
                    <div className="score">{loading ? <LoadingOutlined /> : first.score}</div>
                  </PlaceContainer>
                )}

              {third && checkWorkerStageObject(third) && (
                <PlaceContainer height={113} bgColor="#b6ebff" scoreBgColor="#dff3fb">
                  <div className="name">{loading ? <LoadingOutlined /> : capitalizeAll(third.name)}</div>
                  <div className="place">3rd</div>
                  <div className="score">{loading ? <LoadingOutlined /> : third.score}</div>
                </PlaceContainer>
              )}
            </>
          )}
      </div>
    </Container>
  );
};

export default TopPerformers;
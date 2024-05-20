import styled from "styled-components";

export const StyledProjectStatuses = styled.div`
  .select-status {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: 1px 5px;
    gap: 5px;
    width: 104px;
    height: 22px;
    border-radius: 10px;
    border: none;
    background-color: ${props =>
    props.currentStatus === "ongoing" ? "#FFF7E6"
      : props.currentStatus === "onhold" ? "#FFF1F0"
        : props.currentStatus === "completed" ? "#F6FFED"
          : "#DCEBF1"
  }
  }
  .select-status-space {
    span {
      display: flex;
      gap: 5px;
      font-style: normal;
      font-weight: 500;
      font-size: 12px;
      line-height: 15px;
      color: ${props =>
    props.currentStatus === "ongoing" ? "#FAAD14"
      : props.currentStatus === "onhold" ? "#F5222D"
        : props.currentStatus === "completed" ? "#389E0D"
          : "#2C3336"
  };

      .arrow {
        align-self: baseline;
      }

      .clock {
        align-self: center;
      }
    }
  }
`;

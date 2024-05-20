import styled from "styled-components";

export const StyledInvoiceStatuses = styled.div`
  .select-status {
    padding: 1px 5px;
    gap: 5px;
    width: ${(props) => props.currentStatus === "paid_partially" ? "120px" : "104px"};
    height: 22px;
    border-radius: 10px;
    border: none;
    background-color: ${(props) =>
    props.currentStatus === "unpaid"
      ? "#FFF7E6"
      : props.currentStatus === "paid"
        ? "#F6FFED"
        : props.currentStatus === "paid_partially" ? "#FFF2E8" : "#DCEBF1"
  };
    }
  .select-status-space {
    span {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 5px;
      font-style: normal;
      font-weight: 500;
      font-size: 12px;
      line-height: 15px;
      color: ${(props) =>
    props.currentStatus === "unpaid" ? "#FAAD14"
      : props.currentStatus === "paid" ? "#389E0D"
        : props.currentStatus === "paid_partially" ? "#FA8C16" : "#2C3336"
  };

      .arrow {
        align-self: baseline;
      }

      .clock {
        align-self: center;
      }
    }
  }

  .ant-modal-header {
    border-bottom: 3px solid #f0f0f0 !important;
  }
`;

import styled from 'styled-components';

const StyledCard = styled.div`
  .card{
    box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2);
  }
  .true{
    background-color: black;
  }
  .ant-input-show-count-suffix{
    color: #40a9ff !important;
  }
  .ant-select .ant-select-selector {
    border-radius: 5px;
    height: 40px;
  }
  .ant-picker{
    border-radius: 5px;
    height: 40px;
  }
  .ant-radio-button {
    background: var(--primary);
    color: #fff;
    border: 1px solid var(--primary);
  }
  .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled) {
    color: #fff;
    border: 1px solid var(--primary);
  }
  .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled):hover {
    color: #fff;
    border: 1px solid var(--primary);
  }
  .ant-radio-button-wrapper{
    border: 1px solid var(--primary);
  }
  .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled)::before{
    background: var(--primary);
  }
  .ant-input-show-count-suffix{
    color: #000 !important;
  }
`;
export default StyledCard

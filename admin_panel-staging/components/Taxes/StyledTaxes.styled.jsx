import styled from 'styled-components';

export const StyledTaxes = styled.div`
.container{
  display: flex;
  flex-direction: column;
  gap:50px;
  padding-top: 20px;
}
.form-container{
    display: flex;
    flex-direction: column;
    gap: 10px;
    header{
      font-style: normal;
      font-weight: 450;
      font-size: 16px;
      line-height: 22px;
      color: #000000;
    }
    .form{
      display: flex;
      gap: 20px;
    }
}
.ant-select-selector {
      border: 1px solid #ccdbe1;
      border-radius: 5px;
      line-height: 0px;
    }
.datepicker {
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: 8px 12px;
    width: 400px;
    height: 40px;
    background: #ffffff;
    border: 1px solid #ccdbe1;
    border-radius: 5px;
  }
  .ant-select-single.ant-select-lg:not(.ant-select-customize-input) .ant-select-selector {
    border-radius: 5px;
    width: 230px;
    font-style: normal;
    font-weight: 700;
    font-size: 16px;
    line-height: 25px;
  }
  .card-container{
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
    width: 100%;
    header{
      font-style: normal;
      font-weight: 450;
      font-size: 16px;
      line-height: 22px;
      color: #000000;
    }
    .card{
      background: #ffffff;
      display: flex;
      flex-direction: column;
      padding: 10px 20px;
      gap: 10px;
      border: 1px solid #ccdbe1;
      border-radius: 8px
    }
  }
  .header{
    font-style: normal;
    font-weight: 500;
    text-transform: uppercase;
    line-height: 22px;
    font-size: 15px !important;
    color: #414A52 !important;
  }
  .value{
    font-style: normal;
    font-weight: bold;
    line-height: 22px;
    font-size: 20px;
    color: #00A1DE
  }
  .export {
    align-self: center;
  }
  .export-btn{
    color: #fff !important;
  }
`;

import styled from "styled-components";

export const StyledFilterButton = styled.div`
  width: 100%;
  border-radius: 5px 5px 0px 0px;
  background: #e4eef3;
  border-color: #e4eef3;
  display: inline;
  padding: 10px 20px;
  align-self: flex-start;
  cursor: pointer;
  border-radius: ${(props) => !props.filter_expanded && "5px"};
  border: ${(props) => !props.filter_expanded && "1px solid #CCDBE1"};

  .clear {
    background-color: inherit;
    border-radius: 5px;
  }
`;

export const StyledCardTabs = styled.div`
  display: flex;
  flex-direction: column;
  margin: 20px 0;
  .form-container {
    /* display: flex;
    flex-direction: column; */
  }
  .filter-body {
    background: #e4eef3;
    padding: 10px 20px;
  }
  .filter-fields {
    display: flex;
    gap: 10px;
    > div {
      width: 100%;
    }
    .ant-picker-range {
      width: 100%;
    }
  }
  .buttons-container {
    display: flex;
    justify-content: space-between;
    button {
      height: 40px;
      width: fit-content;
      border: none;
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--primary);
    }
   
  }
`;

export const StyledFiltersContainer = styled.div`
  border: 1px solid #0291c8;
  border-radius: 5px;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  /* position: relative; */
  width: 100%;

  h3 {
    margin: 0;
    margin-right: 20px;
  }
  .filter-items-container {
    flex-wrap: wrap;

    display: flex;
    gap: 10px;
    /* width: 80vw; */
    overflow: scroll;
    -ms-overflow-style: none; /* Internet Explorer 10+ */
    scrollbar-width: none; /* Firefox */
  }
  .filter-items-container::-webkit-scrollbar {
    display: none; /* Safari and Chrome */
  }
  .buttons {
    margin-left: auto;
  }
`;

export const FilterItem = styled.div`
  background-color: red;
  color: #016894;
  background: #dff3fb;
  border-radius: 5px;
  padding: 4px 8px;
  white-space: nowrap;
  .anticon {
    cursor: pointer;
  }
  text-transform: capitalize;
`;

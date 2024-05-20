import styled from "styled-components";

export const StyledSideBar = styled.div`
  aside{
    width: inherit;
    font-size: 20px;
    background-color: white !important;
    margin-top: -40px;
    border-right: 1px solid #f0f0f0;
    // height: 100vh;
  }
  ul{
    list-style: none;
    padding-top: 40px;
  }
  li:hover{
    // color: white;
  }
  a{
    display: flex;
    color:#ABB5BA;
    fontWeight: bold;
    width: 150px;
    margin: 5px;
    padding: 10px;
    border-radius: 50px;
  }
  li a:hover {
    background-color: #2CB7BD;
    color: #fff
  }
  // button{
  //   color:#ABB5BA;
  //   margin-right: 100px;
  // }
  .trigger{
    position: absolute;
    bottom: 0;
    padding-left: 30px;
  }
  .collapse{
    margin-left: 30px;
    margin-top: 100px;
  }
`;

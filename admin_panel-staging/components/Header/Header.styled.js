import styled from "styled-components";

const changeHeaderColor = () => {
  const color = process.env.NEXT_PUBLIC_PRIMARY_COLOR
  if (color === "fed53c") {
    return "white"
  }
  return "var(--primary)"
}
const changeProfileColor = () => {
  const color = process.env.NEXT_PUBLIC_PRIMARY_COLOR
  if (color === "fed53c") {
    return "black"
  }
  return "var(--secondary)"
}

export const StyledHeader = styled.div`
  position: sticky;
  top: 0;
  background-color: ${changeHeaderColor()};
  padding: 0px 80px;
  box-shadow: 0px 0px 10px 10px rgba(0, 0, 0, 0.1);
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
  margin-bottom: 20px;
  height: 86px;
  z-index: 40;

  .ant-page-header {
    padding-left: 0;
    padding-right: 0;
    padding-top: 10px;
    background-color: transparent;
    color: white;
    height: 86px;
  }
  .loader {
    text-align: center;
  }
  .headerIcons{
    width: 200px;
    padding: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .profile {
    display: flex;
    //border: 1px solid #32c1f7;
    border-radius: 10px;
    cursor: pointer;
    margin-top: -5px;
    color: ${changeProfileColor()};
  }
  .profile-1 {
    display: flex;
    flex-direction: column;
    font-weight: bold;
    font-size: 16px;
    text-align: right;
    padding-right: 15px;
    padding: 5px;
    text-transform: capitalize;
  }
  .profile-1 span {
    font-size: 12px;
    
  }
  .profile-2 {
    padding: 5px;
    text-transform: capitalize;
  }
  .photo {
    width: 40px;
    height: 40px;
    border-radius: 100px;
    cursor: pointer;
  }
`;

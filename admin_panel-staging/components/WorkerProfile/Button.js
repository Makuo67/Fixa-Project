import { StyledProfile } from "./WorkerProfile.styled";

const Button = (props) => {
  var isValid = props.status;
  return (
    <>
      <StyledProfile>
        <button className="button">
          <span
            className="text"
            style={{ color: isValid ? "#F5222D" : "#24282C" }}
          >
            {props.text}{" "}
          </span>
        </button>
      </StyledProfile>
    </>
  );
};

export default Button;
import { DatePicker, Input } from "antd";
import { StyledWorkHistory } from "./WorkHistory.styled";
import Icon from "@ant-design/icons";
import { EndSvg } from "../../Icons/CustomIcons";

const EndIcon = (props) => <Icon component={EndSvg} {...props} />;

const Filters = () => {
  return (
    <>
      <StyledWorkHistory>
        <div className="card">
          <h5>FILTER BY</h5>
          <div className="filters">
            <div className="filter-input">
              <p className="filter-headers">Date</p>
              <Input.Group className="date-input">
                <DatePicker.RangePicker style={{ width: "70%" }} />
              </Input.Group>{" "}
            </div>
            <div className="filter-input">
              <p className="filter-headers">Projects</p>
              <Input placeholder="Please select" className="input" />
            </div>
            <div className="filter-input">
              <p className="filter-headers">Trade</p>
              <Input placeholder="Please select" className="input" />
            </div>
          </div>
        </div>
      </StyledWorkHistory>
    </>
  );
};

export default Filters;

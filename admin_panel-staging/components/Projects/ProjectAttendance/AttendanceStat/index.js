import {
  LoadingOutlined,
} from "@ant-design/icons";
import Icon from "@ant-design/icons";
import { StyledAttendanceStat } from "./StyledAttendanceStat.styled";
import { toMoney } from "../../../../helpers/excelRegister";
/**
 *
 * Required params:
 * @param date_title
 * @icon
 * @numbers
 */

const AttendanceStat = ({
  numbers,
  percentage,
  loading,
  arrow,
  icon,
  title,
  showLastWeekText,
}) => {

  return (
    <StyledAttendanceStat>
      <div className="card">
        <div className="header">
          <h4 className="title">{title}</h4>
          <div className="icon">{icon}</div>
        </div>
        {!arrow ? (

          <div className="content">
            {/* <div> */}
            <span className="num">{loading ? <LoadingOutlined /> : toMoney(numbers || 0)}</span>
            {/* </div> */}
          </div>
        ) : (

          <div className="content">
            {/* <div> */}
            <span className="num">{loading ? <LoadingOutlined /> : toMoney(numbers || 0)}</span>
            <div className="perc">
              <div className="perc-1">
                <span className={parseInt(percentage) > 0 ? `arrow` : `arrowdown`}>{parseInt(percentage) > 0 ? <Icon icon="iwwa:arrow-up" /> : <Icon icon="iwwa:arrow-down" />}</span>
                <span className={parseInt(percentage) > 0 ? `percentage` : `percentagedown`}>{loading ? <LoadingOutlined /> : percentage?.toFixed(0)}%</span>
              </div>
              {showLastWeekText?
                <div className="perc-2">
                  <span>Last week</span>
                </div> : " "
              }
            </div>
            {/* </div> */}
          </div>
        )}
      </div>
    </StyledAttendanceStat>
  );
};

export default AttendanceStat;

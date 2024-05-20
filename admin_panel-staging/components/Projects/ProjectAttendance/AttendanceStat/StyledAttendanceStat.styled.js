import { useRouter } from "next/router";
import styled from "styled-components";

export const StatsContainer = styled.div`
  display: flex;
  align-content: space-between;
  width: 100%;
  gap: 20px;
`;
function GetCardWidth() {
  const router = useRouter();
  const bool = router.pathname === '/projects/[name]/attendance/[date]' ? true : false

  if (bool) {
    return '250px';
  }
  else {
    return '';
  }
}
export const StyledAttendanceStat = styled.div`
    width: 100%;
   
  .card {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: 12px;
    width: ${props => GetCardWidth(props.isAttendanceList)};
    background: #ffffff;
    box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
    border-radius: 6px;
  }
  .header {
    display: flex;
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
    // background-color:blue;
  }
  .header .title {
    color: #828282;
    font-weight: 900;
    font-size: 10px;
    text-transform: uppercase;
  }
  .content {
    display: flex;
    flex-direction: row;
  }
  .content .num {
    font-family: "Circular Std";
    font-style: normal;
    font-weight: 500;
    font-size: 40px;
    line-height: 51px;

    /* identical to box height */

    /* Value Color */
    color: #0b1354;
    padding: 2px;
  }
  .arrowdown {
    color: #f5222d;
    margin-top: 20px;
    padding: 2px;
  }
  .arrow {
    color: #389e0d;
    margin-top: 20px;
    padding: 2px;
  }
  .percentagedown {
    color: #f5222d;
    margin-top: 20px;
    padding: 2px;
  }
  .percentage {
    color: #389e0d;
    margin-top: 20px;
    padding: 2px;
  }
  .perc {
    display: flex;
    flex-direction: column;
    text-align: left;
    margin-top: 12px;
  }
  .perc-2{
    font-size: 10px;
    color: #828282;
    padding-left: 2px;
  }
`;

import styled from "styled-components";
import { LoadingOutlined } from "@ant-design/icons";
import Icon from "@ant-design/icons";
import { Tooltip } from "antd";

import { InfoSvg } from "../Icons/CustomIcons";
import { toMoney } from "../../helpers/excelRegister";
import { ProjectAggregatesSkeletons } from "../Skeletons/ProjectAggregatesSkeletons";

const InfoIcon = (props) => <Icon component={InfoSvg} {...props} />;

export const StyledPaymentTitle = styled.div`
  width: 143px;
  height: 40px;
  font-family: "Circular Std";
  font-style: normal;
  font-weight: 500;
  font-size: 24px;
  line-height: 40px;
  color: #171832;
  flex: none;
  order: 0;
  flex-grow: 0;
`;
export const StyledStatsContainer = styled.div`
  display: flex;
  align-content: space-between;
  width: 100%;
  gap: 20px;
  margin-top: 20px;
`;
export const StyledStats = styled.div`
  border-radius: 8px;
  border: ${(prop) =>
    prop.isPayment
      ? "1px solid #DCEBF1"
      : prop.isPayroll
        ? "1px solid #DCEBF1"
        : "1px solid #DCEBF1"};
  background: ${(prop) =>
    prop.isPayment ? "#FFFFFF" : prop.isPayroll ? "#FFFFFF" : "#FFFFFF"};
  padding: 10px 20px;
  width: 100%;
  /* height: 5rem; */
  text-transform: uppercase;

  display: flex;
  flex-direction: column;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-content: space-between;
  cursor: ${(prop) => (prop.info ? "pointer" : "default")};

  h3 {
    font-size: 24px;
    margin: 0;
    color: ${(prop) =>
    prop.title === "OPEN PAYMENTS"
      ? "#FA8C16"
      : prop.title === "CLOSED PAYMENTS"
        ? "#52C41A"
        : prop.title === "FAILED"
          ? "#F5222D !important"
          : prop.title === "SUCCESSFUL"
            ? "#52C41A !important"
            : prop.title === "DEDUCTIONS (RWF)" || prop.title === "NET AMOUNT TO BE DISBURSED (RWF)" || prop.title === "PAYOUT AMOUNT (Rwf)" || prop.title === "GROSS AMOUNT (RWF)" ?
              "#00a1de !important" : ""};
  }

  h4 {
    font-weight: 500;
    font-size: 10px;
    margin: 0;
    font-family: "circular-std" !important;
  }

  p {
    font-size: 8px;
    color: gray;
    font-family: "circular-std" !important;
    margin: 0;
  }

  .loader {
    text-align: center;
  }

  .text-w-icon {
    display: flex;
    padding-right: 10px;
    font-family: "circular-std" !important;
    color: #6a7178;
    font-weight: bold;
  }

  .deduTitle {
    padding-right: 3px;
  }

  .aggregates {
    display: flex;
    justify-content: space-between;
  }

  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #DFF3FB;
    border-radius: 40px;
    height: 55px;
    width: 55px;
  }

  .lower-icon {
    display: flex;
    gap: 12px;
  }
  .outer-aggregates{
    display:flex;
    flex-direction:row;
    gap: 20px;
  }
  .inner-aggregates-1{
    display: flex;
    flex-direction:row;
    gap: 10px;
  }
  .inner-aggregates-2{
    display: flex;
    flex-direction: row;
    gap:10px;
  }
  .first-icon{
    background-color: ${(props) => props.title === 'ACTIVE WORKERS'
    ? "#B6EBFF" : props.title === "TOTAL SHIFTS"
      ? "#FFF1B8" :
      "#FFF1B8"
  };
  }
  .first-icon-1{
    background-color: ${(props) => props.title === 'ACTIVE WORKERS'
    ? "#FFD6E7" : props.title === "TOTAL SHIFTS"
      ? "#003447" :
      "#DFF3FB"
  };
  }
  .first-icon, .first-icon-1{
    display:flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    border-radius: 2px;
    width: 31px;
    height: 31px;
  }
  .second-icon, .second-icon-1{
    display: flex;
    flex-direction:column;
    gap: 5px;
    span{
      font-style: normal;
      font-weight: 500;
      font-size: 10px;
      line-height: 13px;
      color: #798C9A;
    }
    h2{
      font-style: normal;
      font-weight: 500;
      font-size: 12px;
      line-height: 15px;
      color: #171832;
    }
  }

  .lower-icon-1, .lower-icon-2 {
    display: flex;
    gap: 6px;
    font-size: 13px;
    font-weight: bold;
  }

  .lower-icon-1 > span:first-child {
    background-color: ${(prop) =>
    prop.title === "total projects" ? "#FFF1B8" : prop.title === "active workers" ? "#B6EBFF" : prop.title === "total shifts" ? "#FFF1B8" : prop.title === "total invoice amount" ? "#FFF1B8" : "#FFFFFF"};
    border-radius: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: ${(prop) => prop.isProjectName ? "31px" : "20px"};
    height: ${(prop) => prop.isProjectName ? "31px" : "20px"};
    font-weight: bold;
  }

  .lower-icon-2 > span:first-child {
    background-color: ${(prop) =>
    prop.title === "total projects" ? "#FFFFFF" : prop.title === "active workers" ? "#FFD6E7" : prop.title === "total shifts" ? "#003447" : prop.title === "total invoice amount" ? "#B6EBFF" : "#FFFFFF"};
    border-radius: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: ${(prop) => prop.isProjectName ? "31px" : "20px"};
    height: ${(prop) => prop.isProjectName ? "31px" : "20px"};
  }

  .icon-1 {
    background-color: ${(prop) =>
    prop.title === "total projects" ? "#FFFFFF" : prop.title === "active workers" ? "#FFD6E7" : "#FFFFFF"};
  }
  .project-label{
    display:flex;
    flex-direction: column;
    gap: 5px;
  }
  .label-title{
    font-style: normal;
    font-weight: 500;
    font-size: 10px;
    line-height: 13px;
    color: #798C9A;
  }
  .label-value{
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 15px;
    color: #171832;
  }
`;

const Stats = (props) => {

  return (
    <StyledStats
      isPayment={props.isPayment}
      isPayroll={props.isPayroll}
      info={props.info}
      isProjectName={props.isProjectName}
      title={props.title}
      onClick={props?.onClick}
    >
      {props.info ? (
        <>
          <h4 className="text-w-icon">
            <div className="deduTitle">{props.title}</div>
            <Tooltip
              title={
                props.infoText
                  ? `${props.infoText}`
                  : ""
              }
            >
              <InfoIcon className="cursor-pointer" />
            </Tooltip>
          </h4>
          <h3>
            {props.loading ? <LoadingOutlined /> : props?.error || typeof props?.value == 'undefined' || typeof props?.value == 'string' && props?.value.toLowerCase() == 'nan' ? '-' : props?.value}
          </h3>
          <p className="text-bold">{props.sub_title}</p>
        </>
      ) : (
        <>
          <div className={'aggregates'}>
            <div>
              <h4 className="text-bold text-neutral">{props.title}</h4>
              {!props.isAssessment && <h3 style={{ color: '#171832', fontSize: (props.isDashboard ? '48px' : '') }}>
                {props.loading ? <LoadingOutlined /> : props?.error || typeof props?.value == 'undefined' || typeof props?.value == 'string' && props?.value.toLowerCase() == 'nan' ? '-' : props?.value}
              </h3>}
              {props.isAssessment && <h3 style={{ color: '#171832', fontSize: (props.isDashboard ? '48px' : '') }}>
                {props.loading ? <LoadingOutlined /> :
                  (props.error ||
                  (typeof props.value1 === 'undefined' || typeof props.value2 === 'undefined') ||
                  (typeof props.value1 === 'string' && props.value1.toLowerCase() === 'nan') ||
                  (typeof props.value2 === 'string' && props.value2.toLowerCase() === 'nan')) ?
                  '-' :
                  [props.value1, props.value2].join(' / ')}
              </h3>}
              <p className="text-bold">{props.sub_title}</p>
              {props.isDashboard && <div className={'lower-icon'}>
                <div className={'lower-icon-1'}>
                  <span className={'icon-1'}>{props.icon1}</span>
                  {props.loading ? <LoadingOutlined /> : props?.error ? '-' :
                    <span>{props.title === 'total shifts' ? toMoney(props?.metrics?.total_day_shifts)
                      : props.title === 'active workers' ? toMoney(props?.metrics?.active_male_workers)
                        : props?.metrics?.total_active_project}</span>}
                </div>
                <div className={'lower-icon-2'}>
                  <span className={'icon-1'}>{props.icon2}</span>
                  {props.title !== 'total projects' &&
                    props.loading ? <LoadingOutlined /> : props?.error ? '-' :
                    <span>{props.title === 'total shifts' ? toMoney(props?.metrics?.total_night_shifts)
                      : props.title === 'active workers' ? toMoney(props?.metrics?.active_female_workers)
                        : props.project !== -1 ? '' : props?.metrics?.total_inactive_project
                    }
                    </span>
                  }
                </div>
              </div>}


              {/*
               Project name details stats
               */
              }
              {props.isProjectName && <div className={'lower-icon'}>
                {props.loading ? <ProjectAggregatesSkeletons />
                  : (
                    <div className="outer-aggregates">
                      <div className="inner-aggregates-1">
                        <span className="first-icon">{props.icon1}</span>
                        <div className="second-icon">
                          <span>{props.title1}</span>
                          <h2>{props.value1}</h2>
                        </div>
                      </div>
                      <div className="inner-aggregates-2">
                        <span className="first-icon-1">{props.icon2}</span>
                        <div className="second-icon-1">
                          <span>{props.title2}</span>
                          <h2>{props.value2}</h2>
                        </div>
                      </div>
                    </div>
                  )}
              </div>}
            </div>
            {props.isDashboard && props.icon &&
              <div className={'icon'}>
                {props.icon}
              </div>
            }
          </div>
        </>
      )}
    </StyledStats>
  );
};

export default Stats;

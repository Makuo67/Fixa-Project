import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HourglassOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Icon } from "@iconify/react";
import { Statistic, Tooltip } from "antd";
import Head from "next/head";
import { useEffect, useState } from "react";
import MTNTable from "./MTNTable";
import { StyledPayrollTable } from "./PayrollTable.styled";
import ReviewTable from "./ReviewTable";
import SummaryTable from "./SummaryTable";

const PayrollTable = ({ data, header, payroll_id, loading, error, type }) => {
  return (
    <StyledPayrollTable>
      <Head>
        <title>Payroll Summary</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <div className="header">
        <Statistic title="Date" value={header?.date} prefix={<CalendarOutlined />} />
        {type == "summary" && (
          <>
            <Statistic
              title="Successful payouts"
              value={data.filter((o) => o.transaction_status == "successful").length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
            <Statistic
              title="Failed payouts"
              value={data.filter((o) => o.transaction_status == "failed").length}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: "#fc0303" }}
            />
            <Statistic
              title="Initiated payouts"
              value={data.filter((o) => o.transaction_status == "initiated").length}
              prefix={<HourglassOutlined />}
              valueStyle={{ color: "#FFBF00" }}
            />
          </>
        )}
        <div className="stats">
          <div>
            <Tooltip title="Total combined shifts of all workers">
              <Statistic
                title="Combined shifts"
                value={header?.total_shifts}
                prefix={<Icon icon="icon-park-outline:transaction-order" color="black" height="24" />}
              />
            </Tooltip>
          </div>
          <div>
            <Statistic title="Total Workers" value={header?.total_workers} prefix={<UserOutlined />} />
          </div>
          <div>
            <Statistic title="Amount Due" value={header?.amount_due} suffix="RWF" valueStyle={{ color: "#3f8600" }} />
          </div>
        </div>
      </div>
      {type == "review" && (
        <ReviewTable
          data={data}
          header={header}
          payroll_id={payroll_id}
          project_id={header.project_id}
          loading={loading}
          error={error}
        />
      )}
      {type == "MTN" && <MTNTable data={data} loading={loading} error={error} payroll_id={payroll_id} />}
      {type == "summary" && (
        <SummaryTable
          data={data}
          showModal={true}
          amount_disbursed={header?.amount_due}
          loading={loading}
          error={error}
        />
      )}
    </StyledPayrollTable>
  );
};

export default PayrollTable;

import React, { useState, useEffect } from "react";
import { CheckCircleOutlined, CheckCircleTwoTone, CloseCircleOutlined } from "@ant-design/icons";
import { Badge, Button, DatePicker, Popover, Progress, Select, Statistic, Tag, Tooltip } from "antd";
import moment from "moment";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import NumberFormat from "../shared/NumberFormat";
import DynamicTable from "./DynamicTable";

const { Option } = Select;

const PayrollHistoryTable = (props) => {

  
  const projects = useSelector((state) => state.project.list);
  
  const checkStatus = (status) => {
    switch (status) {
      case "paid":
        return {
          color: "green",
          pathname: `/routine-payroll/summary`,
          button_type: "ghost",
          button_text: "View Summary",
          disabled: false,
          tooltip: "",
        };
      case "unpaid":
        return {
          color: "red",
          pathname: `/routine-payroll/run-payroll/[step]`,
          button_type: "primary",
          button_text: "View Details",
          disabled: false,
          tooltip: "",
        };
      case "invalid":
        return {
          color: "orange",
          pathname: "",
          button_type: "primary",
          button_text: "View Details",
          disabled: true,
          tooltip: "Cannot run payroll when status is invalid.",
        };
      default:
        return {};
    }
  };

  const payrolls = useSelector((state) => state.payroll.list);
  const payrolls_loading = useSelector((state) => state.payroll.loading);
  const payrolls_error = useSelector((state) => state.payroll.error);


  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageOffset, setPageOffset] = useState(0);

  const router = useRouter();
  const { project_id, year } = router.query;

  const handleTableChange = (pagination) => {
    const offset = pagination.current * pagination.pageSize - pagination.pageSize;
    setPageOffset(offset);
    setPageSize(pagination.pageSize);
    setCurrentPage(pagination.current);
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
    },
    {
      title: "Date",
      dataIndex: "date_range",
      key: "date",
    },
    {
      title: "Status",
      dataIndex: "payroll_status",
      key: "status",
      render: (text) => {
        let color = checkStatus(text).color;
        return (
          <Tag color={color} key={text}>
            {text.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Combined shifts",
      dataIndex: "total_shifts",
      key: "total_shifts",
      render: (value) => <Tooltip title="Total combined shifts of all workers">{value}</Tooltip>,
    },
    {
      title: "Total workers",
      dataIndex: "total_workers",
      key: "total_workers",
    },
    {
      title: "Transaction Progress",
      dataIndex: "failed_transactions",
      key: "failed_transactions",
      width: 170,

      render: (failed_transactions, data) => {
        return data.payroll_status == "paid" ? (
          <Popover
            content={
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Statistic
                  title="Success"
                  value={data.successful_transactions || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: "#3f8600" }}
                  style={{ marginRight: "10px" }}
                />
                <Statistic
                  title="Failure"
                  value={failed_transactions || 0}
                  prefix={<CloseCircleOutlined />}
                  valueStyle={{ color: "#fc0303" }}
                />
              </div>
            }
            title="Summary"
            trigger="hover"
          >
            <Progress
              percent={(parseInt(data.successful_transactions) / parseInt(data.total_workers)) * 100}
              steps={10}
              format={(value) => (value != 100 ? parseInt(value) + "%" : <CheckCircleTwoTone twoToneColor="#52c41a" />)}
              // size="small"
              status="active"
              strokeColor="#52c41a"
            />
          </Popover>
        ) : (
          <Tooltip title="Cannot display progress because the payroll has not been run yet">
            <Badge status="processing" text="No Data" />
          </Tooltip>
        );
      },
    },
    {
      title: "Amount (RWF)",
      dataIndex: "amount",
      key: "amount",
      render: (value) => <NumberFormat value={value} />,
    },
    {
      title: "Action",
      key: "action",
      dataIndex: "payroll_status",

      render: (payroll_status, data) => (
        <Tooltip title={checkStatus(payroll_status).tooltip}>
          <Button
            key={data.id}
            onClick={() => {
              const query =
                payroll_status == "unpaid"
                  ? {
                      project_id: project_id,
                      payroll_id: data.id,
                      payroll_type: data.payroll_type_id,
                      step: "review",
                    }
                  : {
                      project_id: project_id,
                      payroll_id: data?.id,
                      payroll_type: data?.payroll_type_id,
                    };
                    
              router.push({
                pathname: checkStatus(payroll_status).pathname,
                query: query,
              });
            }}
            type={checkStatus(payroll_status).button_type}
            disabled={checkStatus(payroll_status).disabled}
            block
          >
            {checkStatus(payroll_status).button_text}
          </Button>
        </Tooltip>
      ),
    },
  ];
  return (
    <DynamicTable
      data={payrolls}
      columns={columns}
      loading={payrolls_loading}
      error={payrolls_error}
      rowKey="id"
      extra_left={[
        <div style={{ display: "flex" }} key="1">
          <h3 style={{ lineHeight: "30px", padding: 0, marginBottom: 0, marginRight: "20px" }}>Year:</h3>
          <DatePicker onChange={(e) => props.onYearChange(e)} format={"YYYY"} value={moment(year)} picker="year" />
        </div>,
      ]}
      pagination={{
        defaultCurrent: currentPage,
        defaultPageSize: pageSize,
      }}
      onChange={(value) => handleTableChange(value)}
      // extra_right={[
      //   <Select
      //     key={1}
      //     onSelect={(e) => props.onProjectSelect(e)}
      //     placeholder="Select project"
      //     style={{ width: "100%" }}
      //     value={{ value: project_id, label: projects.find((o) => o.id == project_id)?.name }}
      //   >
      //     {projects?.map((item) => {
      //       return (
      //         <Option value={item.id} key={item.id} project_name={item.name}>
      //           {item.name}
      //         </Option>
      //       );
      //     })}
      //   </Select>,
      // ]}
      size="large"
    />
  );
};

export default PayrollHistoryTable;

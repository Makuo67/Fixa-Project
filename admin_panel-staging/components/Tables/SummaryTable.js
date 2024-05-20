import { CheckCircleTwoTone, CloseCircleTwoTone, SyncOutlined } from "@ant-design/icons";
import { Button, Table, Tag, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import Error from "../Error/Error";
import NumberFormat from "../shared/NumberFormat";
import SkeletonTable from "./SkeletonTable";
import { getPayrollSummary } from "../../redux/actions/payroll.actions";
import { getBalance } from "../../redux/actions/user.actions";

const getColor = (status) => {
  switch (status) {
    case "failed":
      return "red";
    case "successful":
      return "green";
    case "initiated":
      return "orange";
    default:
      return "blue";
  }
};

const SummaryTable = ({ data, loading, error, showModal, amount_disbursed, meta }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  
  const { payroll_id, step } = router.query;

  useEffect(() => {
    if (!payroll_id) {
      return;
    }
    dispatch(getPayrollSummary(payroll_id));
    dispatch(getBalance());
  }, [router.isReady]);

  const columns = [
    {
      title: "Name",
      dataIndex: "worker_name",
      key: "worker_name",
    },
    {
      title: "Phone",
      dataIndex: "worker_phone_number",
      key: "worker_phone_number",
      render: (value, data) => {
        return (
          <Tooltip title={data.momo ? "This phone number is verified" : "This phone number is not verified"}>
            {value}{" "}
            {data.momo ? <CheckCircleTwoTone twoToneColor="#52c41a" /> : <CloseCircleTwoTone twoToneColor="red" />}
          </Tooltip>
        );
      },
    },
    {
      title: "Total shifts",
      dataIndex: "total_shifts",
      key: "total_shifts",
      sorter: (a, b) => a.total_shifts - b.total_shifts,
      ellipsis: true,
    },
    {
      title: "Earnings (RWF)",
      dataIndex: "take_home",
      key: "take_home",
      render: (value) => <NumberFormat value={value} />,
    },
    {
      title: "Status",
      dataIndex: "transaction_status",
      key: "transaction_status",
      filters: [
        {
          text: "Successful",
          value: "SUCCESSFUL",
        },
        {
          text: "Failed",
          value: "FAILED",
        },
        {
          text: "Initiated",
          value: "Initiated",
        },
      ],
      onFilter: (value, worker) => worker?.transaction_status?.indexOf(value) === 0,

      ellipsis: true,
      render: (status, worker) => {
        return (
          <>
            <Tooltip title={worker.error_message}>
              <Tag color={getColor(status)} key={status}>
                {status?.toUpperCase()}
              </Tag>
            </Tooltip>
          </>
        );
      },
    },
  ];
  return loading ? (
    <SkeletonTable columns={columns} rowCount={10} />
  ) : error ? (
    <Error status={error} backHome={true} />
  ) : (
    <>
      {/* {showModal && <SummaryModal amount_disbursed={amount_disbursed} />} */}
      <Table
      rowKey="id"
      columns={columns}
      // rowSelection={{ ...rowSelection }}
      dataSource={data}
      />
    </>
  );
};

export default SummaryTable;

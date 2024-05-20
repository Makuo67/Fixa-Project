import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";
import { Table, Tooltip, Typography } from "antd";
import { useState } from "react";
import Error from "../Error/Error";
import NumberFormat from "../shared/NumberFormat";
import Deductions from "./Deductions/Deductions";
import Increment from "./IncrementEarnings/Increment";
import SkeletonTable from "./SkeletonTable";

const { Text } = Typography;

const ReviewTable = ({ header, data, payroll_id, project_id, loading, error }) => {
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [dataSource, setDataSource] = useState([]);

  const onTableRowExpand = (expanded, record) => {
    console.log("######## PAYROLL DETAILS TABLE DATA #################", record)
    const keys = [];
    if (expanded) {
      keys.push(record.assigned_worker_id);
    }

    setExpandedRowKeys(keys);
  };
  const extraColumns = [
    {
      title: "Service",
      dataIndex: "service_name",
      key: "service_name",
    },
    {
      title: "Level",
      dataIndex: "level",
      key: "level",
    },
    {
      title: "Days Worked",
      dataIndex: "days_worked",
      key: "days_worked",
    },
    {
      title: "Daily Rate",
      dataIndex: "daily_rate",
      key: "daily_rate",
      render: (value) => <NumberFormat value={value} />,
    },
  ];

  const columns = [
    {
      title: "Worker Name",
      dataIndex: "worker_name",
      key: "worker_name",
      ellipsis: true,
    },
    {
      title: "Phone number",
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
      // render: (_, worker) =>
      //   worker.extra?.reduce((sum, current) => {
      //     return sum + Number(current.days_worked);
      //   }, 0),
    },
    {
      title: "Deductions",
      dataIndex: "total_deductions",
      key: "total_deductions",
      width: 300,
      render: (_, worker) => (
        <>
        <Deductions
          headerData={header}
          workerData={worker}
          project_id={project_id}
          data={worker?.deductions?.filter((deduction) => deduction.deduction_amount > 0)}
          payroll_id={payroll_id}
        />
        </>
      ),
    },
    {
      title: "Added amount",
      dataIndex: "additions",
      key: "additions",
      width: 200,
      render: (_, worker) => (
        <Increment
          headerData={header}
          workerData={worker}
          project_id={project_id}
          data={ [{amount: worker.additions}] }
          payroll_id={payroll_id}
        />
      ),
    },
    {
      title: "Earnings (RWF)",
      dataIndex: "take_home",
      key: "take_home",
      render: (earnings, worker) =>
        Number(worker.total_deductions) != 0 && worker.additions != 0 ? (
          <span>
            <NumberFormat value={worker.total_earnings} /> + <NumberFormat value={worker.additions} /> - <NumberFormat value={worker.total_deductions} /> = {" "}
            <Text strong>
              <NumberFormat value={worker.take_home} />
            </Text>
          </span>
        ) :  Number(worker.total_deductions) != 0 ? 
        (
          <span>
            <NumberFormat value={worker.total_earnings} /> - <NumberFormat value={worker.total_deductions} /> = {" "}
            <Text strong>
              <NumberFormat value={worker.take_home} />
            </Text>
          </span>
        ) : Number(worker.additions) != 0 ? 
        (
          <span>
            <NumberFormat value={worker.total_earnings} /> + <NumberFormat value={worker.additions} /> = {" "}
            <Text strong>
              <NumberFormat value={worker.take_home} />
            </Text>
          </span>
        )
        :(
          <NumberFormat value={earnings} />
        ),
    },
  ];

  const handleAdd = () => {
    const newData = {
      title: "Service Added",
      dataIndex: "service_name Added",
      key: "service_name Added",
    };
    setDataSource([...data, newData]);
    setCount(count + 1);
  };
  const handleSave = (row) => {
    const newData = [...dataSource];
    const index = newData.findIndex((item) => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    });
    setDataSource(newData);
  };

  return loading ? (
    <SkeletonTable columns={columns} rowCount={10} expandable />
  ) : error ? (
    <Error status={error} backHome={true} />
  ) : (
    <Table
      columns={columns}
      expandedRowKeys={expandedRowKeys}
      onExpand={onTableRowExpand}
      expandable={{
        expandedRowRender: (record) => (
          <Table size="small" dataSource={record.extra} columns={extraColumns} pagination={false} rowKey="service_id" />
        ),
      }}
      dataSource={data}
      rowKey="assigned_worker_id"
    />
  );
};

export default ReviewTable;

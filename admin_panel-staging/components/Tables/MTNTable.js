import { CheckCircleTwoTone, CloseCircleTwoTone, WarningTwoTone } from "@ant-design/icons";
import { Button, Input, Popconfirm, Table, Tooltip } from "antd";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { updateWorkerStatus } from "../../redux/actions/payroll.actions";
import Error from "../Error/Error";
import NumberFormat from "../shared/NumberFormat";
import SkeletonTable from "./SkeletonTable";

const { Search } = Input;

const MTNTable = ({ data, loading, error, payroll_id }) => {
  const [popconfirmVisible, setPopconfirmVisible] = useState(-1);
  const dispatch = useDispatch();
  
  const handleOk = (worker_id, to_enable, index) => {
    dispatch(updateWorkerStatus(payroll_id, worker_id, !to_enable,data[index].id))
    data[index].on_hold = !to_enable;
    setPopconfirmVisible(-1);
  };
  const columns = [
    {
      title: "Name",
      dataIndex: "worker_name",
      key: "worker_name",
      ellipsis: true,
      render: (value, data) => {
        return (
          <Tooltip title={data.on_hold && "This worker will not get paid"}>
            {data.on_hold && <WarningTwoTone twoToneColor="orange" />} {value}
          </Tooltip>
        );
      },
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
      title: "Take home (RWF)",
      dataIndex: "take_home",
      key: "take_home",
      render: (deducted_earnings) => {
        return <NumberFormat value={deducted_earnings} />;
      },
    },
    {
      title: "Action",
      dataIndex: "on_hold",
      key: "on_hold",
      width: 200,
      render: (on_hold, worker, index) => {
        return (
          <Popconfirm
            title="Are you sure？"
            okText="Yes"
            cancelText="No"
            visible={popconfirmVisible == index}
            onConfirm={() => handleOk(worker.assigned_worker_id, on_hold, index)}
            // okButtonProps={{ loading: confirmLoading }}
            onCancel={() => setPopconfirmVisible(-1)}
          >
            <Button type="link" onClick={() => setPopconfirmVisible(index)}>
              {!on_hold ? "Put on hold" : "Enable"}
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return loading ? (
    <SkeletonTable columns={columns} rowCount={10} />
  ) : error ? (
    <Error status={error} backHome={true} />
  ) : (
    <Table
      rowClassName={(record) => record.on_hold == true && "table-row-disabled"}
      columns={columns}
      dataSource={data}
      rowKey="id"
    />
  );
};

export default MTNTable;

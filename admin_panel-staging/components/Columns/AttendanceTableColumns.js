import { Button, Space, Table } from "antd";
import { capitalizeAll } from "../../helpers/capitalize";
import moment from "moment";

export const AttendanceTableColumns = [
  {
    title: "DATE",
    dataIndex: "date",
    key: "date",
    render: (_, record) => (
      <span style={{ fontSize: "14px", lineHeight: "18px", fontWeight: 500 }}>
        {moment(record.date).format("YYYY-MM-DD")}
      </span>
    ),
  },
  {
    title: "SHIFT",
    dataIndex: "shift_name",
    key: "shift_name",
    render: (shift_name) => (
      <span
        style={{
          color: "#0291C8",
          fontSize: "14px",
          lineHeight: "18px",
          fontWeight: 500,
        }}
      >
        {capitalizeAll(shift_name)}
      </span>
    ),
  },
  {
    title: "PROJECT",
    dataIndex: "project_name",
    key: "project_name",
    render: (project_name) => (
      <span style={{ fontSize: "14px", lineHeight: "18px", fontWeight: 500 }}>
        {capitalizeAll(project_name)}
      </span>
    ),
  },
  {
    title: "TIME SUBMITTED",
    dataIndex: "created_at",
    key: "created_at",
    render: (_, record) => (
      <span style={{ fontSize: "14px", lineHeight: "18px", fontWeight: 500 }}>
        {record.created_at.length <= 8
          ? record.created_at
          : moment(record.created_at).format("hh:mm A")}
      </span>
    ),
  },
  {
    title: "TOTAL WORKERS",
    dataIndex: "total_workers",
    key: "total_workers",
  },
  {
    title: "DONE BY",
    dataIndex: "done_by",
    key: "done_by",
  },
  {
    title: "STATUS",
    dataIndex: "status",
    key: "status",
    width: 300,
    render: (_, record) =>
      record.status === "approved" || record.status === "Approved" ? (
        <Space className="statusSpace">
          <Button type="secondary" className="approved">{`Approved`}</Button>
        </Space>
      ) : record.status === "pending" || record.status === "Pending" ? (
        <Space className="statusSpace">
          <Button type="secondary" className="pending">Waiting for approval</Button>
        </Space>
      ) : record.status == "declined" || record.status == "Declined" ? (
        <Space className="statusSpace">
          <Button type="secondary" className="declined">{`Declined`}</Button>
        </Space>
      ) : (
        ""
      ),
  },
  Table.EXPAND_COLUMN,
];

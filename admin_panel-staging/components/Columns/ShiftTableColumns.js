import { Button, Space, Table } from "antd";
import { capitalizeAll } from "../../helpers/capitalize";

export const ShiftTableColumns = [
  {
    title: "names",
    dataIndex: "names",
    key: "worker_name",
    render: (name, data) => (
      <Space
        className="username"
        style={{
          // background: "red",
          width: "100%",
          display: "flex",
          gap: "5px",
        }}
      >
        <span className="names cursor-pointer">{capitalizeAll(name)} </span>
      </Space>
    ),
  },
  {
    title: "Gender",
    dataIndex: "gender",
    key: "gender",
    render: (_, record) => (
      <Space className="gender">
        <span>{record.role_name ? capitalize(record.role_name) : "-"}</span>
      </Space>
    ),
  },
  {
    title: "Service",
    dataIndex: "trade",
    key: "trade",
    render: (trade) => (
      <Space className="service">
        <span>{record.role_name ? capitalize(record.role_name) : "-"}</span>
      </Space>
    ),
  },
  {
    title: "Phone number",
    dataIndex: "phone_number",
    key: "phone_number",
    render: (_, record) => (
      <Space className="phone">
        <span>{record.phone_number ? record.phone_number : "-"}</span>
      </Space>
    ),
  },
  {
    title: "EMAIL",
    dataIndex: "email",
    key: "email",
    render: (_, record) => (
      <Space className="email">
        <span>{record.email ? record.email : "-"}</span>
      </Space>
    ),
  },
  {
    title: "Project",
    dataIndex: "projects",
    key: "projects",
    render: (_, { projects }) => ProjectsMore(projects),
  },
  {
    title: "Daily Earnings",
    dataIndex: "daily_earnings",
    key: "daily_earnings",
    render: (_, record) => (
      <Space className="daily_earnings">
        <span>{record.role_name ? capitalize(record.role_name) : "-"}</span>
      </Space>
    ),
  },
  {
    title: "STATUS",
    dataIndex: "status",
    key: "status",
    render: (_, record) => (
      <Space className="status">
        <span>
          {record.status ? (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                padding: "1px 5px",
                borderRadius: "10px",
                fontStyle: "normal",
                fontWeight: "500",
                fontSize: "12px",
                lineHeight: "15px",
                color: "#0DA35B",
                backgroundColor: "#E8FAF0",
                width: "67px",
                height: "18px",
              }}
            >
              {" "}
              <Icon icon="carbon:dot-mark" color="#0da35b" />
              Active
            </span>
          ) : (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                padding: "1px 5px",
                borderRadius: "10px",
                fontStyle: "normal",
                fontWeight: "500",
                fontSize: "12px",
                lineHeight: "15px",
                color: "#F5222D",
                backgroundColor: "#FFF1F0",
                width: "67px",
                height: "18px",
              }}
            >
              {" "}
              <Icon icon="carbon:dot-mark" color="#F5222D" />
              Inactive
            </span>
          )}
        </span>
      </Space>
    ),
  },
  Table.EXPAND_COLUMN,
];

import { Button, Space, Table } from "antd";
import { Icon } from "@iconify/react";
import { capitalize, toMoney } from "../../helpers/excelRegister";
import Router from "next/router";

const handleView = (user) => {
  Router.push(
    `/settings/[${user.firstname} ${user.lastname}]?user_id=${user.id}&isAdmin=true`
  );
};

let level_1_columns = [
  {
    title: "ID",
    dataIndex: "id",
    key: "id",
  },
  {
    title: "FULL NAME",
    dataIndex: "firstname",
    key: "firstname",
    render: (_, record) => (
      <Space className="statusSpace">
        {record?.firstname || record?.lastname ?
          <>
            <span>{record?.firstname ? capitalize(record?.firstname) : ""}</span>
            <span>{record?.lastname ? capitalize(record?.lastname) : ""}</span>
          </>
          : "-"
        }
      </Space>
    ),
  },
  {
    title: "PHONE NUMBER",
    dataIndex: "username",
    key: "username",
    render: (_, record) => (
      <Space className="email-1">
        <span>
          {capitalize(record?.username?.length > 0 ? record?.username : "-")}
        </span>
      </Space>
    ),
  },
  {
    title: "EMAIL",
    dataIndex: "email",
    key: "email",
    render: (_, record) => (
      <Space className="email-0">
        <span>{record?.email ?? "-"}</span>
      </Space>
    ),
  },
  {
    title: "JOB TITLE",
    dataIndex: "job_title",
    key: "job_title",
    render: (_, record) => (
      <Space className="email-1">
        <span>{record?.job_title ? capitalize(record?.job_title) : "-"}</span>
      </Space>
    ),
  },
  {
    title: "Client",
    dataIndex: "client",
    key: "client",
    render: (_, record) => (
      <Space className="email-1">
        <span>{record?.client ? capitalize(record?.client.name) : "All"}</span>
      </Space>
    ),
  },
  {
    title: "STATUS ",
    dataIndex: "status",
    key: "status",
    render: (_, record) => (
      <Space className="status">
        <span>
          {record.isActive ? (
            <span
              className="flex items-center justify-center gap-1 px-2 rounded-md font-medium text-[#0DA35B] bg-[#E8FAF0] w-fit h-[18px]"
            >
              {" "}
              <Icon icon="carbon:dot-mark" color="#0da35b" />
              Active
            </span>
          ) : (
            <span
              className="flex items-center justify-center gap-1 px-2 rounded-md font-medium text-[#F5222D] bg-[#FFF1F0] w-fit h-[18px]"
            >
              {" "}
              <Icon icon="carbon:dot-mark" color="#F5222D" />
              Deactivated
            </span>
          )}
        </span>
      </Space>
    ),
  },

  {
    title: "ACTION",
    dataIndex: "action",
    key: "action",
    render: (_, record) => (
      <Space>
        <Button type="secondary" className="viewButton" disabled={!record.firstname && !record.lastname ? true : false} onClick={() => handleView(record)}>
          <Icon icon="bi:eye" color="#505e64" height="20px" />
          <span>{capitalize("View")}</span>
        </Button>
      </Space>
    ),
  },
  // Table.EXPAND_COLUMN,
];

let level_2_columns = [
  {
    title: "ID",
    dataIndex: "id",
    key: "id",
  },
  {
    title: "FULL NAME",
    dataIndex: "firstname",
    key: "firstname",
    render: (_, record) => (
      <Space className="statusSpace">
        {record?.firstname || record?.lastname ?
          <>
            <span>{record?.firstname ? capitalize(record?.firstname) : ""}</span>
            <span>{record?.lastname ? capitalize(record?.lastname) : ""}</span>
          </>
          : "-"
        }
      </Space>
    ),
  },
  {
    title: "PHONE NUMBER",
    dataIndex: "username",
    key: "username",
    render: (_, record) => (
      <Space className="email-1">
        <span>
          {capitalize(record?.username?.length > 0 ? record?.username : "-")}
        </span>
      </Space>
    ),
  },
  {
    title: "EMAIL",
    dataIndex: "email",
    key: "email",
    render: (_, record) => (
      <Space className="email-0">
        <span>{record?.email ?? "-"}</span>
      </Space>
    ),
  },
  {
    title: "JOB TITLE",
    dataIndex: "job_title",
    key: "job_title",
    render: (_, record) => (
      <Space className="email-1">
        <span>{record?.job_title ? capitalize(record?.job_title) : "-"}</span>
      </Space>
    ),
  },
  {
    title: "STATUS ",
    dataIndex: "status",
    key: "status",
    render: (_, record) => (
      <Space className="status">
        <span>
          {record.isActive ? (
            <span
              className="flex items-center justify-center gap-1 px-2 rounded-md font-medium text-[#0DA35B] bg-[#E8FAF0] w-fit h-[18px]"
            >
              {" "}
              <Icon icon="carbon:dot-mark" color="#0da35b" />
              Active
            </span>
          ) : (
            <span
              className="flex items-center justify-center gap-1 px-2 rounded-md font-medium text-[#F5222D] bg-[#FFF1F0] w-fit h-[18px]"
            >
              {" "}
              <Icon icon="carbon:dot-mark" color="#F5222D" />
              Deactivated
            </span>
          )}
        </span>
      </Space>
    ),
  },

  {
    title: "ACTION",
    dataIndex: "action",
    key: "action",
    render: (_, record) => (
      <Space>
        <Button type="secondary" className="viewButton" disabled={!record.firstname && !record.lastname ? true : false} onClick={() => handleView(record)}>
          <Icon icon="bi:eye" color="#505e64" height="20px" />
          <span>{capitalize("View")}</span>
        </Button>
      </Space>
    ),
  },
  // Table.EXPAND_COLUMN,
];

function getCorrectColumn(userProfile, is_staffing) {
  let is_staffing_level_1_columns = is_staffing ? level_1_columns : level_1_columns.filter(item => item.dataIndex !== 'client');
  let is_staffing_level_2_columns = is_staffing ? level_2_columns : level_2_columns.filter(item => item.dataIndex !== 'client');

  return userProfile.user_level.name === 'level_1' ? is_staffing_level_1_columns : is_staffing_level_2_columns;
}

const SettingsTableColumns = (userProfile, is_staffing) => getCorrectColumn(userProfile, is_staffing);
export default SettingsTableColumns;

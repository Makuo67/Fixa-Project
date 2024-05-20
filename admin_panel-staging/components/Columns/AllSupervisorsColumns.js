import { Space, Tooltip } from "antd";
import { capitalize } from "../../helpers/capitalize";
import { ProjectsMore } from "../Projects/ProjectSupervisors/ProjectsMore";
import { capitalizeAll } from "@/utils/capitalizeAll";

export const AllSupervisorsColumns = [
  {
    title: "Name",
    dataIndex: "first_name",
    key: "first_name",
    render: (_, record) => (
      <Space className="username">
        <span>{record.first_name ? capitalize(record.first_name) : "-"}</span>
        <span>{record.last_name ? capitalize(record.last_name) : "-"}</span>
      </Space>
    ),
  },
  {
    title: "Admin",
    dataIndex: "role_name",
    key: "role_name",
    render: (_, record) => (
      <Space className="phone">
        <span>{record.role_name ? capitalize(record.role_name) : "-"}</span>
      </Space>
    ),
  },
  {
    title: "Phone Number",
    dataIndex: "phone_number",
    key: "phone_number",
    render: (_, record) => (
      <Space className="phone">
        <span>{record.phone_number}</span>
      </Space>
    ),
  },
  {
    title: "Email",
    dataIndex: "email",
    key: "email",
    render: (_, record) => (
      <Space className="email">
        <span>{record.email}</span>
      </Space>
    ),
  },
  {
    title: "Project",
    dataIndex: "projects",
    key: "projects",

    render: (_, { projects }) => ProjectsMore(projects),
  },
];

export const AllSuppliersColumns = [
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
    render: (_, record) => (
      <Space className="username">
        <span>{record.name ? capitalizeAll(record.name) : "-"}</span>
      </Space>
    ),
  },
  {
    title: "Phone Number",
    dataIndex: "phone",
    key: "phone",
    render: (_, record) => (
      <Space className="phone">
        <span>{record.phone}</span>
      </Space>
    ),
  },
  {
    title: "Email",
    dataIndex: "email",
    key: "email",
    render: (_, record) => (
      <Space className="email">
        <span>{record.email}</span>
      </Space>
    ),
  },
];

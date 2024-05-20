import { Space } from "antd";
import { Icon } from "@iconify/react";
import { capitalize } from "../../helpers/excelRegister";
import { ProjectsMore } from "../Projects/ProjectSupervisors/ProjectsMore";
import { DeleteSupervisor } from "../Projects/ProjectSupervisors/DeleteSupervisor";

export const ProjectSupervisorsTableColumns = (deleteSupervisorAccess) => {
  let columns =  [
      {
        title: "ID",
        dataIndex: "id",
        key: "id",
      },
      {
        title: "Username",
        dataIndex: "first_name",
        key: "first_name",
        render: (_, record) => (
          <Space
            className="username"
            style={{
              // background: "red",
              width: "100%",
              display: "flex",
              gap: "5px",
            }}
          >
            <span>{record.first_name ? capitalize(record.first_name) : "-"}</span>
            <span>{record.first_name ? capitalize(record.last_name) : "-"}</span>
          </Space>
        ),
      },
      {
        title: "Position",
        dataIndex: "role_name",
        key: "role_name",
        render: (_, record) => (
          <Space className="position">
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
      ...(deleteSupervisorAccess ? [{
        title: "ACTION",
        dataIndex: "action",
        key: "action",
        render: (_, record) => <DeleteSupervisor record={record} />,
      }]: [])
    ];
  return columns
}
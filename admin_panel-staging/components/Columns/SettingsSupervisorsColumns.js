import { Space } from "antd";
import { Icon } from "@iconify/react";
import { capitalize } from "../../helpers/excelRegister";
import { ProjectsMore } from "../Projects/ProjectSupervisors/ProjectsMore";
import { DeleteSupervisor } from "../Projects/ProjectSupervisors/DeleteSupervisor";
import { EditSupervisor } from "../Settings/SettingsSupervisors/EditSupervisor";
import { DeactivateSupervisor } from "../Settings/SettingsSupervisors/DeactivateSupervisor";
import { RemoveSupervisor } from "../Settings/SettingsSupervisors/RemoveSupervisor";
import { EditClient, EditSettingsUsers } from "../Settings/SettingsClients/EditClient";
import { accessSubEntityRetrieval } from "@/utils/accessLevels";

export const SettingsSupervisorsColumns = (userProfile) => [
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
              className="activeStatus"
            >
              {" "}
              <Icon icon="carbon:dot-mark" color="#0da35b" />
              Active
            </span>
          ) : (
            <span
              className="inactiveStatus"
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
      <Space style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",

      }}>
        {/* <RemoveSupervisor record={record} /> */}
        {userProfile && accessSubEntityRetrieval(userProfile?.user_access, 'settings', 'supervisors', 'edit a supervisor')
          && (<EditSupervisor record={record} />)
        }
        {userProfile && accessSubEntityRetrieval(userProfile?.user_access, 'settings', 'supervisors', 'deactivate a supervisor')
          && (<DeactivateSupervisor record={record} />)
        }

      </Space>
    ),
  },
];

export const SettingsClientsColumns = (setLoadingClients, userProfile) => [
  {
    title: "ID",
    dataIndex: "id",
    key: "id",
  },
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
    render: (_, record) => (
      <Space>
        <span>{record.name ? capitalize(record.name) : "-"}</span>
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
    title: "TIN NUMBER",
    dataIndex: "tin_number",
    key: "tin_number",
  },
  {
    title: "PROJECTS",
    dataIndex: "projects",
    key: "projects",
    render: (_, { projects }) => ProjectsMore(projects),
  },
  {
    title: "STATUS",
    dataIndex: "isActive",
    key: "isActive",
    render: (_, record) => (
      <Space className="status">
        <span>
          {record.isActive ? (
            <span
              className="activeStatus"
            >
              {" "}
              <Icon icon="carbon:dot-mark" color="#0da35b" />
              Active
            </span>
          ) : (
            <span
              className="inactiveStatus"
            >
              {" "}
              <Icon icon="carbon:dot-mark" color="#F5222D" />
              Deactivated
            </span>
          )}
        </span>
      </Space>
    ),
    // render: (_, record) => (
    //   <Space className="status">
    //     <span>
    //       {record.isActive === true ? (
    //         <span className="tableTextStatus text-[#0DA35B] bg-[#E8FAF0]">
    //           {" "}
    //           <Icon icon="carbon:dot-mark" color="#0da35b" />
    //           Active
    //         </span>
    //       ) : (
    //         <span
    //           className="tableTextStatus rounded-lg text-bder-red bg-[#FFF1F0]">
    //           {" "}
    //           <Icon icon="carbon:dot-mark" color="#F5222D" />
    //           Deactivated
    //         </span>
    //       )}
    //     </span>
    //   </Space>
    // ),
  },
  {
    title: "ACTION",
    dataIndex: "action",
    key: "action",
    render: (_, record) => (
      <div className="flex items-center justify-center gap-2">
        {/* <RemoveSupervisor record={record} isClient setLoadingClients={setLoadingClients} /> */}
        {userProfile && accessSubEntityRetrieval(userProfile?.user_access, 'settings', 'clients', 'edit client')
          && (
            <EditClient record={record} setLoadingClients={setLoadingClients} />
          )}
        {userProfile && accessSubEntityRetrieval(userProfile?.user_access, 'settings', 'clients', 'deactivate client')
          && (
            <DeactivateSupervisor record={record} isClient setLoadingClients={setLoadingClients} />
          )}
      </div>
    ),
  },
];

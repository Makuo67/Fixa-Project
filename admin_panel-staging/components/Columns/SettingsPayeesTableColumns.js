import { Badge, Space, Tag, Tooltip } from "antd";
import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";

import { capitalizeAll } from "../../helpers/capitalize";
import { DeletePayee } from "../Projects/ProjectPayees/DeletePayee";
import { DeactivateSupplier } from "../Settings/SettingsSuppliers/DeactivateSupplier";
import { Icon } from "@iconify/react";
import { EditClient, EditSettingsUsers } from "../Settings/SettingsClients/EditClient";
import { EditSuppliers } from "../Settings/SettingsSuppliers/EditSuppliers";
import { accessSubEntityRetrieval } from "@/utils/accessLevels";
import { ProjectsMore } from "../Projects/ProjectSupervisors/ProjectsMore";

export const SettingsPayeesTableColumns = (setLoading, userProfile) => [
    {
        title: "ID",
        dataIndex: "id",
        key: "id",
    },
    {
        title: "Names",
        dataIndex: "names",
        key: "names",
        render: (_, record) => (
            <Space>
                <span>{record.names ? capitalizeAll(record.names) : "-"}</span>
            </Space>
        ),
    },
    {
        title: "ACCOUNT NUMBER",
        dataIndex: "account_number",
        key: "account_number",
        render: (value, data, index) => {
            return (<Tooltip
                title={value === "" || !value ? "This payee have no account number" : data.payment_method_verification_desc}
            >
                {value}{" "}
                {value === "" || !value ? (
                    <Tag color={"orange"} key={index}>
                        <Badge
                            status={"warning"}
                            text={<span
                                style={{
                                    color: "orange", textTransform: "capitalize",
                                }}
                            >
                                {"No Phone number"}
                            </span>}
                        />
                    </Tag>
                ) : data.is_payment_method === "green" ? (
                    <CheckCircleTwoTone twoToneColor="#52c41a" />)
                    : data.is_payment_method === "blue" ? (
                        <CheckCircleTwoTone twoToneColor="#0063F8" />)
                        : (<CloseCircleTwoTone twoToneColor="#F5222D" />)
                }
            </Tooltip>);
        }
    },
    {
        title: "Project",
        dataIndex: "projects",
        key: "projects",
        render: (_, { projects }) => ProjectsMore(projects),
    },
    {
        title: "EMAIL",
        dataIndex: "email",
        key: "email",
        render: (_, record) => (
            <span>{record.email ? record.email : "-"}</span>
        ),
    },

    {
        title: "Status",
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
    },

    {
        title: "ACTION",
        dataIndex: "action",
        key: "action",
        render: (_, record) => (
            <div className="flex items-center justify-center gap-2">
                {userProfile && accessSubEntityRetrieval(userProfile?.user_access, 'settings', 'supplier', 'edit supplier')
                    && (
                        <EditSuppliers record={record} setLoadingSuppliers={setLoading} />
                    )}
                {userProfile && accessSubEntityRetrieval(userProfile?.user_access, 'settings', 'supplier', 'deactivate supplier')
                    && (
                        <DeactivateSupplier record={record} setLoadingSuppliers={setLoading} />
                    )}
            </div>
        )
    },
];

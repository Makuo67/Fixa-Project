import { Badge, Space, Tag, Tooltip } from "antd";
import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";
import { Icon } from "@iconify/react";
import { capitalizeAll } from "../../helpers/capitalize";
import { DeletePayee } from "../Projects/ProjectPayees/DeletePayee";

export const ProjectPayeesTableColumns = (deleteSupplierAccess) => {
  let columns = [
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
          <Space
            className="username"
            style={{
              // background: "red",
              width: "100%",
              display: "flex",
              gap: "5px",
            }}
          >
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
        title: "PAYMENT METHOD",
        dataIndex: "payment_method",
        key: "payment_method",
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
          <Space className="  !w-full">
            <span>{record.email ? record.email : "-"}</span>
          </Space>
        ),
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
      ...(deleteSupplierAccess ? [{
        title: "ACTION",
        dataIndex: "action",
        key: "action",
        render: (_, record) => <DeletePayee record={record} />,
      }] : [])
    ];
  return columns
}

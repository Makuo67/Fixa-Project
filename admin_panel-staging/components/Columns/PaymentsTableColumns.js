import { Button, Space, Table, Tooltip } from "antd";
import moment from "moment";
import { Icon } from "@iconify/react";

import { capitalize, toMoney } from "../../helpers/excelRegister";
import { capitalizeAll } from "../../helpers/capitalize";

const PaymentsTableColumns = [
  {
    title: "ID",
    dataIndex: "id",
    key: "id",
  },
  {
    title: "TITLE",
    dataIndex: "title",
    key: "title",
    render: (_, record) => (
      <Space className="statusSpace">
        <span>{capitalize(record.title)}</span>
        <span className="date">{capitalize(record.payment_type_name)}</span>
      </Space>
    ),
  },
  {
    title: "DATE CREATED",
    dataIndex: "added_on",
    key: "added_on",
    render: (added_on) => (
      <Space>
        <span>{moment(added_on).format("DD/MM/YYYY")}</span>
      </Space>
    ),
  },
  {
    title: "PROJECT",
    dataIndex: "project_name",
    key: "project_name",
    render: (project_name) => (
      <Space>
        <span>{capitalizeAll(project_name)}</span>
      </Space>
    )
  },
  {
    title: "PAYEES",
    dataIndex: "total_payees",
    key: "total_payees",
  },
  {
    title: "TOTAL AMOUNT (Rwf)",
    dataIndex: "total_amount",
    key: "total_amount",
    render: (total_amount) => (
      <Space>
        <span>{toMoney(total_amount)}</span>
      </Space>
    ),
  },
  {
    title: "STATUS",
    dataIndex: "status",
    key: "status",
    width: 300,
    render: (_, record) =>
      record.status == "open" ? (
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '10px'
        }}>
          <Space className="statusSpace">
            <Button className="open" type="secondary">
              <Icon icon="carbon:dot-mark" height="20px" className="iconStatus" />{" "}
              <span>{capitalize(record.status)}</span>
            </Button>
            <span className="date">{`Updated ${moment(record.updated_at).format(
              "DD/MM/YYYY "
            )}`}</span>
          </Space>
          {/* claims availability icon */}
          {record.has_claim && (
            <Space>
              <Tooltip title="This payment has claims">
                <Icon icon="tabler:circle-letter-c" color="#00a1de" width={25} height={25} />
              </Tooltip>
            </Space>

          )}
        </div>
      ) : record.status == "unpaid" ? (
        <Space className="statusSpace">
          <Button className="unpaid" type="secondary">
            <Icon
              icon="mdi:clock-time-four-outline"
              height="15px"
              className="iconStatus"
            />{" "}
            <span>{capitalize(record.status)}</span>
          </Button>
          <span className="date">{`Updated ${moment(record.updated_at).format(
            "DD/MM/YYYY "
          )}`}</span>
        </Space>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '10px'
        }}>

          <Space className="statusSpace">
            <Button className="closed" type="secondary">
              <Icon icon="carbon:dot-mark" height="20px" className="iconStatus" />{" "}
              <span>{capitalize(record.status)}</span>
            </Button>
            <span className="date">{`Updated ${moment(record.updated_at).format(
              "DD/MM/YYYY "
            )}`}</span>
          </Space>
          {/* claims availability icon */}
          {record.has_claim && (
            <Space>
              <Tooltip title="This payment has claims">
                <Icon icon="tabler:circle-letter-c" color="#00a1de" width={25} height={25} />
              </Tooltip>
            </Space>

          )}
        </div>
      ),
  },
  Table.EXPAND_COLUMN,
];
// CLaims Table Columns
export const ClaimsTableColumns = [
  {
    title: "ID",
    dataIndex: "id",
    key: "id",
    width: 60,
  },
  {
    title: "TITLE",
    dataIndex: "title",
    key: "title",
    width: 200,
    render: (_, record) => (
      <Space className="statusSpace">
        <span>{capitalize(record.title)}</span>
        <span className="date">{capitalize(record.payroll_type)}</span>
      </Space>
    ),
  },
  {
    title: "DATE CREATED",
    dataIndex: "added_on",
    key: "added_on",
    render: (added_on) => (
      <Space>
        <span>{moment(added_on).format("DD/MM/YYYY")}</span>
      </Space>
    ),
  },
  {
    title: "PROJECT",
    dataIndex: "project_name",
    key: "project_name",
    render: (project_name) => (
      <Space>
        <span>{capitalizeAll(project_name)}</span>
      </Space>
    )
  },
  {
    title: "PAYEES",
    dataIndex: "total_payees",
    key: "total_payees",
    width: 100,
  },
  {
    title: "TOTAL AMOUNT",
    dataIndex: "total_amount",
    key: "total_amount",
    render: (total_amount) => (
      <Space>
        <span>{`${toMoney(total_amount)} RWF`}</span>
      </Space>
    ),
  },
  {
    title: "Payment Status",
    dataIndex: "status",
    key: "status",
    render: (_, record) =>
      record.status == "open" ? (
        <Space className="statusSpace">
          <Button className="open" type="secondary">
            <Icon icon="carbon:dot-mark" height="20px" className="iconStatus" />{" "}
            <span>{capitalize(record.status)}</span>
          </Button>
          <span className="date">{`Updated ${moment(record.updated_at).format(
            "DD/MM/YYYY "
          )}`}</span>
        </Space>
      ) : record.status == "unpaid" ? (
        <Space className="statusSpace">
          <Button className="unpaid" type="secondary">
            <Icon
              icon="mdi:clock-time-four-outline"
              height="15px"
              className="iconStatus"
            />{" "}
            <span>{capitalize(record.status)}</span>
          </Button>
          <span className="date">{`Updated ${moment(record.updated_at).format(
            "DD/MM/YYYY "
          )}`}</span>
        </Space>
      ) : (
        <Space className="statusSpace">
          <Button className="closed" type="secondary">
            <Icon icon="carbon:dot-mark" height="20px" className="iconStatus" />{" "}
            <span>{capitalize(record.status)}</span>
          </Button>
          <span className="date">{`Updated ${moment(record.updated_at).format(
            "DD/MM/YYYY "
          )}`}</span>
        </Space>
      ),
  },
];
export default PaymentsTableColumns;

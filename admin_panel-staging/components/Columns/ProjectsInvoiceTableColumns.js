import { Space } from "antd";
import { capitalize, toMoney } from "../../helpers/excelRegister";
import { InvoiceStatuses } from "../Projects/ProjectInvoices/InvoiceStatuses";
import moment from "moment";
import { InvoiceIconSvg } from "../Icons/CustomIcons";
import { downloadFile } from "../../helpers/projects/invoices";
export const ProjectsInvoiceTableColumns = [
  {
    title: "ID",
    dataIndex: "id",
    key: "id",
  },
  {
    title: "INVOICE",
    dataIndex: "invoice_id",
    key: "invoice_id",
    render: (_, record) => (
      <Space className="invoice-number">
        <span>{capitalize(record?.invoice_id)}</span>
      </Space>
    ),
  },
  {
    title: "AMOUNT DUE (RWF)",
    dataIndex: "amount_due",
    key: "amount_due",
    render: (_, record) => (
      <Space className="amount">
        <span>{toMoney(record?.amount_due)}</span>
      </Space>
    ),
  },
  {
    title: "MONTH",
    dataIndex: "date",
    key: "date",
    render: (_, record) => (
      <Space className="month">
        <span>{capitalize(moment(record?.date).format("MMMM"))}</span>
      </Space>
    ),
  },
  {
    title: "STATUS",
    dataIndex: "status",
    key: "status",
    render: (_, record) => (
      <InvoiceStatuses
        status={record.status}
        invoiceId={record.id}
        invoiceName={record.invoice_id}
        data={record}
      />
    ),
  },
  {
    title: "EBM FILE",
    dataIndex: "ebm_url",
    key: "ebm_url",
    render: (_, record) => (
      <Space
        className="ebm"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        <InvoiceIconSvg
          style={{
            color: " #798c9a",
            marginRight: "10px",
          }}
        />
        <span className="ebm_text">
          <a
            rel="noreferrer noopener"
            onClick={() => downloadFile(record?.ebm_name)}
          >
            {capitalize(record?.ebm_name)}
          </a>
        </span>
      </Space>
    ),
  },
  {
    title: "CERTIFICATE",
    dataIndex: "certificate_url",
    key: "certificate_url",
    render: (_, record) => (
      <Space
        className="certificate"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        <InvoiceIconSvg
          style={{
            color: " #798c9a",
            marginRight: "10px",
          }}
        />
        <span className="certificate_text">
          <a
            rel="noreferrer noopener"
            onClick={() => downloadFile(record?.certificate_name)}
          >
            {capitalize(record?.certificate_name)}
          </a>
        </span>
      </Space>
    ),
  },
];

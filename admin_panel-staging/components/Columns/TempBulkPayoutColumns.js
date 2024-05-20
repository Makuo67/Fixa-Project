import {
  CheckCircleTwoTone, CloseCircleTwoTone
} from "@ant-design/icons"; import { toMoney } from "@/helpers/excelRegister";
import { Badge, Tag, Tooltip } from "antd";
import { deletePayeePayoutTemp } from "@/helpers/payments/payout/payout";
import { Icon } from "@iconify/react";

const onDeleteWorker = async (record) => {
  let results = []
  if (record) {
    await deletePayeePayoutTemp(record).then((res) => {
      results = res
    }).catch((err) => {
      console.log(err)
    })
  }
  return results
}

export const TempBulkPayoutColumns = [
  {
    title: "PAYEE NAME",
    dataIndex: "account_name",
    key: "account_name",
    render: (text) => text ? <div className="">{text}</div> : <div className="pl-8">-</div>,
  },
  {
    title: "ACCOUNT NAME",
    dataIndex: "momo_account_name",
    key: "momo_account_name",
    render: (text) => text ? <div className="">{text}</div> : <div className="pl-8">-</div>,
  },
  {
    title: "ACCOUNT NUMBER",
    dataIndex: "account_number",
    key: "account_number",
    render: (value, record) => {
      return (
        <Tooltip className="flex gap-1 items-center"
          title={value === "" || !value ? "This payee have no account number"
            : record.is_account_number_exist ? "This account number already exist" :
              record.is_account_verified === "blue"
                || record?.is_account_verified === "green"
                || record?.is_account_verified === "red"
                || record?.is_account_verified === "nothing"
                ? record?.account_verification_desc
                : ""
          }
        >
          {value ? value : <Tag color={"red"} >
            <Badge
              status={"error"}
              text={<span
                style={{
                  color: "red", textTransform: "capitalize",
                }}
              >
                {"No Phone number"}
              </span>}
            />
          </Tag>}
          {record.is_account_number_exist ? <Icon icon="bi:exclamation-circle" /> :
            record?.is_account_verified === "green" ? (
              <CheckCircleTwoTone twoToneColor="#52c41a" />)
              : record?.is_account_verified === "blue" ? (
                <CheckCircleTwoTone twoToneColor="#0063F8" />)
                : <CloseCircleTwoTone twoToneColor="#F5222D" />}
        </Tooltip>
      )
    }
  },
  {
    title: "PAYMENT METHOD",
    dataIndex: "payment_method",
    key: "payment_method",
    render: (text) => text ? <div className="">{text}</div> : <div className="pl-8">-</div>,
  },
  {
    title: "AMOUNT TO PAY",
    dataIndex: "amount",
    key: "amount",
    render: (text) => String('RWF ' + toMoney(text)),
  },
  {
    title: "ACTION",
    key: "action",
    onDeleteWorker: onDeleteWorker
  },
];
import { ExportPaymentColumns, ExportPayoutColumns, ExportPayrollColumns } from "@/components/Export/ExportPaymentsColumns";
import { transformColumns } from "@/utils/transformObject";
import { Icon } from "@iconify/react";
import { Button, Checkbox, Modal } from "antd"
import { useState } from "react";
import { CSVLink } from "react-csv";
import _ from "underscore"

const CustomExportModal = (props) => {
  const [columns, setColumns] = useState([])
  const onChange = (checkedValues) => {
    setColumns(props.headers.filter(h => _.includes(checkedValues, h.key)))
  }
  const options = props.type === "payroll" ?
    [
      {
        label: 'Names',
        value: 'worker_name',
      },
      {
        label: 'Account Number',
        value: 'account_number',
      },
      {
        label: 'Total shifts',
        value: 'total_shifts',
      },
      { label: "Daily rate", value: "daily_rate" },
      {
        label: 'Deductions',
        value: 'total_deductions',
      },
      {
        label: 'Earnings',
        value: 'take_home',
      },
      {
        label: 'Status',
        value: 'status',
      },
      {
        label: 'Verified Phone',
        value: 'is_momo_verified_and_rssb',
      }, {
        label: 'Name From Momo',
        value: 'worker_name_momo'
      },
      { label: "Service", value: "service_name" },
    ]
    : props.type === "payment" ? transformColumns(ExportPaymentColumns)
      : props.type === "payout" ? transformColumns(ExportPayoutColumns) : []

  const closeResetModal = () => {
    setColumns([])
    props.handleCancel()
  }
  return (
    <Modal
      title={props.title}
      open={props.showModal}
      onCancel={closeResetModal}
      // closable={false}
      closeIcon={<div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "40px",
        width: "40px",
        borderRadius: "50px",
        background: "var(--neutral-3, #E4EEF3)",
        boxShadow: "0px 2px 0px 0px rgba(0, 0, 0, 0.04)",
        margin: "5px",
        zIndex: 10,
      }}>
        <Icon icon="icon-park:close" />
      </div>}
      width={600}
      centered={true}
      bodyStyle={{
        height: "fit-content"
      }}
      footer={null}
    >
      {/* <h3>Please confirm columns to export</h3> */}
      <div style={{
        display: "flex",
        flexDirection: "column",
      }}>
        <Checkbox.Group
          options={options}
          value={columns.map(c => c.key)}
          onChange={onChange}
          style={{
            display: "flex", flexDirection: "column"
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: "20px", gap: "10px" }}>
        <Button style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "40px",
          borderRadius: "5px",
          border: "1px solid var(--tertiary)",
          background: "#fff",
          boxShadow: "0px 2px 0px 0px rgba(0, 0, 0, 0.04)",
          color: "#000",
        }}
          onClick={closeResetModal}
        >
          Cancel
        </Button>
        <Button style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "40px",
          borderRadius: "5px",
          background: "var(--primary)",
          border: "none",
          boxShadow: "0px 2px 0px 0px rgba(0, 0, 0, 0.04)",
          color: "#fff",
        }}
          onClick={closeResetModal}
        >
          <CSVLink
            data={props.data}
            headers={columns}
            filename={props.filename}
          >
            Download
          </CSVLink>
        </Button>

      </div>
    </Modal >
  )
}

export default CustomExportModal
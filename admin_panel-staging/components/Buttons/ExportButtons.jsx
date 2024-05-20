import React, { useEffect, useState } from "react";
import { Button, Dropdown } from "antd";
import { DownOutlined, ExportOutlined } from "@ant-design/icons";
import { Icon } from "@iconify/react";

import { StyledPaymentButton } from "./NewPaymentButton.styled";
import { useRouter } from "next/router";
import { CSVLink } from "react-csv";
import {
  ExportPaymentColumns,
  ExportPayoutColumns,
  ExportPayrollColumns,
} from "../Export/ExportPaymentsColumns";
import CustomExportModal from "../Modals/PaymentsModals/CustomExportModal";

const ExportButtons = (props) => {
  const [showModal, setShowModal] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const items = [
    {
      label: "Export CSV",
      key: "1",
      icon: <Icon icon={`${props.isTax || props.isCasual ? `bi:filetype-xlsx` : "grommet-icons:document-csv"}`} height={18} />,
    },
  ];

  const handleExportModal = () => {
    setShowModal(true);
    setDropOpen(false);
  };

  const handleCancel = () => {
    setShowModal(false);
    // props.setLoading(true)
  };

  const handleDropdown = (open) => {
    setDropOpen(open);
  };

  return (
    <>
      <Dropdown
        className={props.disabled ? "exportBtn disabled" : "exportBtn"}
        trigger={"click"}
        disabled={props.disabled}
        open={dropOpen}
        onOpenChange={handleDropdown}
        dropdownRender={() => (
          <ul className="flex flex-col items-start p-0 gap-8 h-38 w-auto rounded-md bg-primary text-button-color">
            {items.map((item) => (
              <li className="flex flex-row items-center justify-center text-white bg-primary gap-2 cursor-pointer w-full h-9 p-2 rounded-md"
                id={"exportOption"}
                key={item.label}
              >
                <span>{item.icon}</span>
                {item.label == "Export CSV" && !props.isTax && !props.isCasual ? (
                  <span onClick={handleExportModal}>{item.label}</span>
                ) : (
                  <span onClick={handleExportModal}>Export xlsx</span>
                )}
              </li>
            ))}
          </ul>
        )}
      >
        <Button
          type="primary"
          className="exportBtn flex items-center text-xl"
          icon={<Icon icon="uil:file-export" className="text-xl" />}
        >
          {props.isTax ? "Export Worker Earnings" : props.isCasual ? "Export Unified Earnings" : "Export"}
          {!props.isTax && !props.isCasual && <DownOutlined className="text-xl"/>}
        </Button>
      </Dropdown>
      <CustomExportModal
        title={<h3>Please Confirm Columns to Export</h3>}
        showModal={showModal}
        handleCancel={handleCancel}
        data={props.payout ? props.payoutData : props.data}
        headers={props.isPayment ? ExportPaymentColumns : props.isPayroll ? ExportPayrollColumns : props.payout ? ExportPayoutColumns : []}
        filename={props.isPayment ? `Payments List.csv` : props.isPayroll ? `Payrolls List.csv` : props.payout ? `PayoutList_${props.payment_id}.csv` : `Payrolls List.csv`}
        type={props.isPayment ? "payment" : props.isPayroll ? "payroll" : props.payout ? "payout" : ""}
      />
    </>
  );
};

export default ExportButtons;

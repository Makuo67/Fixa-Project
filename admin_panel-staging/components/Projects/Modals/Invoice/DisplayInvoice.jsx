import React, { useContext, useEffect, useState } from "react";
import InvoiceHeader from "./Header";
import { StyledInvoice } from "./StyledInvoice.styled";
import { Button, Skeleton } from "antd";
import {
  downloadFile,
  singleInvoice,
} from "../../../../helpers/projects/invoices";
import { Icon } from "@iconify/react";
import { FileIconSvg } from "../../../Icons/CustomIcons";
import Image from "next/image";
import { useRouter } from "next/router";
import { toMoney } from "../../../../helpers/excelRegister";
import { InvoiceStatuses } from "../../ProjectInvoices/InvoiceStatuses";
import { capitalizeAll } from "../../../../helpers/capitalize";
import { PusherContext } from "../../../../context/PusherContext";

export default function DisplayInvoice(props) {
  const [invoiceData, setinvoiceData] = useState({});
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusEdited, setStatusEdited] = useState(false);
  const { envoiceLoading, setEnvoiceLoading } = useContext(PusherContext);
  const router = useRouter();

  const currentDate = new Date();
  const month = currentDate.toLocaleString("default", { month: "long" });
  const day = currentDate.getDate();
  const [date, setDate] = useState(`${day} ${month}`);
  const giveMonth = (dateTime) => {
    const date = new Date(dateTime);
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();
    return `${month}  ${year}`;
  };

  const statusChanged = () => {
    setStatusEdited(true);
  };
  const editInvoice = () => {
    props.showEditForm();
  };
  useEffect(() => {
    if (router.query?.id && (props.showForm || router.query?.invoice_id)) {
      setLoading(true);
      singleInvoice(router.query?.id)
        .then((res) => {
          setinvoiceData(res?.data);
          setInvoice(router.query?.invoice_id);
          setDate(giveMonth(res?.data?.date));
          setLoading(false);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [router]);

  useEffect(() => {
    if (envoiceLoading) {
      setLoading(true);
      singleInvoice(router.query?.id)
        .then((res) => {
          setinvoiceData(res?.data);
          setLoading(false);
          setStatusEdited(false);
        })
        .finally(() => {
          setLoading(false);
          setStatusEdited(false);
        });
    }
  }, [envoiceLoading]);
  return (
    <div>
      <InvoiceHeader invoice={invoice} />
      <StyledInvoice>
        <div>
          {loading ? (
            <div className="invoiceCard">
              <Skeleton
                className="settingsHeader"
                paragraph={{ rows: 10 }}
                active
              />
            </div>
          ) : (
            <div className="form">
              <div className="invoiceCard">
                <h2 className="main-heading">{invoice}</h2>
                <div>
                  <p className="sub-heading">Invoice Info</p>
                  <div className="details">
                    <div className="invoice-info">
                      <div className="detail-item">
                        <p className="invoice-detail">Project</p>
                        <p
                          className="detail-data company-name"
                          onClick={() => router.back()}
                        >
                          {capitalizeAll(invoiceData?.project_name)}
                        </p>
                      </div>
                      <div className="detail-item">
                        <p className="invoice-detail">Amount Due</p>
                        <p className="detail-data">
                          {toMoney(invoiceData?.amount_due)} RWF
                        </p>
                      </div>
                      <div className="detail-item">
                        <p className="invoice-detail">Expected Amount</p>
                        <p className="detail-data">
                          {toMoney(invoiceData?.expected_amount)} RWF
                        </p>
                      </div>
                      <div className="detail-item">
                        <p className="invoice-detail">Invoice Month</p>
                        <p className="detail-data">{date}</p>
                      </div>
                      <div className="detail-item">
                        <p className="invoice-detail">Status</p>

                        <InvoiceStatuses
                          status={invoiceData?.status}
                          invoiceId={invoiceData.id}
                          invoiceName={invoiceData?.invoice_id}
                          view={true}
                          setEnvoiceLoading={setEnvoiceLoading}
                          data={invoiceData}
                        />
                      </div>
                      {/* === Paid AMount === */}
                      {invoiceData && invoiceData?.status === 'paid_partially' && (
                        <>
                          <div className="detail-item">
                            <p className="invoice-detail">Paid Amount</p>
                            <p className="detail-data">
                              {toMoney(invoiceData?.amount_paid)} RWF
                            </p>
                          </div>
                          {/* === Outstanding amount === */}
                          <div className="detail-item">
                            <p className="invoice-detail">Outstanding Amount</p>
                            <p className="detail-data">
                              {toMoney(invoiceData?.outstanding_amount)} RWF
                            </p>
                          </div>
                        </>
                      )}

                      <div className="detail-item">
                        <p className="invoice-detail">Notes</p>
                        <p className="detail-data">{invoiceData?.note}</p>
                      </div>
                    </div>
                    <div className="files">
                      <div>
                        <p className="sub-heading">Certifcate file</p>
                        <p
                          className="file-name"
                          onClick={() =>
                            downloadFile(invoiceData?.certificate_name)
                          }
                        >
                          <FileIconSvg
                            style={{
                              color: " #798c9a",
                              marginRight: "10px",
                            }}
                          />
                          <span
                            style={{
                              color: " #798c9a",
                              marginLeft: "10px",
                              color: "#00a1de",
                            }}
                          >
                            {invoiceData?.certificate_name}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="sub-heading">EBM file</p>
                        <p
                          className="file-name"
                          onClick={() => downloadFile(invoiceData?.ebm_name)}
                        >
                          <FileIconSvg
                            style={{
                              color: " #798c9a",
                              marginRight: "15px",
                            }}
                          />
                          <span
                            style={{
                              color: " #798c9a",
                              marginLeft: "10px",
                              color: "#00a1de",
                            }}
                          >
                            {" "}
                            {invoiceData?.ebm_name}
                          </span>
                        </p>
                      </div>
                    </div>

                    {invoiceData.status == "draft" ? (
                      <Button
                        className="editButton"
                        icon={<Icon icon="lucide:edit" color="white" />}
                        onClick={editInvoice}
                      >
                        Edit Invoice
                      </Button>
                    ) : (
                      <></>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </StyledInvoice>
    </div>
  );
}

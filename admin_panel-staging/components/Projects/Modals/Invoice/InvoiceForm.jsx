import { Button, DatePicker, Divider, Form, Input, notification } from "antd";
import React, { useContext, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { StyledInvoice, StyledTeaxtArea } from "./StyledInvoice.styled";
import StyledEditor from "../../../Settings/Modals/StyleEditor";
import Confirm from "./confirmation";
import { useRouter } from "next/router";
import {
  createInvoice,
  editInvoice,
  singleInvoice,
} from "../../../../helpers/projects/invoices";
import DynamicDragger from "../../../FileUpload/DynamicDragger";
import { PusherContext } from "../../../../context/PusherContext";
import { capitalizeAll } from "../../../../helpers/capitalize";

export default function InvoiceForm(props) {
  const router = useRouter();
  const { id } = router.query;
  const { client } = useContext(PusherContext);
  const [form] = Form.useForm();
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [status, setStatus] = useState("draft");
  const [date, setDate] = useState(undefined);
  const { TextArea } = Input;
  const [loading, setLoading] = useState(false);
  const [invoiceData, setinvoiceData] = useState({});
  const [invoice, setInvoice] = useState(null);
  const [edit, setEdit] = useState(false);
  const [project_name, setproject_name] = useState(null);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [message, setmessage] =
    useState(`Are you sure you want to Discard the changes made to this invoice? This action can not
    be undone`);
  const [buttonText, setbuttonText] = useState(`Discard`);
  const [edited, setEdited] = useState(false);
  const [data, setData] = useState([]);

  const onFinish = (values) => {
    setLoading(true);
    values.year = values.moment.year();
    values.month = values.moment.month() + 1;
    values.status = status;
    values.note = values.note || "no note";
    values.project_id = parseInt(id);
    values.amount_due = values.amount_due;
    values.expected_amount = values.expected_amount;
    delete values.moment;
    setData(values);

    if (status === "draft") {
      setButtonLoading(true);
      createInvoice(values, status).then(() => {
        setLoading(false);
        setButtonLoading(false);
        router.back();
      });
    } else {
      if (
        values.certificate_name === undefined ||
        values.certificate_url === undefined ||
        values.ebm_name === undefined ||
        values.ebm_url === undefined
      ) {
        if (
          values.certificate_name === undefined &&
          values.certificate_url === undefined &&
          values.ebm_name !== undefined &&
          values.ebm_url !== undefined
        ) {
          notification.error({
            message: "Failed",
            description: "Missing Certificate File",
          });
        }
        if (
          values.certificate_name === undefined &&
          values.certificate_url === undefined &&
          values.ebm_name === undefined &&
          values.ebm_url === undefined
        ) {
          notification.error({
            message: "Failed",
            description: "Missing Invoice and Certificate Files",
          });
        }
        if (
          values.certificate_name !== undefined &&
          values.certificate_url !== undefined &&
          values.ebm_name === undefined &&
          values.ebm_url === undefined
        ) {
          notification.error({
            message: "Failed",
            description: "Missing Invoice File",
          });
        }
      } else {
        setEdited(true);
        setmessage(`Are you sure you want to send this invoice and email ${capitalizeAll(
          client?.names
        )}? This action can not
      be undone!`);
        setbuttonText(`Send`);
        setOpenConfirmModal(true);
      }
    }
  };

  useEffect(() => {
    setproject_name(router.query?.name);
  }, [router]);

  const showConfirm = () => {
    setOpenConfirmModal(true);
  };

  const closeConfirm = () => {
    setOpenConfirmModal(false);
  };

  const handleOk = () => {
    if (edited) {
      createInvoice(data, status).then(() => {
        setLoading(false);
        setButtonLoading(false);
        router.back();
      });
    } else {
      router.back();
    }
    closeConfirm();
  };

  return (
    <StyledInvoice>
      <p className="title">
        {capitalizeAll(project_name?.replace("[", "").replace("]", ""))}: New
        Invoice
      </p>
      <div className="form">
        <Form
          name="form_item_path"
          layout="vertical"
          form={form}
          onFinish={onFinish}
          requiredMark={false}
        >
          <StyledInvoice>
            <p className="sub-title">Invoice Details</p>
            <div className="invoice-inputs">
              <div className="input-container">
                <div>
                  <div className="inputs">
                    <div>
                      <Form.Item
                        label={
                          <span>
                            Invoice Amount Due (RWF){" "}
                            <span style={{ color: "red" }}>*</span>
                          </span>
                        }
                        name="amount_due"
                        className="input"
                        rules={[
                          {
                            required: true,
                            message: "Missing Amount",
                          },
                          {
                            pattern: /^\d+(\.\d+)?$/,
                            message: "Invalid Amount",
                          },
                        ]}
                      >
                        {edit ? (
                          <Input
                            placeholder="Enter Amount Due"
                            autoComplete="off"
                          />
                        ) : (
                          <Input
                            placeholder="Enter Amount Due"
                            autoComplete="off"
                          />
                        )}
                      </Form.Item>
                      <Form.Item
                        label={
                          <span>
                            Expected Amount (RWF){" "}
                            <span style={{ color: "red" }}>*</span>
                          </span>
                        }
                        name="expected_amount"
                        className="input"
                        rules={[
                          {
                            required: true,
                            message: "Missing AMount",
                          },
                          {
                            pattern: /^\d+(\.\d+)?$/,
                            message: "Invalid Amount",
                          },
                        ]}
                      >
                        <Input
                          placeholder="Enter Expected Amount"
                          autoComplete="off"
                        />
                      </Form.Item>
                    </div>
                    <div>
                      <Form.Item
                        label={
                          <span>
                            Invoice Month{" "}
                            <span style={{ color: "red" }}>*</span>
                          </span>
                        }
                        name="moment"
                        className="input"
                        rules={[
                          {
                            required: true,
                            message: "Missing Month",
                          },
                        ]}
                      >
                        <DatePicker
                          picker="month"
                          onChange={(e) => setDate(e)}
                        />
                      </Form.Item>
                    </div>
                  </div>
                  <div>
                    <Form.Item
                      label={<span>Invoice Note (RWF)</span>}
                      name="note"
                      className="input"
                    >
                      <TextArea
                        placeholder="Type something..."
                        style={{ height: 150 }}
                      />
                    </Form.Item>
                  </div>
                </div>
              </div>

              <div className="divider">
                <Divider type="vertical" />
              </div>
              <div className="upload">
                <Form.Item
                  label={
                    <span>
                      Certificate file <span style={{ color: "red" }}>*</span>
                    </span>
                  }
                >
                  <Form.Item name="certificate_name" noStyle>
                    <Form.Item name="certificate_url" noStyle />

                    <DynamicDragger
                      draggerProps={{ maxCount: 1, disabled: !date }}
                      setFields={(res) =>
                        form.setFieldsValue({
                          certificate_url: res.Location,
                          certificate_name: res.Key,
                        })
                      }
                      rename_to={`certificate#${id}-${date?.format("YYYY-MM")}`}
                      text="Click or drag single file in this area to upload"
                      hint="Upload Certificate (PDF/JPG)"
                      tooltip_warning="You must select month before uploading a file!"
                      isCertificate={true}
                      />
                  </Form.Item>
                </Form.Item>
                <Form.Item
                  label={
                    <span>
                      EBM file <span style={{ color: "red" }}>*</span>
                    </span>
                  }
                >
                  <Form.Item name="ebm_url" noStyle>
                    <Form.Item name="ebm_name" noStyle />
                    <DynamicDragger
                      draggerProps={{ maxCount: 1, disabled: !date }}
                      setFields={(res) =>
                        form.setFieldsValue({
                          ebm_url: res.Location,
                          ebm_name: res.Key,
                        })
                      }
                      rename_to={`ebm#${id}-${form
                        .getFieldValue("moment")
                        ?.format("YYYY-MM")}`}
                        text="Click or drag single file in this area to upload"
                        hint="Upload Certificate (PDF/JPG)"
                        tooltip_warning="You must select month before uploading a file!"
                        isCertificate={true}
                    />
                  </Form.Item>
                </Form.Item>
              </div>
            </div>
          </StyledInvoice>
        </Form>
      </div>
      <div className="buttons">
        {" "}
        <Button
          style={{
            background: "white",
            // width: "120px",
            height: "40px",
            borderRadius: "5px",
            fontSize: "16px",
            color: "red",
            fontWeight: "600",
            marginLeft: "20px",
          }}
          htmlType="reset"
          onClick={showConfirm}
        >
          Discard
        </Button>
        <Confirm
          openConfirmModal={openConfirmModal}
          closeConfirm={closeConfirm}
          message={message}
          buttonText={buttonText}
          cancelText={`No`}
          handleOk={handleOk}
        />
        <Button
          style={{
            background: "white",
            // width: "120px",
            height: "40px",
            borderRadius: "5px",
            fontSize: "16px",
            color: "#798C9A",
            fontWeight: "600",
            marginLeft: "20px",
          }}
          loading={buttonLoading && status == "draft"}
          onClick={() => {
            setStatus("draft");
            form.submit();
          }}
        >
          Save Draft
        </Button>
        <Button
          style={{
            background: "#00A1DE",
            border: "3px solid #00A1DE",
            boxShadow: " 0px 0px 5px rgba(0, 0, 0, 0.2)",
            // width: "120px",
            height: "40px",
            borderRadius: "5px",
            fontSize: "16px",
            color: "white",
            fontWeight: "600",
            marginLeft: "20px",
          }}
          loading={buttonLoading && status == "unpaid"}
          htmlType="submit"
          onClick={() => {
            setStatus("unpaid");
            form.submit();
          }}
        >
          Send
        </Button>
      </div>
    </StyledInvoice>
  );
}

import {
  Button,
  DatePicker,
  Divider,
  Form,
  Input,
  Skeleton,
  notification,
} from "antd";
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
  updateInvoice,
} from "../../../../helpers/projects/invoices";
import DynamicDragger from "../../../FileUpload/DynamicDragger";
import { capitalizeAll } from "../../../../helpers/capitalize";
import moment from "moment";
import { PusherContext } from "../../../../context/PusherContext";

export default function EditInvoice(props) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [status, setStatus] = useState("draft");
  const [date, setDate] = useState(undefined);
  const { TextArea } = Input;
  const [loading, setLoading] = useState(true);
  const [invoiceData, setinvoiceData] = useState({});
  const [invoice, setInvoice] = useState(null);
  const [edit, setEdit] = useState(false);
  const [project_name, setproject_name] = useState(null);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [action, setAction] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [message, setmessage] =
    useState(`Are you sure you want to Discard the changes made to this invoice? This action can not
    be undone`);
  const [buttonText, setbuttonText] = useState(`Discard`);
  const [edited, setEdited] = useState(false);
  const [data, setData] = useState([]);
  const [newchanges, setNewchanges] = useState(false);
  const [id, setId] = useState(undefined);
  const { client } = useContext(PusherContext);

  const setMDate = (dat) => {
    let dateString = dat;
    let formatString = "YYYY/MM/DD";
    let dateMon = moment(dateString, formatString);
    setDate(dateMon);
    setSelectedDate(dateMon);
  };

  const onFinish = (values) => {
    //  setLoading(true);
    setButtonLoading(true);

    if (values.moment !== undefined) {
      values.year = values.moment.year();
      values.month = values.moment.month() + 1;
      if (values.year && values.month) {
        const month = values.month;
        const year = values.year;
        const date = new Date();

        date.setFullYear(year, month - 1, 1);
        const formattedDate = date.toISOString().split("T")[0];
        values.date = formattedDate;
      }
      delete values.moment;
    }

    if (action === "send") {
      if (
        values.amount_due === undefined &&
        values.certificate_name === undefined &&
        values.certificate_url === undefined &&
        values.ebm_name === undefined &&
        values.ebm_url === undefined &&
        values.expected_amount === undefined &&
        values.moment === undefined &&
        values.note === undefined &&
        values.date === undefined
      ) {
        if (
          invoiceData.certificate_name === "" ||
          invoiceData.certificate_url === "" ||
          invoiceData.ebm_name === "" ||
          invoiceData.ebm_url === ""
        ) {
          if (
            invoiceData.certificate_name === "" &&
            invoiceData.certificate_url === "" &&
            invoiceData.ebm_name !== "" &&
            invoiceData.ebm_url !== ""
          ) {
            notification.error({
              message: "Failed",
              description: "Missing Certificate File",
            });
          }
          if (
            invoiceData.certificate_name === "" &&
            invoiceData.certificate_url === "" &&
            invoiceData.ebm_name === "" &&
            invoiceData.ebm_url === ""
          ) {
            notification.error({
              message: "Failed",
              description: "Missing Invoice and Certificate Files",
            });
          }
          if (
            invoiceData.certificate_name !== "" &&
            invoiceData.certificate_url !== "" &&
            invoiceData.ebm_name === "" &&
            invoiceData.ebm_url === ""
          ) {
            notification.error({
              message: "Failed",
              description: "Missing Invoice File",
            });
          }
        } else {
          setEdited(true);
          setmessage(`Are you sure you want to send this invoice and email ${client?.names}? This action can not
          be undone!`);
          setbuttonText(`Send`);
          setOpenConfirmModal(true);
        }
      } else {
        if (
          values.amount_due !== undefined ||
          values.certificate_name !== undefined ||
          values.certificate_url !== undefined ||
          values.ebm_name !== undefined ||
          values.ebm_url !== undefined ||
          values.expected_amount !== undefined ||
          values.moment !== undefined ||
          values.note !== undefined ||
          values.date !== undefined
        ) {
          if (
            (invoiceData.certificate_name === "" ||
              invoiceData.certificate_url === "" ||
              invoiceData.ebm_name === "" ||
              invoiceData.ebm_url === "") &&
            (values.certificate_name === undefined ||
              values.certificate_url === undefined ||
              values.ebm_name === undefined ||
              values.ebm_url === undefined)
          ) {
            notification.error({
              message: "Failed",
              description: "Missing File(s)",
            });
          } else {
            setNewchanges(true);
            setData(values);
            setEdited(true);
            setmessage(`Are you sure you want to send this invoice and email ${capitalizeAll(
              client?.names
            )}? This action can not
              be undone`);
            setbuttonText(`Send`);
            setOpenConfirmModal(true);
          }
        }
      }
    } else {
      if (
        values.amount_due !== undefined ||
        values.certificate_name !== undefined ||
        values.certificate_url !== undefined ||
        values.ebm_name !== undefined ||
        values.ebm_url !== undefined ||
        values.expected_amount !== undefined ||
        values.moment !== undefined ||
        values.note !== undefined ||
        values.date !== undefined
      ) {
        editInvoice(values, invoiceData.id).then(() => {
          setButtonLoading(false);
          props.hideEditForm();
        });
      } else {
        setButtonLoading(false);
        notification.error({
          message: "Failed",
          description: "You Need to Fill Invoice Details!",
        });
      }
    }
  };

  useEffect(() => {
    setproject_name(router.query?.name);
    if (router.query?.id) {
      singleInvoice(parseInt(router.query?.id))
        .then((res) => {
          setEdit(router.query?.edit);
          setinvoiceData(res?.data);
          setInvoice(router.query?.invoice_id);
          setMDate(res?.data?.date);
          setLoading(false);
          setId(router.query?.id);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [router]);

  const valuesChanged = (changed) => {
    message,
      setmessage(`Are you sure you want to Discard the changes made to this invoice? This action can not
    be undone!`);
    setbuttonText(`Discard`);
    setEdited(true);
  };

  const showConfirm = () => {
    if (edited) {
      setOpenConfirmModal(true);
    } else {
      notification.error({
        message: "Failed",
        description: "You Have No Changes To Discard!",
      });
    }
  };

  const closeConfirm = () => {
    setOpenConfirmModal(false);
  };

  const handleOk = () => {
    const status = {
      status: "unpaid",
    };
    if (edited && !newchanges) {
      updateInvoice(status, parseInt(invoiceData.id)).then(() => {
        setButtonLoading(false);
        const name = router.query.name.replace(/\[|\]/g, "");
        router.push({
          pathname: `/projects/${name}/`,
          query: { id: invoiceData.project_id, tab: "5" },
        });
      });
    } else {
      if (newchanges) {
        if (
          data.certificate_name === "" ||
          data.certificate_url === "" ||
          data.ebm_name === "" ||
          data.ebm_url === ""
        ) {
          notification.error({
            message: "Failed",
            description: "Invoice and certificate files are missing",
          });
        } else {
          const newData = { ...data, ...status };
          updateInvoice(status, parseInt(invoiceData.id)).then(() => {
            setButtonLoading(false);
            const name = router.query.name.replace(/\[|\]/g, "");
            router.push({
              pathname: `/projects/${name}/`,
              query: { id: invoiceData.project_id, tab: "5" },
            });
          });
        }
      } else {
        updateInvoice(status, parseInt(invoiceData.id)).then(() => {
          setButtonLoading(false);
          const name = router.query.name.replace(/\[|\]/g, "");
          router.push({
            pathname: `/projects/${name}/`,
            query: { id: invoiceData.project_id, tab: "5" },
          });
        });
      }
    }

    closeConfirm();
  };

  return (
    <StyledInvoice>
      <p className="title">
        {capitalizeAll(project_name?.replace("[", "").replace("]", ""))}
      </p>
      <>
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
            <Form
              name="form_item_path"
              layout="vertical"
              form={form}
              onFinish={onFinish}
              requiredMark={false}
              onValuesChange={valuesChanged}
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
                                pattern: /^\d+(\.\d+)?$/,
                                message: "Invalid Amount",
                              },
                            ]}
                          >
                            <Input
                              defaultValue={invoiceData?.amount_due}
                              type="text"
                              autoComplete="off"
                            />
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
                                pattern: /^\d+(\.\d+)?$/,
                                message: "Invalid Amount",
                              },
                            ]}
                          >
                            <Input
                              defaultValue={invoiceData?.expected_amount}
                              type="text"
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
                          >
                            <DatePicker
                              defaultValue={selectedDate}
                              format={"YYYY/MM"}
                              picker="month"
                              value={selectedDate}
                              onChange={setMDate}
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
                            defaultValue={invoiceData?.note}
                            type="text"
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
                          Certificate file{" "}
                          <span style={{ color: "red" }}>*</span>
                        </span>
                      }
                    >
                      <Form.Item name="certificate_name" noStyle>
                        <Form.Item name="certificate_url" noStyle />

                        <DynamicDragger
                          draggerProps={{
                            maxCount: 1,
                            disabled: false,
                            defaultFileList: [
                              {
                                uid: invoiceData.certificate_name,
                                name: invoiceData.certificate_name,
                                status: "done",
                                url: invoiceData.certificate_url,
                              },
                            ],
                          }}
                          setFields={(res) =>
                            form.setFieldsValue({
                              certificate_url: res.Location,
                              certificate_name: res.Key,
                            })
                          }
                          rename_to={`certificate#${id}-${date?.format(
                            "YYYY-MM"
                          )}`}
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
                          draggerProps={{
                            maxCount: 1,
                            disabled: false,
                            defaultFileList: [
                              {
                                uid: invoiceData.ebm_name,
                                name: invoiceData.ebm_name,
                                status: "done",
                                url: invoiceData.ebm_url,
                              },
                            ],
                          }}
                          setFields={(res) =>
                            form.setFieldsValue({
                              ebm_url: res.Location,
                              ebm_name: res.Key,
                            })
                          }
                          rename_to={`ebm#${id}-${date?.format("YYYY-MM")}`}
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
        )}
      </>

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
          loading={buttonLoading && action == "draft"}
          onClick={() => {
            setStatus("unpaid");
            form.submit();
            setAction("draft");
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
          htmlType="submit"
          onClick={() => {
            setStatus("unpaid");
            form.submit();
            setAction("send");
          }}
        >
          Send
        </Button>
      </div>
    </StyledInvoice>
  );
}

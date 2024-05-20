import { Button, Divider, Dropdown, Modal, Space, notification } from "antd";
import { Icon } from "@iconify/react";
import { useContext, useState } from "react";
import { StyledInvoiceStatuses } from "./StyledInvoiceStatuses";
import { updateInvoiceStatus } from "../../../helpers/projects/invoices";
import { PusherContext } from "../../../context/PusherContext";
import RegisterPaymentModal from "../Modals/Invoice/RegisterPaymentModal";

const { confirm } = Modal;

export const InvoiceStatuses = (props) => {
  const [drop, setDrop] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const { envoiceLoading, setEnvoiceLoading } = useContext(PusherContext);
  const handleOpen = (o) => {
    setDrop(o);
  };
  const handleUpdate = (status) => {
    setModalVisible(true);
    // confirm({
    //   title: `Are you sure you want to Change ${props.invoiceName} to ${status}?`,
    //   icon: false,
    //   // content: "Some descriptions",
    //   cancelText: "No",
    //   okText: "Yes",
    //   onOk() {
    //     setEnvoiceLoading(true);
    //     updateInvoiceStatus(props.invoiceId, status).then((res) => {
    //       notification.success({
    //         message: "Success",
    //         description: `Invoice ${props.invoiceName} Updated`,
    //       });
    //       setEnvoiceLoading(false);
    //     });
    //   },
    //   onCancel() {
    //     console.log("Cancel");
    //   },
    // });
  };
  const statuses = [
    {
      id: 0,
      name: "unpaid",
      label: "Unpaid",
    },
    {
      id: 2,
      name: "paid",
      label: "Paid",
    },
    // {
    //   id: 3,
    //   name: "draft",
    //   label: "Draft",
    // },
  ];
  return (
    <>
      {envoiceLoading ? (
        "Loading ..."
      ) : (
        <StyledInvoiceStatuses currentStatus={props.status}>
          {props.status !== "draft" && props.status !== "paid" ? (
            <Dropdown
              className="select-status-container"
              trigger={["click"]}
              open={drop}
              onOpenChange={handleOpen}
              dropdownRender={() => (
                <div
                  className="ul-dropdown"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-center",
                    justifyContent: "flex-center",
                    padding: "8px 12px",
                    gap: "10px",
                    height: "fit-content",
                    width: "132px",
                    borderRadius: "5px",
                    boxShadow: "0px 4px 26px rgba(30, 45, 84, 0.25)",
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  {statuses.map(
                    (item, index) =>
                      (item.name !== (props.status === 'paid_partially' ? 'unpaid' : props.status)) && (
                        <>
                          <Button
                            key={index}
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "1px 5px",
                              gap: "5px",
                              width: "104px",
                              height: "22px",
                              backgroundColor: `${item.name === "unpaid"
                                ? "#FFF7E6"
                                : item.name === "paid"
                                  ? "#F6FFED"
                                  : "#DCEBF1"
                                }`,
                              borderRadius: "10px",
                              border: "none",
                              fontStyle: "bold",
                              fontWeight: "500",
                              fontSize: "12px",
                              lineHeight: "15px",
                              color: `${item.name === "unpaid" || item.name === "paid_partially"
                                ? "#FAAD14"
                                : item.name === "paid"
                                  ? "#389E0D"
                                  : "#2C3336"
                                }`,
                            }}
                            onClick={() => handleUpdate(item.name)}
                          >
                            <span
                              style={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "center",
                                gap: "5px",
                              }}
                            >
                              {item.name === "unpaid" ? (
                                <Icon
                                  icon="icon-park-outline:loading-one"
                                  color="#fa8c16"
                                />
                              ) : item.name === "paid" ? (
                                <Icon
                                  icon="icon-park-outline:check-one"
                                  color="#389e0d"
                                />
                              ) : (
                                <Icon
                                  icon="mdi:clock-time-four-outline"
                                  color="#000"
                                />
                              )}
                              {item.label}
                            </span>
                          </Button>
                        </>
                      ),
                    <div
                      style={{
                        width: "100px",
                        border: "1px solid #CCDBE1",
                      }}
                    />
                  )}
                </div>
              )}
            >
              <Button className="select-status">
                <Space className="select-status-space">
                  <span>
                    {props.status === "unpaid" ? (
                      <Icon
                        icon="icon-park-outline:loading-one"
                        color="#fa8c16"
                      />
                    ) : props.status === "paid" ? (
                      <Icon
                        icon="icon-park-outline:check-one"
                        color="#389e0d"
                      />
                    ) : props.status === "paid_partially" ? (
                      // === PAID Partially ===
                      <Icon icon="pepicons-pop:dollar" color="#fa8c16" />
                    ) : (
                      <Icon icon="mdi:clock-time-four-outline" color="#000" />
                    )}
                    {
                      props.status === "unpaid" ? "Unpaid"
                        : props.status === "paid" ? "Paid"
                          : props.status === "paid_partially" ? "Paid Partially"
                            : "Draft"
                    }
                    {props.status === "unpaid" || props.status === "paid_partially" ? (
                      <Icon
                        icon="material-symbols:keyboard-arrow-down-rounded"
                        className="arrow"
                      />
                    ) : props.status === "draft" ? (
                      ""
                    ) : (
                      <>
                        {props.view ? (
                          <></>
                        ) : (
                          <Icon
                            icon="material-symbols:keyboard-arrow-down-rounded"
                            className="arrow"
                          />
                        )}
                      </>
                    )}
                  </span>
                </Space>
              </Button>
            </Dropdown>
          ) : (
            <Button className="select-status">
              <Space className="select-status-space">
                <span>
                  {
                    props.status === "unpaid" ? (
                      <Icon
                        icon="icon-park-outline:loading-one"
                        color="#fa8c16"
                      />
                    ) : props.status === "paid" ? (
                      <Icon
                        icon="icon-park-outline:check-one"
                        color="#389e0d"
                      />
                    ) : props.status === "paid_partially" ? (
                      // === PAID Partially ===
                      <Icon icon="pepicons-pop:dollar" color="#fa8c16" />
                    ) : (
                      <Icon icon="mdi:clock-time-four-outline" color="#000" />
                    )}
                  {props.status === "unpaid" ? "Unpaid"
                    : props.status === "paid" ? "Paid"
                      : props.status === "paid_partially" ? "Paid Partially"
                        : "Draft"}
                  {props.status === "unpaid" ? (
                    <Icon
                      icon="material-symbols:keyboard-arrow-down-rounded"
                      className="arrow"
                    />
                  ) : props.status === "paid" ? (
                    ""
                  ) : (
                    ""
                  )}
                </span>
              </Space>
            </Button>
          )}
          <RegisterPaymentModal
            title={'Register Payment'}
            width={600}
            height={400}
            footer={null}
            modalVisible={modalVisible}
            setModalVisible={setModalVisible}
            data={props.data}
          />
        </StyledInvoiceStatuses>
      )}
    </>
  );
};

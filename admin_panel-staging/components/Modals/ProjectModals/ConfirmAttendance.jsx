import { Button, Input, Modal, notification } from "antd";
import { Icon } from "@iconify/react";
import moment from "moment";
import { useState } from "react";
import { ApproveDeclineAttendance } from "../../../helpers/projects/projects";

const ConfirmAttendance = (props) => {
    const [comment, setComment] = useState("");

    const handleApproveDecline = async () => {
        let payload = {
            attendance_id: Number(props?.payload?.attendance_id),
            status: props?.payload?.status,
            approved_by: Number(props?.payload?.approved_by),
            approved_by_name: props?.payload?.approved_by_name,
            approved_time: props?.payload?.approved_time,
            type: props?.payload?.type,
            comment: comment,
        };
        try {
            await ApproveDeclineAttendance(
                props?.payload.attendance_status_id,
                payload
            ).then(() => {
                props.setLoading(true);
                props.setStatus("declined");
                props.setLoadPage(true);
                notification.success({
                    message: "Success",
                    description: `You have successfully ${props.type}d ${moment(
                        props.date
                    ).format("DD-MM-YYYY")} ${props.shift} shift attendance`,
                });
            });
        } catch (error) {
            notification.error({
                message: "Error",
                description: `Failed ${error}`,
            });
        }
    };

    const closeModal = () => {
        props.closeConfirm();
    };
    const sayReason = (e) => {
        setComment(e.target.value);
    };

    return (
        <>
            <Modal
                centered
                okText="Yes"
                cancelText="No"
                closable={false}
                open={props.openConfirmModal}
                onOk={props.handleOk}
                onCancel={props.closeConfirm}
                bodyStyle={{
                    height: props.type == "decline" ? 260 : 200,
                }}
                footer={null}
            >
                <div style={{ paddingTop: "12px" }}>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <Icon icon="ant-design:info-circle-outlined" style={{ fontSize: "20px", color: "#FA8C16", height: "24px" }} />
                        <p
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "flex-start",
                                fontWeight: "500",
                                fontSize: "18px",
                                // padding: "10px 2px",
                            }}
                        >
                            {`Are you sure you want to ${props.type} attendance of ${moment(
                                props.date
                            ).format("YYYY-MM-DD")}`}
                        </p>
                    </div>
                    {props.type == "decline" && (
                        <div>
                            <span>Comment</span>
                            <Input
                                placeholder="Add comment"
                                style={{
                                    borderRadius: "5px",
                                    height: "40px",
                                    border: " 1px solid var(--neutral-5, #CCDBE1)",
                                }}
                                onChange={(e) => sayReason(e)}
                                required
                            />
                        </div>
                    )}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: "20px",
                            padding: "10px 0px 0px 2px",
                        }}
                    >
                        <Button
                            style={{
                                background: "white",
                                border: "1px solid #798C9A",
                                width: "fit-content",
                                height: "40px",
                                borderRadius: "5px",
                                fontSize: "14px",
                                lineHeight: "22px",
                                color: "#2C3336",
                                fontWeight: "500",
                                filter: "drop-shadow(0px 2px 0px rgba(0, 0, 0, 0.043))",
                            }}
                            onClick={closeModal}
                        >
                            {props.cancelText}
                        </Button>
                        <Button
                            style={{
                                background: props.type === "approve" ? "var(--primary)" : "#F5222D",
                                border: "none",
                                boxShadow: " 0px 0px 5px rgba(0, 0, 0, 0.2)",
                                width: "fit-content",
                                height: "40px",
                                borderRadius: "5px",
                                fontSize: "14px",
                                lineHeight: "22px",
                                color: "white",
                                fontWeight: "500",
                                boxShadow: "0px 2px 0px rgba(0, 0, 0, 0.043)",
                            }}
                            loading={props.loading}
                            onClick={handleApproveDecline}
                        >
                            {props.buttonText}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};
export default ConfirmAttendance;

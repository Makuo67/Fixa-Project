import { Modal, Select, notification, Radio } from "antd";
import React, { useState } from "react";
import { assignRatesToWorkers } from "../../../helpers/workforce/workforce";


const AssignModal = (props) => {
    const [assignRatePayload, setAssignRatePayload] = useState({
        "workforce_data": props?.selected_workers,
        "rate_type": "negotiated",
    });

    const shouldBeVisible = props.isVisible;

    const handleCancel = () => {
        props.hideModal();
    };

    // Handle assign rates to workers
    const handleOk = async () => {
        assignRatesToWorkers(assignRatePayload).then((data) => {

            if (data.status == "success") {
                props.clearSelection();
            }
        }).catch((err) => {
            console.log("ERROR in assigning workers", err);
        });

        props.hideModal();
    };

    const onChangeRate = (e) => {
        setAssignRatePayload({
            ...assignRatePayload,
            rate_type: e.target.value,
        })
    };


    return (
        <Modal
            title={props.title}
            okText="Assign"
            open={shouldBeVisible}
            onOk={handleOk}
            okButtonProps={{
                style: {
                    height: "40px",
                    background: "var(--primary)",
                    borderRadius: "5px",
                    border: "none",
                    "&:hover": {
                        opacity: "0.75",
                        color: "var(--secondary)",
                    }
                }
            }}
            cancelButtonProps={{
                style: {
                    height: "40px",
                    borderRadius: "5px",
                    // color: "var(--button-color)",
                    color: "var(--primary)",
                    border: "1px solid var(--primary)",
                    "&:hover": {
                        color: "var(--primary)",
                    }
                },
            }}
            onCancel={handleCancel}
        >
            <div style={{ display: "flex", flexDirection: "column" }}>
                <p className="text-gray">
                    Select Rate Type
                </p>
                <div style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    borderRadius: "5px",
                    border: "1px solid #e8e8e8",
                    width: "100%",
                    height: "80px",
                    marginBottom: "10px",
                }}>
                    <Radio.Group onChange={onChangeRate} value={assignRatePayload.rate_type} style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "70%",
                        height: "100%",
                        padding: "0px 20px",
                    }}>
                        <Radio value={"negotiated"}>Negotiated</Radio>
                        <Radio value={"standard"}>Standard</Radio>
                    </Radio.Group>
                </div>
            </div>
        </Modal>
    );
};
export default AssignModal;

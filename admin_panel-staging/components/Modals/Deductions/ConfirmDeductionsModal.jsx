import { Modal } from "antd";
import { Icon } from "@iconify/react";

const ConfirmDeductions = (props) => {
    const closeModal = () => {
        props.closeConfirmNumberModal();
    };

    return (
        <>
            <Modal
                title={props.title}
                centered
                okText="Yes"
                cancelText="No"
                // closeIcon={<Icon icon="fe:close" className="close" />}
                open={props.open}
                onOk={props.confirmNumber}
                onCancel={closeModal}
                bodyStyle={{
                    height: "fit-content",
                }}
                footer={null}
            >
                {props.content}
            </Modal>
        </>
    );
};
export default ConfirmDeductions;

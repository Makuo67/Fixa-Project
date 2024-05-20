import { Button, Modal } from "antd";
import { useRouter } from "next/router";
import { Icon } from "@iconify/react";

const OtpDeductions = (props) => {
    const router = useRouter();

    const closeModal = () => {
        props.closeOtpDeductionsModal();
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
                    height: 'fit-content',
                }}
                width={700}
                footer={null}
            >
                <div>
                    {props.content}
                </div>
            </Modal>
        </>
    );
};
export default OtpDeductions;

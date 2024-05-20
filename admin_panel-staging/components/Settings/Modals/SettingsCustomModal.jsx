import { Modal } from "antd";

export const SettingsCustomModal = ({ width, open, onCancel, title, content }) => {

    return (
        <Modal
            centered
            title={<h1 className="modalTitle">{title}</h1>}
            open={open}
            onCancel={onCancel}
            styles={{
                body: {
                    height: "fit-content",
                }
            }}
            width={width ? width : 500}
            footer={null}
        >
            <div>
                {content}
            </div>
        </Modal>
    );
};

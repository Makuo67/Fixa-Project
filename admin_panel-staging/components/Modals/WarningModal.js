import { Modal, Space } from "antd";
import React, { useState } from "react";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

const WarningModal = (props) => {
  const workers = useSelector((state) => state.workforce.list);
  const [project_id, set_project_id] = useState(null);
  const dispatch = useDispatch();

  const openNotificationSuccess = () => {
    notification.success({
      message: "Success",
      description: `Deactivated ${props.selected_workers.length} worker${
        props.selected_workers.length > 1 ? "s" : ""
      }!`,
    });
  };

  const openNotificationError = () => {
    notification.error({
      message: "Error",
      description: `Could deactivated ${props.selected_workers.length} worker${
        props.selected_workers.length > 1 ? "s" : ""
      }!`,
    });
  };

  const handleCancel = () => {
    props.hideModal();
  };

  const handleOk = () => {
    // dispatch(unassignToProject(props.selected_workers, project_id)).then((data) => {
    //   if (data.status == "success") openNotificationSuccess();
    //   else openNotificationError();
    // });
    props.hideModal();
  };

  const shouldBeVisible = props.isVisible;

  return (
    <Modal
      closable={false}
      title=""
      okText="Yes"
      cancelText="No"
      visible={shouldBeVisible}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <Space align="top">
        <ExclamationCircleOutlined style={{ color: "orange", fontSize: 28, marginRight: 8 }} />
        <div>
          <h3>
            Are you sure to deactivate {props.selected_workers.length} worker{props.selected_workers.length > 1 && "s"}?
          </h3>
          <p className="text-gray">You can reactivate them later</p>
        </div>
      </Space>
    </Modal>
  );
};
export default WarningModal;

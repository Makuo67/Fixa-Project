import { Button, Modal, notification } from "antd";
import React, { useState } from "react";
import { updateProfile } from "../../../helpers/user-profile/user-profile";

export default function Confirm(props) {
  const [loading, setLoading] = useState(false);

  const close = () => {
    props.setShowConfirm(false);
  };

  const deactivateUser = () => {
    setLoading(true);
    props.setProfile_update(false);
    let body = props?.userInfo;
    body.settings = false;
    body.isActive = props?.userInfo?.isActive ? false : true;
    body.job_title = props?.userInfo?.title_id;

    updateProfile(body, props.userInfo?.id).then((res) => {
      setLoading(false);
      close();
      props.setProfile_update(true);
    });
  };
  return (
    <div>
      <Modal
        centered
        okText="Yes"
        cancelText="No"
        open={props.showConfirm}
        onOk={close}
        onCancel={close}
        styles={{
          body: {
            height: 100
          }
        }}
        footer={null}
      >
        <p className="text-base font-medium text-center">
          {props.userInfo?.isActive
            ? `Are you sure you want to deactivate ${props.userInfo?.firstname}  ${props.userInfo?.lastname}?`
            : `Are you sure you want to activate ${props.userInfo?.firstname}  ${props.userInfo?.lastname}?`}
        </p>
        <div className="flex items-center justify-center gap-4 py-8">
          <Button
            type="secondary"
            className="secondaryBtn"
            onClick={close}
          >
            No
          </Button>
          <Button
            type="primary"
            className="primaryBtn"
            loading={loading}
            onClick={deactivateUser}
          >
            Yes
          </Button>
        </div>
      </Modal>
    </div>
  );
}

import { Icon } from "@iconify/react";
import { Space, notification, Modal, Button } from "antd";
import { removeSupervisor } from "../../../helpers/projects/supervisors";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { PusherContext } from "../../../context/PusherContext";
import Confirm from "../Modals/Invoice/confirmation";

const { confirm } = Modal;

export const DeleteSupervisor = (props) => {
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { id } = router.query;

  const { setLoadSupervisor } = useContext(PusherContext);

  const deletePayload = {
    user_id: props.record.id,
    project_id: parseInt(id.toString()),
  };
  const handleDeleteSupervisor = () => {
    setLoading(true);
    removeSupervisor(deletePayload)
      .then((res) => {
        notification.success({
          message: "Success",
          description: "Supervisor Deleted",
        });
        setLoadSupervisor(true);
        setLoading(false);
      })
      .catch((error) => {
        notification.error({
          message: "Failed",
          description: `${error.message}`,
        });
      });
  };
  const showConfirm = () => {
    setOpenConfirmModal(true);
  };

  const closeConfirm = () => {
    setOpenConfirmModal(false);
  };

  return (
    <Space className="action">
      <Icon
        icon="material-symbols:delete-outline-rounded"
        color="#f5222d"
        height="25px"
        className="icon"
        // onClick={() => handleDeleteSupervisor()}
        onClick={showConfirm}
      />
      <Confirm
        openConfirmModal={openConfirmModal}
        closeConfirm={closeConfirm}
        message={`Are you sure you want to remove this supervisor from this project?`}
        buttonText={`Yes`}
        cancelText={`No`}
        handleOk={handleDeleteSupervisor}
        loading={loading}
      />
    </Space>
  );
};

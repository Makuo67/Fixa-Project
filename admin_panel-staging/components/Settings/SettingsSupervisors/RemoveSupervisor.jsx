import { Icon } from "@iconify/react";
import { Space, notification, Modal, Button } from "antd";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { PusherContext } from "../../../context/PusherContext";
import Confirm from "../../Projects/Modals/Invoice/confirmation";
import { deleteSettingsSupervisor } from "../../../helpers/settings/settings";
import { deleteClient } from "@/helpers/projects/projects";


export const RemoveSupervisor = (props) => {
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { setLoadSupervisor } = useContext(PusherContext);

  const deletePayload = {
    user_id: props.record.id,
  };
  const handleDeleteSupervisor = () => {
    setLoading(true);
    setLoadSupervisor(true);
    deleteSettingsSupervisor(deletePayload)
      .then((res) => {
        notification.success({
          message: "Success",
          description: "Supervisor Deleted",
        });
        setLoading(false);
        setLoadSupervisor(false);
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

  // deleting a client
  const handleDeleteClient = () => {
    setLoading(true);
    deleteClient(props.record.id).finally(() => {
      setLoading(false);
      if (props?.setLoadingClients) {
        props?.setLoadingClients(true);
      }
    })
  }

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
        message={props?.isClient ? `Are you sure you want to permanently remove this client ?` : `Are you sure you want to permanently remove this supervisor?`}
        buttonText={`Yes`}
        cancelText={`No`}
        handleOk={props?.isClient ? handleDeleteClient : handleDeleteSupervisor}
        loading={loading}
      />
    </Space>
  );
};

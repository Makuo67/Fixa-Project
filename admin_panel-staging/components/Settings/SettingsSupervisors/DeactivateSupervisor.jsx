import { Icon } from "@iconify/react";
import { Space, notification, Modal, Button } from "antd";
import { activateDeactivateSupplier, removeSupervisor } from "../../../helpers/projects/supervisors";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { PusherContext } from "../../../context/PusherContext";
import Confirm from "../../Projects/Modals/Invoice/confirmation";
import { updateSettingsSupervisor } from "../../../helpers/settings/settings";
import { clientStatus } from "@/helpers/projects/projects";
import { capitalizeAll } from "@/utils/capitalizeAll";

const { confirm } = Modal;

export const DeactivateSupervisor = (props) => {
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { setLoadSupervisor } = useContext(PusherContext);

  const handleDeleteSupervisor = () => {
    let updatePayload = {};
    if (props?.page && props?.page === "settings") {
      updatePayload = {
        status: props?.record?.isActive ? false : true,
      };
      setLoading(true);
      activateDeactivateSupplier(props?.record?.id, updatePayload)
        .then(() => {
          setLoading(false);
          setLoadSupervisor(true);
          closeConfirm()
          props.setLoadingSuppliers()
        })
    } else {
      updatePayload = {
        user_id: props.record.id,
        blocked: props.record.status,
      };
      setLoading(true);
      updateSettingsSupervisor(updatePayload)
        .then((res) => {
          setLoading(false);
          setLoadSupervisor(true);
        })
    }
  };
  const showConfirm = () => {
    setOpenConfirmModal(true);
  };

  const closeConfirm = () => {
    setOpenConfirmModal(false);
  };

  const handleClientStatus = () => {
    setLoading(true);
    const status = props.record.isActive ? false : true;
    clientStatus(props.record.id, status).finally(() => {
      setLoading(false);
      if (props?.setLoadingClients) {
        props?.setLoadingClients(true);
      }
    })
  }

  return (
    <Space className="action">
      <Icon
        icon={`${props.record.status || props.record.isActive ? "fluent-mdl2:blocked" : "fe:check"}`}
        color={"#f5222d"}
        height="22px"
        className="icon cursor-pointer"
        // onClick={() => handleDeleteSupervisor()}
        onClick={showConfirm}
      />
      <Confirm
        openConfirmModal={openConfirmModal}
        closeConfirm={closeConfirm}
        message={`Are you sure you want to ${props.record.status === true || props.record.isActive === false ? "Activate" : "Deactivate"} ${props?.record?.name ? props?.record?.name : props.record.first_name + " " + props.record.last_name}?`}
        buttonText={props.record.status === false || props.record.isActive === false ? "Activate" : "Deactivate"}
        cancelText={`No, Cancel`}
        handleOk={props?.isClient ? handleClientStatus : handleDeleteSupervisor}
        loading={loading}
      />
    </Space>
  );
};

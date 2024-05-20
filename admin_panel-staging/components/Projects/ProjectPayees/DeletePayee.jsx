import { Icon } from "@iconify/react";
import { Space, notification, Modal, Button } from "antd";
import { removePayee, removeSupervisor, removeSupplier } from "../../../helpers/projects/supervisors";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { PusherContext } from "../../../context/PusherContext";
import Confirm from "../Modals/Invoice/confirmation";


export const DeletePayee = (props) => {
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { id } = router.query;

  const { setLoadPayee } = useContext(PusherContext);

  //   const deletePayload = {
  //     user_id: props.record.id,
  //     project_id: parseInt(id.toString()),
  //   };
  const handleDeletePayee = () => {
    let removeBody = {}
    if (props?.page && props?.page === "settings") {
      setLoading(true);
      removeSupplier(props?.record?.id)
        .then((res) => {
          setLoadPayee(true);
        }).finally(() => {
          setLoading(false);
          closeConfirm()
        })
    } else {
      removeBody = {
        "project_id": id,
        "supplier_id": props.record.id
      }
      setLoading(true);
      removePayee(id, removeBody)
        .then((res) => {
          setLoadPayee(true);
        }).finally(() => {
          setLoading(false);
        })
    }
  };

  const showConfirm = () => {
    setOpenConfirmModal(true);
  };

  const closeConfirm = () => {
    setOpenConfirmModal(false);
  };

  return (
    <Space className="w-full flex justify-end cursor-pointer">
      <Icon
        icon="material-symbols:delete-outline-rounded"
        color="#f5222d"
        height="25px"
        className="icon"
        onClick={showConfirm}
      />
      <Confirm
        openConfirmModal={openConfirmModal}
        closeConfirm={closeConfirm}
        message={`Are you sure you want to remove this payee from this project?`}
        buttonText={`Yes`}
        cancelText={`No`}
        handleOk={handleDeletePayee}
        loading={loading}
      />
    </Space>
  );
};

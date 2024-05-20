import { Icon } from "@iconify/react";
import { Space, Modal } from "antd";
import { useRouter } from "next/router";
import Confirm from "../../Projects/Modals/Invoice/confirmation";
import { activateDeactivateSupplier } from "@/helpers/projects/supervisors";
import { useContext, useState } from "react";

const { confirm } = Modal;

export const DeactivateSupplier = (props) => {
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const showConfirm = () => {
    setOpenConfirmModal(true);
  };

  const closeConfirm = () => {
    setOpenConfirmModal(false);
  };

  const handleSupplierStatus = () => {
    setLoading(true);
    const status = props.record.isActive ? false : true;
    activateDeactivateSupplier(props.record.id, { status: status }).finally(() => {
      setLoading(false);
      if (props?.setLoadingSuppliers) {
        props?.setLoadingSuppliers(true);
      }
    })
  }

  return (
    <Space className="action">
      <Icon
        icon={`${props.record.isActive ? "fluent-mdl2:blocked" : "fe:check"}`}
        color={"#f5222d"}
        height="22px"
        className="icon cursor-pointer"
        onClick={showConfirm}
      />
      <Confirm
        openConfirmModal={openConfirmModal}
        closeConfirm={closeConfirm}
        message={`Are you sure you want to ${!props.record.isActive ? "Activate" : "Deactivate"
          } ${props?.record?.names}?`}
        buttonText={!props.record.isActive ? "Activate" : "Deactivate"}
        cancelText={`No, Cancel`}
        handleOk={handleSupplierStatus}
        loading={loading}
      />
    </Space>
  );
};

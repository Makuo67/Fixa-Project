import { Icon } from "@iconify/react";
import { Space, notification, Modal, Button } from "antd";
import { removeSupervisor } from "../../../helpers/projects/supervisors";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { PusherContext } from "../../../context/PusherContext";
import Confirm from "../../Projects/Modals/Invoice/confirmation";
import { StyledSettingsSupervisors } from "./StyledSettingsSupervisors.styled";
import { AddSettingsSupervisors } from "../Modals/AddSettingsSupervisors";

const { confirm } = Modal;

export const EditSupervisor = (props) => {
  const [editSupervisor, setEditSupervisor] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const openSupervisorModal = () => {
    setEditSupervisor(true);
  };
  const closeSupervisorModal = () => {
    setEditSupervisor(false);
  };
  return (
    <StyledSettingsSupervisors>
      <Icon
        icon="lucide:edit"
        color="#fa8c16"
        height="22px"
        className="icon"
        onClick={openSupervisorModal}
      />
      <AddSettingsSupervisors
        addSupervisor={editSupervisor}
        closeSupervisorModal={closeSupervisorModal}
        setLoading={setLoading}
        edit={true}
        record={props.record}
      />
    </StyledSettingsSupervisors>
  );
};

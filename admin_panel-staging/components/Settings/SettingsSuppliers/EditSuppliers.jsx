import { Icon } from "@iconify/react";
import { useState } from "react";
import { AddSettingsSupervisors } from "../Modals/AddSettingsSupervisors";
import { SettingsCustomModal } from "../Modals/SettingsCustomModal";
import { ClientsForm } from "../SettingsClients/SettingsClients";
import AddPayee from "@/components/Projects/Modals/AddPayee";

export const EditSuppliers = (props) => {
    const [editSupplier, setEditSupplier] = useState(false);
    // const [loading, setLoading] = useState(false);

    const openClientModal = () => {
        setEditSupplier(true);
    };

    const closeClientModal = () => {
        setEditSupplier(false);
    };

    return (
        <div>
            <Icon
                icon="lucide:edit"
                color="#fa8c16"
                height="22px"
                className="icon"
                onClick={openClientModal}
            />
            <AddPayee
                addPayee={editSupplier}
                closePayeeModal={closeClientModal}
                setLoading={props.setLoadingSuppliers}
                data={props.record}
                isEditing={true}
            />
        </div>
    );
};

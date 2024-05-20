import { Icon } from "@iconify/react";
import { useState } from "react";
import { SettingsCustomModal } from "../Modals/SettingsCustomModal";
import { ClientsForm } from "./SettingsClients";

export const EditClient = (props) => {
    const [editClient, setEditClient] = useState(false);
    const [loading, setLoading] = useState(false);

    const openClientModal = () => {
        setEditClient(true);
    };

    const closeClientModal = () => {
        setEditClient(false);
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

            <SettingsCustomModal
                width={700}
                open={editClient}
                title={"Edit a client"}
                onCancel={closeClientModal}
                content={<ClientsForm
                    onCancel={closeClientModal}
                    setLoadingClients={props?.setLoadingClients}
                    isEditing={true}
                    record={props.record} />}
            />
        </div>
    );
};

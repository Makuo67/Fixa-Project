import { createContext, useContext, useState } from "react";

export const PusherContext = createContext();

function PusherProvider({ pusher, children }) {
  const [profileData, setProfileData] = useState({
    loading: false,
    profileUpdated: false,
    profileUrl: "",
    profileJobTitle: "",
  });
  const [client, setClient] = useState("");
  const [canCreateInvoice, setCanCreateInvoice] = useState("");
  const [loadSupervisor, setLoadSupervisor] = useState(true);
  const [loadPayee, setLoadPayee] = useState(true);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [envoiceLoading, setEnvoiceLoading] = useState(true);
  const [projectStatusLoading, setProjectStatusLoading] = useState(true);
  const [projectUpdateLoading, setProjectUpdateLoading] = useState(true);
  return (
    <PusherContext.Provider
      value={{
        pusher,
        profileData,
        setProfileData,
        loadSupervisor,
        loadPayee,
        setLoadPayee,
        setLoadSupervisor,
        ratesLoading,
        setRatesLoading,
        envoiceLoading,
        setEnvoiceLoading,
        projectStatusLoading,
        setProjectStatusLoading,
        projectUpdateLoading,
        setProjectUpdateLoading,
        setClient,
        client,
        canCreateInvoice,
        setCanCreateInvoice,
      }}
    >
      {children}
    </PusherContext.Provider>
  );
}

function usePusher() {
  const context = useContext(PusherContext);
  if (!context) {
    throw new Error("Pusher to be used inside");
  }
  const { pusher } = context;
  return pusher;
}

export { PusherProvider, usePusher };

import { createContext, useContext, useState } from "react";

const AppContext = createContext();
export function AppWrapper({ children }) {
  const [paymentData, setPaymentData] = useState({
    project: "",
    status: "",
    start_date: "",
    end_date: "",
    payroll_id: "",
    payment: "",
  });
  return (
    <AppContext.Provider value={{ paymentData, setPaymentData }}>
      {children}
    </AppContext.Provider>
  );
}
export function useAppContext() {
  return useContext(AppContext);
}

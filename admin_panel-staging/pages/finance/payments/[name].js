import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "../../../components/Layouts/DashboardLayout/Layout";
import renderLoader from "../../../components/Loaders/renderLoader";
import PayoutPage from "../../../components/Payments/PayoutPage";
import Payroll from "../../../components/Payments/Payroll";
import { getPaymentData } from "../../../helpers/auth";
import localforage from "localforage";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import { accessRouteRetrieval } from "@/utils/accessLevels";
import ErrorComponent from "@/components/Error/Error";

const SinglePayment = () => {
  const router = useRouter();
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentType, setPaymentType] = useState(null);
  const [pageAction, setPageAction] = useState(null);
  const [paymentId, setPaymentId] = useState(null);

  const { userProfile, companyStatus } = useUserAccess();
  const { user_access } = userProfile;

  // useEffect(() => {
  //   /**
  //    * Redirect users to home whenever they don't have view access of payments page
  //    */
  //   if (typeof window !== 'undefined') {
  //     localforage
  //       .getItem("paymentViewAccess")
  //       .then((value) => {
  //         if (value?.toString() === "false") {
  //           router.push("/");
  //         }
  //       })
  //       .catch((error) => {
  //         console.log("error", error);
  //       });
  //   }
  // }, []);

  useEffect(() => {
    setPaymentType(null);
    getPaymentData().then((res) => {
      setPaymentType(res?.paymentType);
      setPaymentId(res?.payout_id);
    });
  }, [router, router.isReady]);

  useEffect(() => {
    if (router.isReady) {
      const { payment, action, payroll_id } = router.query;
      setPageAction(action);
      setPaymentsLoading(false);
    }
  }, [router.isReady, router.query]);

  if (companyStatus?.company_name === "" || user_access?.length === 0) {
    return renderLoader();
  } else if (accessRouteRetrieval(userProfile?.user_access, 'finance', 'payment') === false) {
    return <ErrorComponent status={403} backHome={true} />
  } else {
    return (
      <div>
        {paymentType == "Payout" ? (
          <PayoutPage name={paymentId} />
        ) : (
          <Payroll />
        )}
      </div>
    );
  }
};

export default SinglePayment;

SinglePayment.getLayout = function getLayout(page) {
  return <Layout isSinglePayment={true}>{page}</Layout>;
};

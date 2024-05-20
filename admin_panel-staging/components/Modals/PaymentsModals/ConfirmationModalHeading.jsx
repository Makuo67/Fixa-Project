import { capitalizeAll } from "../../../helpers/capitalize";

const Heading = ({ action, otp, project, paymentPeriod, payment_id, payoutData, payout }) => {
  return (
    <>
      {action == "pay" && payout ? (<></>
        // <h3 style={{ fontWeight: "500", fontSize: "16px" }}>
        //   Confirm the payment for {payoutData.aggregates.total_transactions} payees on Payout #{payment_id}
        // </h3>
      )
        : otp ? (
          <>
            {action == "pay" ? (
              <p style={{ fontWeight: "500", fontSize: "16px" }}>
                Confirm the payment for {project} workers for {paymentPeriod}
              </p>
            ) : (
              <div>
                <p style={{ fontWeight: "500", fontSize: "16px" }}>
                  Send Payment confirmation SMS to {project} workers for{" "}
                  {paymentPeriod}
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {action == "closePayments" && payout ? (

              <p
                style={{
                  fontWeight: "500",
                  fontSize: "16px",
                  marginLeft: "60px",
                }}
              >
                Are you sure you want to close payout?
              </p>
            ) : action == "closePayments" ? (
              <p className="font-medium text-lg"
                // style={{
                //   fontWeight: "500",
                //   fontSize: "16px",
                //   marginLeft: "60px",
                // }}
              >
                Are you sure you want to close payroll?
              </p>
            ) : (
              <div style={{ padding: "10px 0px" }}>
                {action == "rerunPay" && payout ? (
                  <p style={{ fontWeight: "500", fontSize: "16px" }}>
                    Confirm to rerun payment for {payoutData.aggregates.total_transactions} payees on Payout #{payment_id}. Do you want to continue?
                  </p>
                ) : action == "rerunPay" ? (
                  <p style={{ fontWeight: "500", fontSize: "16px" }}>
                    Confirm to rerun payment for {capitalizeAll(project)} workers from{" "}
                    {paymentPeriod}. Do you want to continue?
                  </p>
                ) : (
                  <>
                    {action == "pay" ? (<></>
                      // <p style={{ fontWeight: "500", fontSize: "16px" }}>
                      //   Confirm the payment for {project} workers from{" "}
                      //   {paymentPeriod}. Do you want to continue?
                      // </p>
                    ) : (
                      <div>
                        <p style={{ fontWeight: "500", fontSize: "16x" }}>
                          Send Payment confirmation SMS to {project} workers for{" "}
                          {paymentPeriod}.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
    </>
  );
};

export default Heading;

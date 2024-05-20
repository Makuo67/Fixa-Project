import { Button } from "antd";
import { StyledConfirmationModal } from "./ConfirmationModal.styled";
import NumberFormat from "../../shared/NumberFormat";
import { toMoney } from "../../../helpers/excelRegister";

const SuccessContent = ({
  closeSuccessModal,
  enablePayment,
  action,
  handlePaymentDone,
  payout,
  handlePayoutPay,
  total_workers,
  amount_to_be_disbursed,
  payoutData,
  workers,
}) => {
  const handleSuccessModalViewed = () => {
    closeSuccessModal();
    enablePayment();
    if (action == "pay" && !payout) {
      handlePaymentDone();
    }
    if (payout) {
      if (action == "pay" || action == "rerunPay" && payout) {
        handlePayoutPay();
      }
    }
  };

  return (
    <StyledConfirmationModal>
      <div className="content">
        {action == "pay" || action == "rerunPay" ? (
          <div className="flex flex-col items-center gap-2">
            <p className="message">
              Total Amount to be Disbursed (RWF)
            </p>
            <div className="flex items-center justify-center w-80 h-14 bg-pastel rounded-xl" >
              <p className="text-4xl font-semibold text-charcoal" >
                {action == "rerunPay" && payout ? (
                  <>
                    <NumberFormat
                      value={toMoney(
                        payoutData?.aggregates?.total_payout -
                        payoutData?.aggregates?.total_disbursed
                      )}
                    />
                  </>
                ) : action == "rerunPay" ? (
                  <>
                    <NumberFormat value={amount_to_be_disbursed} />
                  </>
                ) : (
                  <NumberFormat
                    value={
                      amount_to_be_disbursed ||
                      toMoney(payoutData?.aggregates?.total_payout)
                    }
                  />
                )}
              </p>
            </div>

            <p className="font-medium text-base text-sub-title">
              The transactions are happening in the background you can close
              this pop-up and you will get notified when completed
            </p>
            <Button className="primaryBtn" onClick={handleSuccessModalViewed} >
              Close
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center pt-8 gap-4" >
            <p className="messageSending">
              Sending messages to {total_workers} workers.
            </p>
            <Button className="primaryBtn" onClick={handleSuccessModalViewed} >
              Close
            </Button>
          </div>
        )}
      </div>
    </StyledConfirmationModal>
  );
};

export default SuccessContent;

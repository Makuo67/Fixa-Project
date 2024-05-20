import { Button, Form, notification } from "antd";
import { useEffect, useState } from "react";
import OtpInput from "react-otp-input";
import { retriveUserDataFromLocalStorage } from "../../../helpers/auth";
import { sendOTP, sendPaymentOTP, verifyOTP, verifyPaymentOTP } from "../../../helpers/payments/payroll/payroll";
import { StyledConfirmationModal } from "./ConfirmationModal.styled";
import Heading from "./ConfirmationModalHeading";

const OPTModelContent = ({
  OtpVerified,
  action,
  paymentPeriod,
  project,
  payment_id,
  OTP,
  setOTP,
  payoutData,
  payout,
  paymentMethodId,
  handleBackStep,
  payOtpId,
  smsOtpId,
}) => {
  const [otpFilled, setOtpFilled] = useState(true);
  const [user_phone, setuser_phone] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);

  useEffect(() => {
    retriveUserDataFromLocalStorage().then((user) => {
      setuser_phone(user.username);
    });
  }, []);
  function handleChange(OTP) {
    setOTP(OTP);
    if (OTP.length == 5) {
      setOtpFilled(false);
    }
  }
  const handleOTPsubmitted = () => {
    setVerificationLoading(true);
    if (action == "pay") {
      const otpBody = {
        otp_type_id: payOtpId,
        otp_pin: parseInt(OTP),
        payment_id: parseInt(payment_id),
        payment_method_id: paymentMethodId
      };
      verifyPaymentOTP(otpBody).then((res) => {
        if (!res || res.data.status == "failed" || res.status === 400) {
          notification.error({
            message: "Failed",
            description: res?.data?.error,
          });
          setVerificationLoading(false);
          setOTP([]);
          setOtpFilled(true);
        } else {
          notification.success({
            message: "Success",
            description: "New OTP sent check your phone",
          });
          OtpVerified();
          handleBackStep()
          setVerificationLoading(false);
        }
      });
    } else if (action == "rerunPay") {
      const otpBody = {
        otp_type_id: payOtpId,
        otp_pin: parseInt(OTP),
        payment_id: parseInt(payment_id),
        payment_method_id: paymentMethodId
      };
      verifyPaymentOTP(otpBody).then((res) => {
        if (!res || res.data.status == "failed" || res.status === 400) {
          notification.error({
            message: "Failed",
            description: res?.data?.error,
          });
          setVerificationLoading(false);
          setOTP([]);
          setOtpFilled(true);
        } else {
          notification.success({
            message: "Success",
            description: "New OTP sent check your phone",
          });
          OtpVerified();
          handleBackStep()
          setVerificationLoading(false);
        }
      });
    } else {
      const otpBody = {
        otp_type_id: smsOtpId,
        otp_pin: parseInt(OTP),
        payment_id: parseInt(payment_id),
      };
      verifyOTP(otpBody).then((res) => {
        if (res?.data?.status == "failed") {
          notification.error({
            message: "Failed",
            description: res?.data?.data,
          });
          setVerificationLoading(false);
          setOtpFilled(true);
          setOTP([]);
        } else {
          OtpVerified();
          handleBackStep()
          setVerificationLoading(false);
        }
      });
    }
  };

  const handleResend = () => {
    if (action == "pay") {
      const otpBody = {
        otp_type_id: payOtpId,
        payment_id: parseInt(payment_id),
        phone_number: user_phone,
        payment_method_id: paymentMethodId
      };
      sendPaymentOTP(otpBody).then((response) => {
        if (!response || response.data.status == "failed" || response.status === 400) {
          notification.error({
            message: "Failed",
            description: response?.data?.error,
          });
        } else {
          notification.success({
            message: "Success",
            description: "New OTP sent check your phone",
          });
        }
      });
    } else if (action == "rerunPay") {
      const otpBody = {
        otp_type_id: payOtpId,
        payment_id: parseInt(payment_id),
        phone_number: user_phone,
        payment_method_id: paymentMethodId
      };
      sendPaymentOTP(otpBody).then((response) => {
        if (!response || response.data.status == "failed" || response.status === 400) {
          notification.error({
            message: "Failed",
            description: response?.data?.error,
          });
        } else {
          notification.success({
            message: "Success",
            description: "New OTP sent check your phone",
          });
        }
      });
    } else {
      const otpBody = {
        otp_type_id: smsOtpId,
        payment_id: parseInt(payment_id),
        phone_number: user_phone,
      };
      sendOTP(otpBody).then(() => {
        notification.success({
          message: "Success",
          description: "New OTP sent check your phone",
        });
      });
    }
  };

  return (
    <StyledConfirmationModal>
      <div className="content">
        <Heading
          action={action}
          paymentPeriod={paymentPeriod}
          project={project}
          payoutData={payoutData}
          payout={payout}
          payment_id={payment_id}
        />
        <div>
          {action && action !== 'sendSMS' && (
            <h3 className="font-medium text-lg" >
              {payout && action === 'rerunPay' ? "" : payout ? `Confirm the payment for Payout #${payment_id}` : action === 'rerunPay' ? '' :
                `Confirm the payment for ${project} workers from ${paymentPeriod}`
              }
            </h3>
          )}
          <p className="font-medium text-lg text-gray-slate">
            An OTP has been sent to your mobile number, Please verify it below
          </p>

          <div>
            <Form className="flex flex-col gap-2">
              <div className="flex flex-col items-center gap-2">
                <h3>Enter Code</h3>
                <div>
                  <OtpInput
                    // className="otp-input"
                    onChange={handleChange}
                    value={OTP}
                    inputStyle="inputStyle"
                    numInputs={5}
                    separator={<span></span>}
                    shouldAutoFocus={true}
                  />
                </div>
              </div>

              <div className="flex w-full items-center justify-center">
                <Button
                  type="primary"
                  className="primaryBtn"
                  disabled={otpFilled}
                  onClick={handleOTPsubmitted}
                  loading={verificationLoading}
                >
                  Verify
                </Button>
              </div>

              <p
                style={{
                  fontWeight: "500",
                  fontSize: "16px",
                  color: "#757C8A",
                }}
              >
                Didn’t receive the Code?{" "}
                <a
                  style={{
                    color: "#00a1de",
                  }}
                  onClick={handleResend}
                >
                  Click to resend
                </a>
              </p>
            </Form>
          </div>
        </div>
      </div>
    </StyledConfirmationModal>
  );
};

export default OPTModelContent;

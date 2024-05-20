import { Icon } from "@iconify/react";
import { Button, Tooltip } from "antd";
import { useEffect, useState } from "react";
import localforage from "localforage";

import { LoadingOutlined } from '@ant-design/icons';
import Image from "next/image";
import { closeTransaction, getPayeesDb, getPayoutDetails } from "../../helpers/payments/payout/payout";
import { StyledPaymentButton } from "../Buttons/NewPaymentButton.styled";
import ConfirmMessage from "../Modals/PaymentsModals/ConfirmMessage";
import { SyncOutlined } from "@ant-design/icons";
import { getPayrollDeductionDetails } from "../../helpers/payments/payroll/payroll";
import claimsIcon from "../../assets/svgs/text.svg";
import { getDeductionSummary, getPayeesList } from "../../helpers/deduction/deduction";
import { useUserAccess } from "../Layouts/DashboardLayout/AuthProvider";
import { accessSubpageEntityRetrieval } from "@/utils/accessLevels";

const ActionButtons = (props) => {
  const [showModal, setShowModal] = useState(false);
  const [deductionModal, setDeductionModal] = useState(false);
  const [paymentDisable, setPaymentDisable] = useState(true);
  const [smsDisabled, setSmsDisabled] = useState(false);
  const [action, setAction] = useState(null);
  const [modalData, setModalData] = useState([]);
  const [showSendDeductions, setShowSendDeductions] = useState(false)
  const [phoneOtpAvailable, setPhoneOtpAvailable] = useState(false);
  const [payButtonsAccess, setPayButtonAccess] = useState(false)
  const [smsButtonAccess, setSmsButtonAccess] = useState(false);
  const [closePayButtonAccess, setClosePayButtonAccess] = useState(false);

  const { userProfile } = useUserAccess();

  useEffect(() => {
    // check the phone for OTP
    if (userProfile && userProfile?.phoneNumber) {
      setPhoneOtpAvailable(true);
    }
    if (userProfile) {
      setPayButtonAccess(userProfile && accessSubpageEntityRetrieval(userProfile?.user_access, 'finance', 'payment', 'pay'));
      setClosePayButtonAccess(userProfile && accessSubpageEntityRetrieval(userProfile?.user_access, 'finance', 'payment', 'close payment'));
      setSmsButtonAccess(userProfile && accessSubpageEntityRetrieval(userProfile?.user_access, 'finance', 'payment', 'send confirmation sms'));
    } else {
      setPhoneOtpAvailable(false);
    }
  }, [userProfile]);


  // Remember to check if all deductions are submitted to activate back pay buttons by setting showPayButtons to true
  const enablePayment = () => {
    setPaymentDisable(false);
  };

  const changeDisable = () => {
    setPaymentDisable(false);
  };

  const changeSMSenable = () => {
    setSmsDisabled(true);
  };

  const closeShowModal = () => {
    setShowModal(false);
  };
  const handleCancel = () => {
    setShowModal(false);
  };

  useEffect(() => {
    if (props.sms_status) {
      changeDisable();
      changeSMSenable();
    }
  }, [!paymentDisable, props.sms_status]);

  useEffect(() => {
    if (showModal) {
      if (props.payout) {
        getPayoutDetails(props.payment_id).then((data) => {
          setModalData(data)
        })
      } else {
        getPayrollDeductionDetails(props.payment_id).then((data) => {
          setModalData(data)
        })
      }
    }
  }, [showModal]);

  const handleRerunPay = () => {
    setAction("rerunPay");
    setShowModal(true);
  };

  useEffect(() => {
    if (props.project_id) {
      getPayeesList(props.project_id).then((res) => {
        setShowSendDeductions(res?.payee_names?.length > 0 &&
          userProfile && accessSubpageEntityRetrieval(userProfile?.user_access, 'finance', 'payment', 'send deduction')
        )
      })
    }
  }, [props.project_id])

  return (
    <div>
      {props.payout ? (
        <>
          {props.loading ? (
            <SyncOutlined spin />
          ) : props.payoutStatus === "unpaid" && !props.paymentRun && payButtonsAccess ? (
            <StyledPaymentButton>
              <Tooltip
                title={!phoneOtpAvailable ? 'It looks like we do not have the number to send OTP to, Add your phone number in settings.' : ''}>

                <Button
                  className="primaryBtn"
                  type="primary"
                  icon={
                    <Icon
                      icon="fa6-solid:hand-holding-dollar"
                      color="white"
                      height={18}
                    />
                  }
                  onClick={() => {
                    setAction("pay");
                    setShowModal(true);
                  }}
                  disabled={!phoneOtpAvailable ? true : props.showPayoutButtons}
                >
                  Pay
                </Button>
              </Tooltip>

            </StyledPaymentButton>
          ) : props.payoutStatus === "closed" ? (
            <></>
          ) : props.loading ? (
            <SyncOutlined spin />
          ) : payButtonsAccess && (
            <div style={{ display: "flex" }}>
              <div style={{ marginRight: "20px" }}>
                <StyledPaymentButton>
                  <Tooltip
                    title={!phoneOtpAvailable ? 'It looks like we do not have the number to send OTP to, Add your phone number in settings.' : ''}>

                    <Button
                      className="primaryBtn"
                      icon={
                        <Icon icon="ic:round-sync" color="white" height={18} />
                      }
                      onClick={() => {
                        setAction("rerunPay");
                        setShowModal(true);
                      }}
                      disabled={!phoneOtpAvailable ? true : false}
                    >
                      Rerun Failed Transactions
                    </Button>
                  </Tooltip>
                </StyledPaymentButton>
              </div>

              {closePayButtonAccess && (
                <StyledPaymentButton>
                  <Button
                    className="primaryBtn"
                    icon={
                      <Icon
                        icon="carbon:close-outline"
                        color="white"
                        height={18}
                      />
                    }
                    onClick={() => {
                      setAction("closePayments");
                      setShowModal(true);
                    }}
                  >
                    Close Payout
                  </Button>
                </StyledPaymentButton>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {props.paymentRun || props.payoutStatus === "open" && payButtonsAccess ? (
            <div style={{ display: "flex" }}>
              <div style={{ marginRight: "20px" }}>
                <StyledPaymentButton>
                  <Tooltip
                    title={!phoneOtpAvailable ? 'It looks like we do not have the number to send OTP to, Add your phone number in settings.' : ''}>
                    <Button
                      type="primary"
                      className="primaryBtn"
                      icon={
                        <Icon icon="ic:round-sync" color="white" height={18} />
                      }
                      onClick={handleRerunPay}
                      disabled={!phoneOtpAvailable ? true : false}
                    >
                      Rerun Failed Transactions
                    </Button>
                  </Tooltip>
                </StyledPaymentButton>
              </div>
              <StyledPaymentButton>
                <Button
                  className="primaryBtn"
                  type="primary"
                  icon={
                    <Icon
                      icon="carbon:close-outline"
                      color="white"
                      height={18}
                    />
                  }
                  onClick={() => {
                    setAction("closePayments");
                    setShowModal(true);
                  }}
                >
                  Close
                </Button>
              </StyledPaymentButton>
            </div>
          ) : (
            <div className="flex gap-3 w-full"
            // style={{ display: "flex", gap: "20px" }}
            >

              <>
                <div>
                  <StyledPaymentButton>
                    {smsDisabled ? (
                      <></>
                    ) : smsButtonAccess && (
                      <Tooltip
                        title={!phoneOtpAvailable ? 'It looks like we do not have the number to send OTP to, Add your phone number in settings.' : ''}>
                        <Button
                          className="primaryBtn"
                          icon={
                            <Icon
                              icon="fa6-solid:comment-sms"
                              color="white"
                              height={18}
                            />
                          }
                          onClick={() => {
                            setAction("sendSMS");
                            setShowModal(true);
                            setDeductionModal(false);
                          }}
                          disabled={!phoneOtpAvailable ? true : smsDisabled}
                        >
                          Send confirmation SMS
                        </Button>
                      </Tooltip>
                    )}
                  </StyledPaymentButton>
                </div>
                {payButtonsAccess && (
                  <StyledPaymentButton>
                    <Tooltip
                      title={!phoneOtpAvailable ? 'It looks like we do not have the number to send OTP to, Add your phone number in settings.' : ''}>

                      <Button
                        className="primaryBtn"
                        icon={
                          <Icon
                            icon="fa6-solid:hand-holding-dollar"
                            color="white"
                            height={18}
                          />
                        }
                        onClick={() => {
                          setAction("pay");
                          setShowModal(true);
                          setDeductionModal(false)
                        }}
                        disabled={!phoneOtpAvailable}
                      >
                        Pay
                      </Button>
                    </Tooltip>
                  </StyledPaymentButton>
                )}
                {!showSendDeductions ? "" : <StyledPaymentButton>
                  <Tooltip
                    title={!phoneOtpAvailable ? 'It looks like we do not have the number to send OTP to, Add your phone number in settings.' : ''}>

                    <Button
                      className="primaryBtn flex flex-row gap-3"
                      type="primary"
                      onClick={() => {
                        setAction("pay");
                        setShowModal(true);
                        setDeductionModal(true);
                      }}
                      disabled={!phoneOtpAvailable ? true : false}
                    >
                      <Icon icon="fa6-solid:file-invoice-dollar" />
                      Send Deductions
                    </Button>
                  </Tooltip>
                </StyledPaymentButton>}
              </>

            </div>
          )}
        </>
      )}

      <ConfirmMessage
        show={showModal}
        handleCancel={handleCancel}
        enablePayment={enablePayment}
        action={action}
        handlePaymentDone={props.handlePaymentDone}
        closeShowModal={closeShowModal}
        paymentPeriod={props.paymentPeriod}
        project={props.project}
        project_id={props.project_id}
        handlePayoutPay={props.handlePayoutPay}
        payout={props.payout}
        payment_id={props?.payment_id}
        total_workers={props.total_workers}
        amount_to_be_disbursed={props.amount_to_be_disbursed}
        setLoading={props.setLoading}
        payoutData={props.payoutData}
        changeSMSenable={changeSMSenable}
        workers={props.workers}
        modalData={modalData}
        deductions={deductionModal}
      />
    </div>
  );
};

export default ActionButtons;

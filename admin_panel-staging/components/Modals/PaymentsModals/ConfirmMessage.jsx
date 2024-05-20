import { Checkbox, Empty, Form, Modal, Select, notification } from "antd";
import {
  StyledConfirmationModal, StyledDeductionsSummary
} from "./ConfirmationModal.styled";
import { useEffect, useState } from "react";
import OPTModelContent from "./OPTModelCOntent";
import Content from "../../Uploads/WorkerExcel.styled";
import SuccessContent from "./SuccessCOntent";
import ConfirmationContent from "./ConfirmationContent";
import { useRouter } from "next/router";
import { retriveAuthTokenFromLocalStorage } from "../../../helpers/auth";
import { sendOTP, sendPaymentOTP } from "../../../helpers/payments/payroll/payroll";
import { closeTransaction } from "../../../helpers/payments/payout/payout";
import NumberFormat from "../../shared/NumberFormat";
import { capitalizeAll } from "../../../helpers/capitalize";
import _ from "underscore";
import { sendEmailLink } from "../../../helpers/deduction/deduction";
import OnboardSteps from "@/components/Onboarding/OnboardSteps";
import { itemStyles } from "@/components/Forms/WorkerRegistrationForm";
import { getCompanyPaymentMethods } from "@/helpers/payment-methods/payment-methods";
import { getOtpTypes } from "@/helpers/otp/otp";
import { extractPrimaryPaymentMethods } from "@/utils/transformObject";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";

export const paySteps = [
  {
    title: <span className='stepTitle text-primary'>Payment Method</span>,
  },
  {
    title: <span className='stepTitle text-primary'>Confirm Payment</span>,
  },
];

export const filterOption = (input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

export const onSearch = (value) => {
  console.log("search:", value);
};
const ConfirmMessage = ({
  show,
  action,
  handleCancel,
  enablePayment,
  handlePaymentDone,
  closeShowModal,
  paymentPeriod,
  project,
  project_id,
  handlePayoutPay,
  payout,
  payment_id,
  total_workers,
  amount_to_be_disbursed,
  setLoading,
  payoutData,
  changeSMSenable,
  workers,
  modalData,
  deductions
}) => {
  const [showOtp, setShowOtp] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [user_phone, setuser_phone] = useState(null);
  const [OTP, setOTP] = useState([]);
  const [payees, setPayees] = useState(null)
  const [emails, setEmails] = useState([])
  const [sent, setSent] = useState(false)
  const [currentStep, setCurrentStep] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState([])
  const [paymentMethodId, setPaymentMethodId] = useState(null)
  const [payOtpId, setPayOtpId] = useState(null)
  const [smsOtpId, setSmsOtpId] = useState(null)
  const [emailChanged, setEmailChanged] = useState(false)

  const [form] = Form.useForm();
  const { userProfile } = useUserAccess();

  // Get list of payees
  const getPayees = async () => {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const payees = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${project_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${authorization}`,
      }
    })
      .then((res) => res.json())

    const deductionsTransactions = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/deductions-transactions/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${authorization}`,
      }
    })
      .then((res) => res.json())

    let deductions = _.map(deductionsTransactions, (deduction) => {
      return { payee_name_id: deduction.payee_name_id, names: deduction.payee_name, phone_number: deduction.phone_number, status: deduction.status, payment_id: deduction.payment_id }
    })
    let filteredDeductions = deductions.filter((x) => (x.status === "unpaid" || x.status === "email_sent") && x.payment_id === payment_id)

    let allPayees = payees?.payee_names?.map((item) => {
      item = { ...item, ...filteredDeductions.find((x) => x.payee_name_id == item.id) }
      return item
    })
    setPayees(allPayees)
  }

  useEffect(() => {
    // retriveUserDataFromLocalStorage().then((user) => {
    //   setuser_phone(user?.username);
    // });
    if (userProfile && userProfile?.phoneNumber) {
      setuser_phone(userProfile?.phoneNumber)
    }
  }, [sent, userProfile]);

  useEffect(() => {
    getPayees();
    getCompanyPaymentMethods().then((data) => {
      setPaymentMethods(extractPrimaryPaymentMethods(data));
    });
    getOtpTypes().then((response) => {
      const payOtp = response?.find(item => item.type_name === "pay")?.id
      const smsOtp = response?.find(item => item.type_name === "sms")?.id
      setPayOtpId(payOtp)
      setSmsOtpId(smsOtp)
    })
  }, [])

  useEffect(() => {
    if (emailChanged) {
      getPayees();
    }
  }, [emailChanged])

  const router = useRouter();

  const handleNextStep = () => {
    setCurrentStep(currentStep + 1)
  }

  const handleBackStep = () => {
    if (currentStep === 0) {
      setPaymentMethodId(null)
    } else {
      setCurrentStep(currentStep - 1)
    }
    setPaymentMethodId(null)
    form.resetFields()
  }

  const makeOTOPvisible = () => {
    setShowOtp(true);
  };

  const handleClosingPayout = () => {
    closeTransaction(payment_id, payout).then((res) => {
      closeShowModal();
      router.push("/finance/payments");
    });
  };

  const handleOk = () => {
    form.resetFields()
    setSent(!sent)
    if (deductions && _.pluck(emails, "email").length === 0) {
      notification.error({
        message: "Failed",
        description: `The emails field is required`,
      })
      return false
    } else if (deductions) {
      sendEmailLink(payment_id, _.pluck(emails, "email"))
      setEmailChanged(!emailChanged)
      handleCancel();
      setEmails([])
    }
    else if ((action == "closePayments") & payout) {
      handleCancel();
      handleClosingPayout();
    } else if (action == "closePayments") {
      handleClosingPayout();
    } else {
      handleCancel();
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
            makeOTOPvisible();
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
            makeOTOPvisible();
          }
        });
      } else {
        const otpBody = {
          otp_type_id: smsOtpId,
          payment_id: parseInt(payment_id),
          phone_number: user_phone,
        };
        sendOTP(otpBody).then((res) => {
          if (res?.status == "failed") {
            notification.error({
              message: "Error",
              description: `Could not send OTP`,
            });
          } else {
            makeOTOPvisible();
          }
        });
      }
    }
  };

  const closeOtpModal = () => {
    setShowOtp(false);
    setOTP([]);
  };

  const closeSuccessModal = () => {
    if (action == "sendSMS") {
      changeSMSenable();
    }
    setSuccessModal(false);
  };

  const OtpVerified = () => {
    setShowOtp(false);
    setOTP([]);
    setSuccessModal(true);
  };

  const ModalTitle = () => (
    <Content confirmPayment={true}>
      <h1 className="import">Confirm Payment</h1>
    </Content>
  );

  const SuccessTitle = () => (
    <Content confirmPayment={true}>
      {action == "rerunPay" ? (
        <h1 className="import modalTitle">Payment Reruned</h1>
      ) : (
        <>
          {action == "pay" && payout ? (
            <h1 className="import modalTitle">Payout Disbursed</h1>
          ) : action == "pay" ? (
            <h1 className="import">Payroll Disbursed</h1>
          ) : (
            <h1 className="import modalTitle">Sending Message</h1>
          )}
        </>
      )}
    </Content>
  );

  const onPayeeChange = (e) => {
    if (e.target.checked && payees?.find(h => h.id.toString() === e.target.value.toString())?.email) {
      setEmails(result => [...result, payees?.find(h => h.id.toString() === e.target.value.toString())])
      form.resetFields()
    } else {
      emails.map((item, index) => {
        if (item.id.toString() === e.target.value.toString()) {
          emails.splice(index, 1)
        }
      })
    }
  }
  return (
    <>
      <StyledConfirmationModal>
        <Modal
          title={deductions ? <span className="heading-1">Send Deductions</span> : ""}
          centered
          okText="Yes"
          cancelText="No"
          // closeIcon={<Icon icon="fe:close" className="close" />}
          open={show}
          onOk={handleOk}
          onCancel={closeShowModal}
          styles={{
            body: {
              height: "100%",
              // width: "fit-content"
            }
          }}
          width={deductions ? 800 : action === "pay" || action === "rerunPay" ? 500 : ""}
          footer={null}
        >
          {action == "pay" && !deductions &&
            <StyledDeductionsSummary>
              <OnboardSteps steps={paySteps} currentStep={currentStep} />
              {currentStep === 0 && (
                <>
                  <Form
                    form={form}
                    layout="vertical"
                    className="flex flex-col gap-8"
                    requiredMark={false}
                  >
                    <Form.Item
                      name={[name, "payment_method_id"]}
                      label={
                        <span className="text-sub-title cursor-pointer">
                          Select Payment Method <span className="text-bder-red">*</span>
                        </span>
                      }
                      rules={[
                        {
                          required: true,
                          message: 'Please input the account number!',
                        },
                      ]}
                    >
                      <Select
                        showSearch
                        optionFilterProp="children"
                        filterOption={filterOption}
                        onSearch={onSearch}
                        onSelect={(e) => setPaymentMethodId(e)}
                        style={itemStyles.inputStyles}
                        options={paymentMethods?.map((item) => ({
                          value: item.id,
                          label: item.name
                        }))}
                      />
                    </Form.Item>
                  </Form>
                </>
              )}
              {currentStep === 1 && (
                <>
                  <p className="confirmation-text">
                    {payout ? `Confirm the payment for Payout #${payment_id}?` :

                      `Confirm the payment for ${capitalizeAll(project)} workers from ${paymentPeriod}. Do you want to continue?`
                    }
                  </p>
                  <div className="earnings-container">
                    {payout ?
                      modalData?.map((item, idx) => {
                        return <div className="earnings-item" key={idx}>
                          <div className="label">{capitalizeAll(item?.payee_type)}</div>
                          <div className="value"><NumberFormat value={item?.amount} /></div>
                        </div>
                      })
                      :
                      <>
                        <div className="earnings-item">
                          <div className="label">Worker earnings</div>
                          <div className="value"><NumberFormat value={modalData?.worker_earnings} /></div>
                        </div>
                        <div>
                          <div className="earnings-item">
                            <div className="label">Total Deductions</div>
                            <div className="value"><NumberFormat value={modalData?.total_deductions} /></div>
                          </div>
                          {modalData?.deductions_details?.length > 0 ? modalData.deductions_details.filter(item => parseInt(item.amount) > 0).map((item, idx) => (
                            <div className="earnings-subitem" key={idx}>
                              <div className="label">{item.name}</div>
                              <div className="value"><NumberFormat value={item.amount} /></div>
                            </div>
                          )) : null}
                        </div>
                        <div className="earnings-item">
                          <div className="label">Total</div>
                          <div className="value"><NumberFormat value={modalData?.worker_earnings + modalData?.total_deductions} /></div>
                        </div>
                      </>
                    }
                  </div>
                </>
              )}
            </StyledDeductionsSummary>
          }
          {deductions &&
            <>
              <span className="sub-heading-1">Please Select Suppliers</span>
              <div style={{
                display: "flex",
                flexDirection: "column",
                paddingTop: "10px"
              }}>
                {payees && payees?.length > 0 ?
                  <Form autoComplete="off" form={form}>
                    <Form.Item>
                      {payees?.map((item, index) =>
                        <div key={index} className="w-full flex justify-between">
                          <Checkbox onChange={onPayeeChange} value={item.id} disabled={item?.status === "email_sent" || item.status === "unpaid" ? true : false}>
                            {capitalizeAll(item.names)}
                          </Checkbox>
                          <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
                            <span style={{
                              fontSize: "14px",
                              fontWeight: "500",
                              color: "#798C9A",
                              fontStyle: "normal",
                              lineHeight: "20px",
                            }}>
                              {item.email}
                            </span>
                            <span style={{
                              fontSize: "14px",
                              fontWeight: "500",
                              color: "#798C9A",
                              fontStyle: "normal",
                              lineHeight: "20px",
                            }}>
                              {item.phone_number}
                            </span>

                          </div>
                        </div>
                      )}
                    </Form.Item>
                  </Form> :
                  <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Empty description="No Suppliers, please add Suppliers." />
                  </div>
                }
              </div>
            </>
          }
          <ConfirmationContent
            action={action}
            closeShowModal={closeShowModal}
            handleOk={handleOk}
            paymentPeriod={paymentPeriod}
            project={project}
            payment_id={payment_id}
            otp={showOtp}
            payoutData={payoutData}
            payout={payout}
            deductions={deductions}
            emails={emails}
            form={form}
            currentVerificationStep={currentStep}
            handleNextStep={handleNextStep}
            handleBackStep={handleBackStep}
            paymentMethodId={paymentMethodId}
            selectPaymentForm={form}
            paymentMethods={paymentMethods}
            setPaymentMethodId={setPaymentMethodId}
          />
        </Modal>
        <Modal
          centered
          // closeIcon={<Icon icon="fe:close" className="close" />}
          title={<ModalTitle />}
          open={showOtp}
          onOk={OtpVerified}
          onCancel={closeOtpModal}
          width={662}
          styles={{
            body: {
              height: '100%'
            }
          }}
          footer={null}
        >
          <OPTModelContent
            OtpVerified={OtpVerified}
            action={action}
            paymentPeriod={paymentPeriod}
            project={project}
            payment_id={payment_id}
            OTP={OTP}
            setOTP={setOTP}
            payoutData={payoutData}
            payout={payout}
            paymentMethodId={paymentMethodId}
            setPaymentMethodId={setPaymentMethodId}
            payOtpId={payOtpId}
            smsOtpId={smsOtpId}
            handleBackStep={handleBackStep}
          />
        </Modal>
        <Modal
          centered
          title={<SuccessTitle />}
          open={successModal}
          onOk={closeSuccessModal}
          onCancel={closeSuccessModal}
          width={action && action === "sendSMS" ? 500 : 662}
          styles={{
            body: {
              height: action && action === "sendSMS" ? 160 : action === "pay" || action === "rerunPay" ? 180 : 416,
            }
          }}
          footer={null}
        >
          <SuccessContent
            closeSuccessModal={closeSuccessModal}
            enablePayment={enablePayment}
            action={action}
            handlePaymentDone={handlePaymentDone}
            handlePayoutPay={handlePayoutPay}
            payout={payout}
            total_workers={total_workers}
            amount_to_be_disbursed={amount_to_be_disbursed}
            payoutData={payoutData}
            workers={workers}
          />
        </Modal>
      </StyledConfirmationModal>
    </>
  );
};
export default ConfirmMessage;

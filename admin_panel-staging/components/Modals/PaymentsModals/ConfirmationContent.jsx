import { Button, Form, Select, Tooltip } from "antd";
import Heading from "./ConfirmationModalHeading";
import OnboardSteps from "@/components/Onboarding/OnboardSteps";
import { filterOption, onSearch, paySteps } from "./ConfirmMessage";
import { itemStyles } from "@/components/Forms/WorkerRegistrationForm";

const ConfirmationContent = ({
  action,
  otp,
  closeShowModal,
  handleOk,
  paymentPeriod,
  project,
  payment_id,
  payoutData,
  payout,
  deductions,
  currentVerificationStep,
  handleNextStep,
  handleBackStep,
  paymentMethodId,
  selectPaymentForm,
  paymentMethods,
  setPaymentMethodId
}) => {
  function ActionButton() {
    if (deductions || action === "sendSMS" || action === "closePayments") {
      return (<Button
        type="primary"
        className="primaryBtn"
        htmlType="submit"
        onClick={handleOk}
        disabled={false}
      >
        {deductions || action === "sendSMS" ? "Send" : "Yes"}
      </Button>);
    } else if (paymentMethodId === null || !paymentMethodId || currentVerificationStep === 0) {
      return (<Button
        type="primary"
        className={`${paymentMethodId === null || !paymentMethodId ? "primaryBtnDisabled" : "primaryBtn"}`}
        htmlType="submit"
        onClick={handleNextStep}
        disabled={paymentMethodId === null || !paymentMethodId ? true : false}
      >
        {currentVerificationStep === 0 ? "Next" : "Yes"}
      </Button>);
    } else {
      return (<Button
        type="primary"
        className={`${paymentMethodId === null || !paymentMethodId ? "primaryBtnDisabled" : "primaryBtn"}`}
        htmlType="submit"
        onClick={handleOk}
        disabled={paymentMethodId === null || !paymentMethodId ? true : false}
      >
        {currentVerificationStep === 0 ? "Next" : "Yes"}
      </Button>);
    }
  }
  return (
    <div className="w-full mt-4 flex flex-col gap-2">
      {action === "rerunPay" ?
        <>
          <OnboardSteps steps={paySteps} currentStep={currentVerificationStep} />
          {
            currentVerificationStep === 0 ? <>
              <Form
                form={selectPaymentForm}
                layout="vertical"
                className="flex flex-col gap-8"
                requiredMark={false}
              >
                <Form.Item
                  name="payment_method_id"
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
              : (

                <Heading
                  action={action}
                  paymentPeriod={paymentPeriod}
                  project={project}
                  payment_id={payment_id}
                  payoutData={payoutData}
                  payout={payout}
                />
              )
          }
        </> :
        (
          <Heading
            action={action}
            paymentPeriod={paymentPeriod}
            project={project}
            payment_id={payment_id}
            payoutData={payoutData}
            payout={payout}
          />
        )
      }
      <div className="flex items-center justify-center gap-4">
        <Button
          type="secondary"
          className="secondaryBtn"
          onClick={currentVerificationStep === 1 ? handleBackStep : closeShowModal}
        >
          {deductions || currentVerificationStep === 0 ? "Cancel" : currentVerificationStep === 1 ? "Back " : "No"}
        </Button>
        <Tooltip title={`${deductions || action === "sendSMS" || action === "closePayments" ? "" : paymentMethodId === null || !paymentMethodId ? "You have not select payment method yet, please go back to do so." : ""}`}>
          <ActionButton />
        </Tooltip>
      </div>
    </div >
  );
};

export default ConfirmationContent;

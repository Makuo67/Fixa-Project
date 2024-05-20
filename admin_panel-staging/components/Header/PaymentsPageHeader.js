import { PageHeader } from '@ant-design/pro-layout';
import { useRouter } from "next/router";
import { StyledPaymentsPageHeader } from "./PaymentsPageHeader.styled";
import { InfoIconSvg, smsIconSvg } from "../Icons/CustomIcons";
import { Icon } from "@iconify/react";
import ActionButtons from "./ActionButtons";
import { capitalizeAll } from "../../helpers/capitalize";

const PaymentsPageHeader = (props) => {
  const router = useRouter();

  return (
    <StyledPaymentsPageHeader>
      {props.payout ? (
        <div className="main">
          <div className="header">
            <div>
              <PageHeader
                onBack={() => {
                  // router.back();
                  router.push(`/finance/payments/`)
                }}
                subTitle={props.title}
                // title="Back"
                backIcon={(
                  <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '7px',
                  }}>
                    <Icon icon="material-symbols:arrow-back-rounded" width="25" />
                    <h3 style={{
                      marginTop: '5px'
                    }}>Back</h3>
                  </div>
                )}
              />
            </div>
          </div>
          <div>
            {props.pay ? (
              <ActionButtons
                payout={props.payout}
                handlePaymentDone={props.handlePaymentDone}
                paymentPeriod={props.paymentPeriod}
                project={props.project}
                project_id={props.project_id}
                paymentRun={props.paymentRun}
                payoutStatus={props.payoutStatus}
                handlePayoutPay={props.handlePayoutPay}
                payment_id={props?.payment_id}
                total_workers={props.total_workers}
                amount_to_be_disbursed={props.amount_to_be_disbursed}
                setLoading={props.setLoading}
                payoutData={props.payoutData}
                showPayoutButtons={props.showPayoutButtons}
                loading={props.loading}
                workers={props.workers}
              />
            ) : (
              <></>
            )}
          </div>
        </div>
      ) : (
        <div className="main">
          <div className="header">
            <div>
              <PageHeader
                onBack={() => {
                  router.back();
                }}
                // title="Back"
                subTitle={props.title}
                backIcon={(
                  <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '7px',
                  }}>
                    <Icon icon="material-symbols:arrow-back-rounded" width="25" />
                    <h3 style={{
                      marginTop: '5px'
                    }}>Back</h3>
                  </div>
                )}
              />
            </div>
            <div className="extra-headers">
              <div className="extra-icon">
                {props.hideInfoIcon ? <></> : <InfoIconSvg />}
              </div>
              <div className="extras">
                <p className="extras-item">{capitalizeAll(props.project)}</p>
                <p className="extras-item">{props.paymentHeader}</p>
              </div>
            </div>
          </div>
          <div>
            {props?.pay ? (
              <ActionButtons
                payout={props.payout}
                handlePaymentDone={props.handlePaymentDone}
                paymentPeriod={props.paymentPeriod}
                project={props.project}
                project_id={props.project_id}
                paymentRun={props.paymentRun}
                payoutStatus={props.payoutStatus}
                handlePayoutPay={props.handlePayoutPay}
                payment_id={props?.payment_id}
                total_workers={props.total_workers}
                sms_status={props.sms_status}
                amount_to_be_disbursed={props.amount_to_be_disbursed}
                setLoading={props.setLoading}
                workers={props.workers}
              />
            ) : (
              <></>
            )}
          </div>
        </div>
      )}
    </StyledPaymentsPageHeader>
  );
};

export default PaymentsPageHeader;

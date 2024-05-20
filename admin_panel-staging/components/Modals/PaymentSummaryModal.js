import { Button, Modal, notification } from "antd";
import NumberFormat from "../shared/NumberFormat";
import { StyledConfirmationModal, StyledDeductionsSummary } from "./PaymentsModals/ConfirmationModal.styled";
import { capitalizeAll } from "../../helpers/capitalize";

const PaymentSummaryModal = ({
  payout,
  modalData,
  handleCancel,
  handleOk,
  show,
  paymentsSummary,
}) => {
  return (
    <>
      <StyledConfirmationModal>
        <Modal
          centered
          okText="Yes"
          cancelText="No"
          closeIcon={true}
          open={show}
          onOk={handleOk}
          onCancel={handleCancel}
          bodyStyle={{
            height: "100%"
          }}
          footer={null}
        >
          {!paymentsSummary ?
            (<StyledDeductionsSummary>
              <div className="earnings-container">
                {payout ?
                  modalData?.map((item, idx) => {
                    return parseInt(item.amount) > 0 ? <div className="earnings-item" key={idx}>
                      <div className="label">{`${item.payee_type && capitalizeAll(item.payee_type)}s`}</div>
                      <div className="value"><NumberFormat value={item.amount} /></div>
                    </div> : ""
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
                      {modalData?.deductions_details?.map((item, idx) => {
                        return parseInt(item.amount) > 0 ? <div className="earnings-subitem" key={idx}>
                          <div className="label">{item.name}</div>
                          <div className="value">
                            <NumberFormat value={item.amount} />
                          </div>
                        </div> : ""
                      })}
                    </div>
                    <div className="earnings-item">
                      <div className="label">Total</div>
                      <div className="value"><NumberFormat value={modalData?.worker_earnings + modalData?.total_deductions} /></div>
                    </div>
                  </>
                }
              </div>
            </StyledDeductionsSummary>) : (
              <StyledDeductionsSummary>
                <div className="earnings-container">
                  <div className="earnings-subitem sub-heading-1" key={0}>
                    <div className="label">Total unpaid</div>
                    <div className="value">
                      <NumberFormat value={modalData?.total_unpaid} /> Rwf
                    </div>
                  </div>
                  <div className="earnings-subitem sub-heading-1" key={0}>
                    <div className="label">Total open</div>
                    <div className="value">
                      <NumberFormat value={modalData?.total_open} /> Rwf
                    </div>
                  </div>
                  <div className="earnings-subitem sub-heading-1" key={0}>
                    <div className="label">Total closed</div>
                    <div className="value">
                      <NumberFormat value={modalData?.total_closed} /> Rwf
                    </div>
                  </div>
                  <div className="earnings-subitem sub-heading-1" key={0}>
                    <div className="label">Total claim</div>
                    <div className="value">
                      <NumberFormat value={modalData?.total_claim} /> Rwf
                    </div>
                  </div>
                  <div className="earnings-subitem heading-1">
                    <div className="label !text-2xl">Total</div>
                    <div className="value !text-2xl"><NumberFormat value={modalData?.total} /> Rwf</div>
                  </div>
                </div>
              </StyledDeductionsSummary>
            )
          }

        </Modal>

      </StyledConfirmationModal>
    </>
  );
};
export default PaymentSummaryModal;

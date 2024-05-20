import { Icon } from "@iconify/react";
import { Button, Modal, notification, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import moment from "moment";
import { useEffect, useState } from "react";
import EditPayrollShiftsModal from "../Modals/PaymentsModals/EditPayrollShiftsModal";
import EditDeductionsModal from "../Modals/PaymentsModals/EditDeductionsModal";
import { StyledExpandedPayment } from "../Tables/PayrollTable.styled";
import {
  getWorkerDeductions,
  removeWorkerFromPayroll,
} from "../../helpers/payments/payroll/payroll";
import { getPayrollTransactionDetails } from "../../helpers/payments/payroll/payroll";
import { getPaymentData } from "../../helpers/auth";
import { toMoney } from "@/helpers/excelRegister";
import { useUserAccess } from "../Layouts/DashboardLayout/AuthProvider";
import { accessSubpageEntityRetrieval } from "@/utils/accessLevels";

const ExpandedPayroll = (props) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editShiftsModal, setEditShiftsModal] = useState(false);
  const [workerDeductions, setWorkerDeductions] = useState([]);
  const [deductionsTypes, setDeductionsTypes] = useState([]);
  const [deductionDate, setDeDuctionDate] = useState(null);
  const [shifts_details, setShifts_details] = useState([]);
  const [transactionDetails, setTransactionDetails] = useState([]);
  const [payrollExpanded, setPayrollExpanded] = useState(true);
  const [projectId, setProjectId] = useState(null);
  const [paymentsData, setPaymentsData] = useState({})
  const [editDeductionAccess, setEditDeductionAccess] = useState(false)

  const { userProfile } = useUserAccess();

  useEffect(() => {
    getWorkerDeductions(props?.data.id).then((res) => {
      setWorkerDeductions(res?.workers_deductions);
      setDeductionsTypes(res?.deduction_types);
    });
    getPaymentData().then((res) => {
      setProjectId(res?.project_id);
      setDeDuctionDate(res?.end_date);
    });
  }, []);

  useEffect(() => {
    // Check the access changes
    if (userProfile) {
      setEditDeductionAccess(userProfile && accessSubpageEntityRetrieval(userProfile?.user_access, 'finance', 'payment', 'edit deduction'))
    }
  }, [userProfile]);

  useEffect(() => {
    if (props?.payrollTableExpanded) {
      getPayrollTransactionDetails(props.data?.id).then((res) => {
        setShifts_details(res?.shifts);
        setTransactionDetails(res?.payroll_transaction_tracks);
        setTimeout(() => {
          setPayrollExpanded(false);
        }, 1000);
      });
    }
    getPaymentData().then(res => {
      setPaymentsData(res)
    })
    // props.changeExpandedState();
  }, [props?.payrollTableExpanded]);

  const handleOk = () => {
    // console.log("Handle ok with props", string);
    setModalOpen(false);
  };
  const handleShowDeductionsModal = () => {
    setModalOpen(true);
  };
  const handleClose = () => {
    // console.log("Handle close with props");
    setModalOpen(false);
  };

  const showShiftEditor = () => {
    setEditShiftsModal(true);
  };
  const closeShiftEditor = () => {
    setEditShiftsModal(false);
  };
  const handleDeletWorker = () => {
    removeWorkerFromPayroll(props.data.id).then(() => {
      notification.success({
        message: "Success",
        description: `Worker removed from payroll`,
      });
      props.loadPayrollInfo();
    });
  };

  const antIcon = (
    <LoadingOutlined
      style={{
        fontSize: 24,
        color:
          props.data.status == "failed"
            ? "#F5222D"
            : props.data.status == "successful"
              ? "#52C41A"
              : "",
      }}
      spin
    />
  );

  return (
    <StyledExpandedPayment isPayroll={true}>
      <>
        <EditDeductionsModal
          modalOpen={modalOpen}
          handleOk={handleOk}
          handleClose={handleClose}
          workerDeductions={workerDeductions}
          deductionsTypes={deductionsTypes}
          deductionDate={deductionDate}
          assignedWorkerId={props.data.assigned_worker_id}
          payrollTransactionId={props.data.id}
          setLoading={props.setLoading}
          takeHome={props.data.take_home}
          projectId={projectId}
        />
        {props.status == "unpaid" ? (
          <div className="expanded">
            <div className="upper">
              <div className="innerUnpaid-1">
                {props.payrollEdit && paymentsData?.status !== "closed" && editDeductionAccess ? <span className="title flex gap-2 items-center" onClick={handleShowDeductionsModal}>
                  Deductions{" "}
                  <Icon icon="lucide:edit" color="#fa8c16" className="edit" />
                </span> : <span className="title" >
                  Deductions
                </span>}
                {payrollExpanded ? (
                  <Spin indicator={antIcon} />
                ) : (
                  <>
                    {workerDeductions.length > 0 ? (
                      <div className="innerUnpaid-1-1">
                        {workerDeductions.map((item, index) => (
                          <div className="innerUnpaid-1-1-1" key={index}>
                            <span className="title">{item.title}</span>
                            <span className="value">
                              {toMoney(item.deduction_amount)} Rwf
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="value">No deductions</span>
                    )}
                  </>
                )}
              </div>
              <div className="innerUnpaid-2">
                <span className="title flex gap-2 items-center">
                  Shifts{" "}
                  {props.payrollEdit && props.stastus === "unpaid" && <Icon
                    icon="lucide:edit"
                    color="#fa8c16"
                    className="edit"
                    onClick={showShiftEditor}
                  />}
                  <EditPayrollShiftsModal
                    editModal={editShiftsModal}
                    closeShiftEditor={closeShiftEditor}
                    userData={props?.data}
                    project_id={props?.project_id}
                    changeExpandedState={props.changeExpandedState}
                    setLoading={props.setLoading}
                    startDate={props.startDate}
                    endDate={props.endDate}
                    loadPayrollInfo={props.loadPayrollInfo}
                  />
                </span>
                {payrollExpanded ? (
                  <Spin indicator={antIcon} />
                ) : (
                  <>
                    {shifts_details?.length > 0 ? (
                      <div className="innerUnpaid-1-1">
                        {shifts_details.map((shift, index) => (
                          <div key={index} className="innerUnpaid-1-1-1">
                            <span className="value">{shift?.service_name}</span>
                            <span className="title">
                              {shift?.shifts} Shifts
                            </span>
                            <span className="title">
                              {toMoney(shift?.rate)} Rwf / Shift
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="value">No Shifts</span>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="unpaidButtons">
              {props.payrollEdit && <Button className="delete" onClick={handleDeletWorker} type="secondary">
                <Icon
                  icon="material-symbols:delete-outline-rounded"
                  color="#f5222d"
                />
                Delete
              </Button>}
            </div>
          </div>
        ) : props.status == "successful" ? (
          <div className="expanded">
            <div className="upper">
              <div className="innerUnpaid-3">
                <span className="title">Deductions</span>
                {payrollExpanded ? (
                  <Spin indicator={antIcon} />
                ) : (
                  <>
                    {workerDeductions.length > 0 ? (
                      <div className="innerUnpaid-2-2">
                        {workerDeductions.map((item, index) => (
                          <div key={index} className="innerUnpaid-2-2-2">
                            <span className="title">{item.title}</span>
                            <span className="value">
                              {item.deduction_amount} Rwf
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="value">No deductions</span>
                    )}
                  </>
                )}
              </div>
              <div className="innerUnpaid-3">
                <span className="title">Shifts</span>
                {payrollExpanded ? (
                  <Spin indicator={antIcon} />
                ) : (
                  <div className="innerUnpaid-2-2">
                    {shifts_details.map((shift, index) => (
                      <div key={index} className="innerUnpaid-2-2-2">
                        <span className="title">{shift?.service_name}</span>
                        <span className="title">{shift?.shifts} Shifts</span>
                        <span className="value">{shift?.rate} Rwf / Shift</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="innerUnpaid-3">
                <span className="title">Transaction Details</span>
                {payrollExpanded ? (
                  <Spin indicator={antIcon} />
                ) : (
                  <div className="innerUnpaid-2-2">
                    {
                      <div className="innerUnpaid-2-2-2">
                        <span className="title">Refereence No.</span>
                        <span className="value">
                          {transactionDetails?.reference_id}
                        </span>
                      </div>
                    }
                    <div className="innerUnpaid-2-2-2">
                      <span className="title">Time</span>
                      <span className="value">
                        {moment(transactionDetails?.payed_time).format(
                          "DD/MM/YYYY hh:mm A"
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="innerUnpaid-3">
                <span className="title">Transaction Message</span>
                {payrollExpanded ? (
                  <Spin indicator={antIcon} />
                ) : (
                  <span className="valued">{transactionDetails?.momo_msg}</span>
                )}
              </div>
            </div>
          </div>
        ) : props.status == "failed" || props.status == "error" || props.status == "pending" ? (
          <div className="upper">
            <div className="innerUnpaid-3">
              <span className="title">Deductions</span>
              {payrollExpanded ? (
                <Spin indicator={antIcon} />
              ) : (
                <>
                  {workerDeductions.length > 0 ? (
                    <div className="innerUnpaid-2-2">
                      {workerDeductions.map((item, index) => (
                        <div key={index} className="innerUnpaid-2-2-2">
                          <span className="title">{item?.title}</span>
                          <span className="value">
                            {item?.deduction_amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="value">No deductions</span>
                  )}
                </>
              )}
            </div>
            <div className="innerUnpaid-3">
              <span className="title">Shifts</span>
              {payrollExpanded ? (
                <Spin indicator={antIcon} />
              ) : (
                <div className="innerUnpaid-2-2">
                  {shifts_details?.map((item, index) => (
                    <div key={index} className="innerUnpaid-2-2-2">
                      <span className="title">{item?.service_name}</span>
                      <span className="title">{item?.shifts} Shifts</span>
                      <span className="value">{item?.rate} Rwf/ Shift</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="innerUnpaid-3">
              <span className="title">Transaction Details</span>
              {payrollExpanded ? (
                <Spin indicator={antIcon} />
              ) : (
                <div className="innerUnpaid-2-2">
                  <div className="innerUnpaid-2-2-2">
                    <span className="title">Refereence No.</span>
                    <span className="value">
                      {transactionDetails?.reference_id}
                    </span>
                  </div>
                  <div className="innerUnpaid-2-2-2">
                    <span className="title">Time</span>
                    <span className="value">
                      {moment(transactionDetails?.payed_time).format(
                        "DD/MM/YYYY hh:mm A"
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="innerUnpaid-3">
              <span className="title">Transaction Message</span>
              {payrollExpanded ? (
                <Spin indicator={antIcon} />
              ) : (
                <span className="valued">{transactionDetails?.momo_msg}</span>
              )}
            </div>
          </div>
        ) : (
          ""
        )}
      </>
    </StyledExpandedPayment>
  );
};
export default ExpandedPayroll;

import { Icon } from "@iconify/react";
import { Button, Modal, notification, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import moment from "moment";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toMoney } from "../../helpers/excelRegister";
import {
  deletePayment,
  getPaymentDetails,
} from "../../helpers/payments/payments_home";
import { StyledExpandedPayment } from "../Tables/PayrollTable.styled";
import { retriveAuthTokenFromLocalStorage, storePaymentData } from "../../helpers/auth";
import DeductionsDetailsModal from "../Modals/PaymentsModals/DeductionsDetailsModal";
import claimsIcon from "../../assets/svgs/claims.svg";
import deleteIcon from "../../assets/svgs/delete.svg";
import { useAppContext } from "../../context/paymentsContext";
import ClaimIcon from '../../public/claimIcon.svg';
import PaymentModals from "../Modals/PaymentModals";
import Image from "next/image";
import { getDeductionSummary } from "../../helpers/deduction/deduction";
import Confirm from "../Projects/Modals/Invoice/confirmation";
import localforage from "localforage";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import { accessSubpageEntityRetrieval } from "@/utils/accessLevels";

const ExpandedPayment = ({ status, data, setLoading, paymentsEdit }) => {
  const [expandedData, setExpandedData] = useState();
  const [showModal, setShowModal] = useState(false);
  const [showDeductionsModal, setShowDeductionsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deductionsDetails, setDeductionsDetails] = useState([]);

  const [isDeleted, setIsDeleted] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimModalTitle, setClaimModalTitle] = useState("");
  const [claimModalType, setClaimModalType] = useState("");
  const paymentInfo = useAppContext();
  const router = useRouter();
  const query = router.query;

  const { setCompanyStatusLoading, userProfile } = useUserAccess();

  const handleViewPaymentDetails = async () => {
    localforage.setItem("claim_project", data.project_id);
    const start_date = data.start_date;
    const end_date = data.end_date;
    const project = data.project_name;
    const payment_type_name = data.payment_type_name;
    const status = data.status;
    const payroll_id = data.id;
    if (payment_type_name == "payroll") {
      await storePaymentData({
        project,
        project_id: data.project_id,
        status,
        start_date,
        end_date,
        payroll_id,
        payment: payment_type_name,
        paymentType: "Payroll",
      });
      router.push({
        pathname: `/finance/payments/${payroll_id}`,
        query: { ...router.query },
      });
    } else {
      const payment = data.title;
      const payout_id = data.id;
      await storePaymentData({
        payment,
        payout_id,
        paymentType: "Payout",
      });
      router.push(`/finance/payments/${payroll_id}`);
    }
  };

  const onDeleteOk = () => {
    setShowModal(false);
    deletePayment(data.id)
      .then((response) => {
        setLoading(true);
        // setCompanyStatusLoading(true)
        notification.success({
          message: "Success",
          description: response.data,
        });
        // setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        notification.error({
          message: "Failed",
          description: error.message,
        });
      });
  };

  const handleDeletePayment = async () => {
    setShowModal(true);
  };

  const hideModal = () => {
    setShowModal(false);
  };

  const handleShowModal = () => {
    setShowDeductionsModal(true);
  };

  const CancelDeductionsModal = () => {
    setShowDeductionsModal(false);
  };

  useEffect(() => {
    getPaymentDetails(data.id).then((response) => {
      setExpandedData(response);
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    });

    getDeductionSummary(data.id).then((response) => {
      setDeductionsDetails(response?.data);
    })
  }, [query, data.id]);

  const antIcon = (
    <LoadingOutlined
      style={{
        fontSize: 24,
        color:
          data.status == "open"
            ? "#FA8C16"
            : data.status == "closed"
              ? "#52C41A"
              : "",
      }}
      spin
    />
  );

  // claims
  const handleClaimModal = () => {
    localforage.setItem("claim_project", data.project_id);
    if (showClaimModal) {
      setShowClaimModal(false);
    } else {
      setClaimModalTitle("New Claims");
      setClaimModalType("claims");
      setShowClaimModal(true);
    }
  }
  const handleViewClaim = () => {
    if (showClaimModal) {
      setShowClaimModal(false);
    } else {
      setClaimModalTitle("Claims");
      setClaimModalType("claims_table");
      setShowClaimModal(true);
    }
  }

  return (
    <StyledExpandedPayment>
      <>
        <Confirm
          openConfirmModal={showModal}
          closeConfirm={hideModal}
          message={`Are you sure you want to delete this payment?`}
          buttonText={`Yes`}
          cancelText={`No`}
          handleOk={onDeleteOk}
        />
        <DeductionsDetailsModal
          title={<h3>Deductions Details</h3>}
          showModal={showDeductionsModal}
          handleCancel={CancelDeductionsModal}
          data={data}
          deductionsDetails={deductionsDetails}
        />
        {status == "unpaid" ? (
          <div className="expanded">
            <div className="upper">
              <div className="innerUnpaid-1">
                {data?.payment_type_name == "payroll" ? <span className="title">Total Deductions</span>
                  : <span className="title">Total To be Disbursed</span>}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <span className="value">
                    {isLoading ? (
                      <Spin indicator={antIcon} />
                    ) :
                      data?.payment_type_name == "payroll" ?
                        toMoney(parseInt(deductionsDetails?.total_external_deduction)
                          + parseInt(deductionsDetails?.total_internal_deduction))
                        : toMoney(expandedData?.total_to_be_disbursed)
                    }
                  </span>
                  {data.payment_type_name == "payroll" && <span style={{
                    color: "#00a1de",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                    onClick={handleShowModal}
                  >Details</span>}
                </div>
              </div>
              <div className="innerUnpaid-2">
                {isLoading ? (
                  <Spin indicator={antIcon} />
                ) : (
                  <>
                    <span className="title">Created By</span>
                    <span className="value">{expandedData?.done_by_name}</span>
                    <span className="title">{`${moment(
                      expandedData?.done_at
                    ).format("DD/MM/YYYY h:mm A")}`}</span>
                  </>
                )}
              </div>
            </div>
            <div className="unpaidButtons">
              <Button
                type="secondary"
                className="view"
                onClick={() => handleViewPaymentDetails()}
              >
                <Icon icon="ic:baseline-format-list-bulleted" color="#00a1de" />
                View list
              </Button>
              {paymentsEdit ? <Button type="secondary" className="delete" onClick={() => handleDeletePayment()}>
                <Image
                  src={deleteIcon}
                  alt={"Close Icon"}
                  priority
                />
                <span>Delete</span>
              </Button> : ""}
            </div>
          </div>
        ) : status == "open" ? (
          <div className="expanded">
            <div className="upper">
              {data.payment_type_name == "payout" && (
                <div className="innerUnpaid-1">
                  <span className="title">Description</span>
                  <span className="valued">{data?.description}</span>
                </div>
              )}
              <div className="innerUnpaid-1">
                {data?.payment_type_name == "payroll" ? <span className="title">Total Deductions</span>
                  : <span className="title">Total To be Disbursed</span>}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <span className="value">
                    {isLoading ? (
                      <Spin indicator={antIcon} />
                    ) : data?.payment_type_name == "payroll" ?
                      toMoney(parseInt(deductionsDetails?.total_external_deduction)
                        + parseInt(deductionsDetails?.total_internal_deduction))
                      : toMoney(expandedData?.total_to_be_disbursed)
                    }
                  </span>
                  {data.payment_type_name == "payroll" && <span style={{
                    color: "#00a1de",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                    onClick={handleShowModal}
                  >Details</span>}
                </div>
              </div>
              <div className="innerUnpaid-1">
                <span className="title">Successful / Failed</span>
                {isLoading ? (
                  <Spin indicator={antIcon} />
                ) : (
                  <span className="value">
                    <span>{expandedData?.paid_transactions}</span>
                    <span>/</span>
                    <span>{expandedData?.failed_transactions}</span>
                  </span>
                )}
              </div>
              <div className="innerUnpaid-2">
                <span className="title">Created By</span>
                {isLoading ? (
                  <Spin indicator={antIcon} />
                ) : (
                  <>
                    <span className="value">{expandedData?.done_by_name}</span>
                    <span className="title">{`${moment(
                      expandedData?.done_at
                    ).format("DD/MM/YYYY h:mm A")}`}</span>
                  </>
                )}
              </div>
            </div>
            <div className="unpaidButtons">
              {/* ==== ClAIMS Buttons ==== */}
              {userProfile && accessSubpageEntityRetrieval(userProfile?.user_access, 'finance', 'payment', 'add claim')
                && (
                  <Button
                    className="view claims"
                    onClick={handleClaimModal}
                  >
                    <Image src={ClaimIcon} width={15} height={15} alt="Claims icon" />
                    Add Claims
                  </Button>
                )}
              {data?.has_claim === true && (
                <Button
                  className="view claims"
                  onClick={handleViewClaim}
                >
                  <Image src={ClaimIcon} width={15} height={15} alt="Claims icon" />
                  View Claims
                </Button>
              )}
              {/* ====END ClAIMS Buttons ==== */}
              <Button
                type="secondary"
                className="view"
                onClick={() => handleViewPaymentDetails()}
              >
                <Icon icon="ic:baseline-format-list-bulleted" color="#00a1de" />
                View list
              </Button>
            </div>
          </div>
        ) : (
          <div className="expanded">
            <div className="upper">
              {data.payment_type == "Payout" && (
                <div className="innerUnpaid-1">
                  <span className="title">Description</span>
                  <span className="valued">{data?.description}</span>
                </div>
              )}
              <div className="innerUnpaid-1">
                {data?.payment_type_name == "payroll" ? <span className="title">Total Deductions</span>
                  : <span className="title">Total To be Disbursed</span>}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <span className="value">
                    {isLoading ? (
                      <Spin indicator={antIcon} />
                    ) : (
                      toMoney(expandedData?.total_to_be_disbursed)
                    )}
                  </span>
                  {data.payment_type_name == "payroll" && <span style={{
                    color: "#00a1de",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                    onClick={handleShowModal}
                  >Details</span>}
                </div>
              </div>
              <div className="innerUnpaid-1">
                <span className="title">Successful / Failed</span>
                {isLoading ? (
                  <Spin indicator={antIcon} />
                ) : (
                  <span className="value">
                    <span>{expandedData?.paid_transactions}</span>
                    <span>/</span>
                    <span>{expandedData?.failed_transactions}</span>
                  </span>
                )}
              </div>
              <div className="innerUnpaid-2">
                <span className="title">Created By</span>
                {isLoading ? (
                  <Spin indicator={antIcon} />
                ) : (
                  <>
                    <span className="value">{expandedData?.done_by_name}</span>
                    <span className="title">{`${moment(
                      expandedData?.done_at
                    ).format("DD/MM/YYYY h:mm A")}`}</span>
                  </>
                )}
              </div>
            </div>
            <div className="unpaidButtons">
              {/* ==== ClAIMS Buttons ==== */}
              {userProfile && accessSubpageEntityRetrieval(userProfile?.user_access, 'finance', 'payment', 'add claim')
                && (
                  <Button
                    className="view claims"
                    onClick={handleClaimModal}
                  >
                    <Image src={ClaimIcon} width={15} height={15} alt="Claims icon" />
                    Add Claims
                  </Button>
                )}
              {data?.has_claim === true && (
                <Button
                  className="view claims"
                  onClick={handleViewClaim}
                >
                  <Image src={ClaimIcon} width={15} height={15} alt="Claims icon" />
                  View Claims
                </Button>
              )}
              {/* ====END ClAIMS Buttons ==== */}
              <Button
                type="secondary"
                className="view"
                onClick={() => handleViewPaymentDetails()}
              >
                <Icon icon="ic:baseline-format-list-bulleted" color="#00a1de" />
                View list
              </Button>
            </div>
          </div>
        )}
      </>
      <PaymentModals show={showClaimModal} handleCancel={handleClaimModal} type={claimModalType} title={claimModalTitle} data={data} />
    </StyledExpandedPayment>
  );
};
export default ExpandedPayment;

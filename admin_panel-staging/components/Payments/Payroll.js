import { Input, Progress } from "antd";
import { useRouter } from "next/router";
// import Pusher from "pusher-js";
import { usePusher } from "../../context/PusherContext";
import { useEffect, useState, useContext } from "react";
import { toMoney } from "../../helpers/excelRegister";
import {
  getPayroll,
  getPayrollStatus,
  getPayrollSearchList,
  searchPayrollList,
  getPayrollDeductionDetails,
} from "../../helpers/payments/payroll/payroll";
import ExportButtons from "../Buttons/ExportButtons";
import PayrollTableColumns from "../Columns/PayrollTableColumns";
import PayrollFilters from "../Filters/PayrollFilters";
import PaymentsPageHeader from "../Header/PaymentsPageHeader";
import Stats, { StyledStatsContainer } from "../Stats/Stats";
import DynamicTable from "../Tables/DynamicTable";
import { StyledPayment } from "../Tables/PayrollTable.styled";
import { SearchOutlined } from "@ant-design/icons";
import { getPaymentData } from "../../helpers/auth";
import localforage from "localforage";
import PaymentSummaryModal from "../Modals/PaymentSummaryModal";
import { useUserAccess } from "../Layouts/DashboardLayout/AuthProvider";
import DeductionsDetailsModal from "../Modals/PaymentsModals/DeductionsDetailsModal";
import { getDeductionSummary, getNetAmountDetails } from "@/helpers/deduction/deduction";
import NetAmount from "../Modals/PaymentsModals/NetAmountModal";
import { accessSubpageEntityRetrieval } from "@/utils/accessLevels";
import PayrollStats from "./PayrollStats";
const pusher_env = process.env.NEXT_PUBLIC_PUSHER_ENV;
// import { SocketContext } from "../../context/socketContext";

const SearchField = ({ query, handleSearch }) => {
  return (
    <Input
      size="middle"
      style={{ width: "350px", borderRadius: "6px" }}
      placeholder="Search Name, M.M. Account"
      prefix={<SearchOutlined style={{ color: "#A8BEC5" }} />}
      onChange={(e) => handleSearch(e.target.value)}
      value={query}
      name="search"
      allowClear
    />
  );
};

const Payroll = (props) => {
  const pusher = usePusher();
  // const socket = useContext(SocketContext)
  const [showDeductionsModal, setShowDeductionsModal] = useState(false);
  const [showNetAmountModal, setShowNetAmountModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [paymentRun, setPaymentRun] = useState(false);
  const [worker_deleted, setWorker_deleted] = useState(false);
  const [payrollData, setPayrollData] = useState([]);
  const [payrollTableExpanded, setPayrollTableExpanded] = useState(true);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [status, setStatus] = useState("");
  const [payroll_id, setpayroll_id] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [projectName, setProjectName] = useState("");
  const [transaction_percentage, setTransaction_percentage] = useState(0);
  const [workers, setWorkers] = useState([]);
  const [showPayingText, setshowPayingText] = useState(false);
  const [amount_to_be_disbursed, setAmount_to_be_disbursed] = useState(0);
  const [payrollAggregates, setPayrollAggregates] = useState([]);
  const [projectId, setProjectId] = useState(null);
  const [deductionsDetails, setDeductionsDetails] = useState([]);
  const [netAmountData, setNetAmountData] = useState([]);
  const [showSummaryModalloading, setShowSummaryModalloading] = useState(true);
  const [showNetAmountModalloading, setShowNetAmountModalloading] = useState(true);

  const router = useRouter();
  const { userProfile } = useUserAccess();

  const queri = router.query;
  delete queri["project_id"];
  delete queri["payment_types_id"];
  delete queri["start_date_gte"];
  delete queri["end_date_lte"];
  delete queri["total_amount_gte"];
  delete queri["total_amount_lte"];
  queri._start = 0;
  queri._limit = -1;

  const fetchPayrollStatus = async (payroll_id) => {
    getPayrollSearchList(payroll_id);
    const payrollStatus = await getPayrollStatus(payroll_id);

    if (payrollStatus && payrollStatus?.status === "closed") {
      handlePaymentDone();
    }
  }

  const fetchPayrollData = async (payroll_id) => {
    try {
      const id = payroll_id;
      const payroll = await getPayroll(id, queri);

      if (payroll && payroll[0]) {
        const { workers, header } = payroll[0];
        const { paid_transactions, failed_transactions, totalWorkers, totalEarnings } = header ?? {};

        const aggregates = {
          failed: failed_transactions ?? 0,
          successful: paid_transactions ?? 0,
        };

        setPayrollData(payroll[0]);
        setWorkers(workers);
        setPayrollAggregates(aggregates);
        setTransaction_percentage((paid_transactions / (totalWorkers ?? 1)) * 100);
        setAmount_to_be_disbursed(totalEarnings ?? 0);
        setLoading(false);
      }
    } catch (error) {
      // Handle error
      console.error(error);
    }
  };


  useEffect(() => {
    const fetchPaymentData = async () => {
      const { payroll_id: id, status, start_date, end_date, project: projectName, project_id: projectId } = await getPaymentData();
      setProjectId(projectId);
      setStatus(status);
      setpayroll_id(id);
      setStartDate(start_date);
      setEndDate(end_date);
      setProjectName(projectName);
    };
    fetchPaymentData();
  }, [])

  useEffect(() => {
    if (payroll_id) {
      fetchPayrollStatus(payroll_id);
      fetchPayrollData(payroll_id);
    }

  }, [payroll_id, loading, worker_deleted, queri]);

  useEffect(() => {
    if (payroll_id && router.isReady) {
      let channel = pusher.subscribe(
        `transaction-status-${pusher_env}-${payroll_id}`
      );

      channel.bind(
        `transaction-status-${pusher_env}-${payroll_id}-event`,
        function (data) {
          // console.log("--pusher", data);

          handleStatusChange(
            data.entity_id.toString(),
            data?.status,
            workers,
            payrollAggregates
          );
        }
      );

      return () => {
        pusher.unsubscribe();
      };
    }
  }, [router.isReady, payroll_id, workers, payrollAggregates, pusher]);

  useEffect(() => {
    if (showNetAmountModal) {
      fetchNetAmountDetails();
    }
    if (showDeductionsModal) {
      fetchDeductionSummary();
    }
  }, [showNetAmountModal, showDeductionsModal]);


  const changeExpandedState = (payrollTableExpanded) => {
    setPayrollTableExpanded(!payrollTableExpanded);
  };

  const loadPayrollInfo = () => {
    setLoading(true);
    setWorker_deleted(true);
  };

  const handlePaymentDone = () => {
    // Defines if the payment is done or not
    setPaymentRun(true);
  };

  const handleStatusChange = (payee_id, status, workers, payrollAggregates) => {
    let updatedPayrollData = workers.map((obj) => {
      if (obj.id.toString() === payee_id) {
        return { ...obj, status }; // Update the status of payee
      } else {
        return obj; // Return the original object if it doesn't have id
      }
    });
    // console.log("--payroll data", updatedPayrollData);
    let successful_num = updatedPayrollData.filter(
      (item) => item.status === "successful"
    );
    let successful_amount = successful_num.reduce((sum, item) => {
      return sum + parseInt(item.amount);
    }, 0);

    let failed_num = updatedPayrollData.filter(
      (item) => item.status === "failed"
    );

    let aggregates = {
      failed: failed_num.length,
      successful: successful_num.length,
    };

    setWorkers(updatedPayrollData);
    setPayrollAggregates(aggregates);
  };

  const fetchNetAmountDetails = () => {
    getNetAmountDetails(payroll_id)
      .then(response => {
        setNetAmountData(response.data)
        setShowNetAmountModalloading(false)
      });
  };

  const fetchDeductionSummary = () => {
    getDeductionSummary(payroll_id)
      .then(response => {
        setDeductionsDetails(response.data)
        setShowSummaryModalloading(false)
      });
  };

  const handleSearch = (value) => {
    if (value.length >= 1) {
      // setCurrentPage(0);
      setQuery(value);
      setQuery(value);
      searchPayrollList(value).then((res) => {
        setWorkers(res);
        setIsSearching(true);
      });
    } else {
      setQuery(value);
      setIsSearching(false);
      setTimeout(() => {
        setLoading(true);
      }, 1000);
    }
  };


  const handleTableChange = (pagination) => {
    // console.log("pagination", pagination);
  };

  return (
    <>
      {status == "unpaid" || status == "open" ? (
        <PaymentsPageHeader
          title={`Payroll #${payroll_id}`}
          project={projectName}
          project_id={projectId}
          paymentPeriod={`${startDate} to ${endDate}`}
          paymentHeader={`${startDate} - ${endDate}`}
          pay={true}
          handlePaymentDone={handlePaymentDone}
          paymentRun={paymentRun}
          hideInfoIcon={true}
          payoutStatus={status}
          payment_id={payroll_id}
          total_workers={payrollData?.header?.total_workers}
          amount_to_be_disbursed={amount_to_be_disbursed}
          sms_status={payrollData?.sms_status}
          setLoading={setLoading}
          setshowPayingText={setshowPayingText}
          workers={workers}
        />
      ) : (
        <div>
          <PaymentsPageHeader
            title={`Payroll  #${payroll_id}`}
            project={projectName}
            project_id={projectId}
            paymentPeriod={`${startDate} to ${endDate}`}
            paymentHeader={`${startDate} - ${endDate}`}
            hideInfoIcon={true}
            total_workers={payrollData?.header?.total_workers}
            amount_to_be_disbursed={toMoney(payrollData?.header?.total_amount)}
          />
        </div>
      )}
      {paymentRun ? (
        <div style={{ marginTop: "10px", marginBottom: "30px" }}>
          <>
            {showPayingText ? (
              <p
                style={{
                  fontFamily: "Circular Std",
                  fontStyle: "normal",
                  fontWeight: "500",
                  fontSize: "16px",
                  color: "#414A52",
                }}
              >
                Paying {payrollData?.header?.total_workers} workers
              </p>
            ) : (
              <>
                {" "}
                <div style={{ display: "flex" }}>
                  <p
                    style={{
                      background: "#D9F7BE",
                      padding: "4px 10px",
                      borderRadius: "5px",
                      color: "#389E0D",
                      fontSize: "14px",
                      fontWeight: "500px",
                    }}
                  >
                    {payrollAggregates?.successful} Successful
                  </p>
                  <p
                    style={{
                      background: "#FFDCDC",
                      padding: "4px 10px",
                      borderRadius: "5px",
                      color: "#FF0000",
                      fontSize: "14px",
                      fontWeight: "500px",
                      marginLeft: "10px",
                    }}
                  >
                    {payrollAggregates?.failed} Failed
                  </p>
                </div>
              </>
            )}
          </>

          <Progress
            percent={parseInt(transaction_percentage)}
            strokeColor="#389e0d"
            status="active"
          />
        </div>
      ) : (
        <></>
      )}

      <PayrollFilters
        setReload={setLoading}
        isExpandable
        showAdvancedFilters
        hasPagination
        filter_fields={[
          "project_id",
          "status",
          "service_name",
          "take_home",
          "total_deductions",
          "is_payment_method"
        ]}
      />

      <StyledStatsContainer className="!mb-6">
        <PayrollStats
          paymentRun={paymentRun}
          loading={loading}
          payment_id={payroll_id}
          payrollAggregates={payrollAggregates}
          payrollDataHeader={payrollData?.header}
          setShowDeductionsModal={setShowDeductionsModal}
          setShowNetAmountModal={setShowNetAmountModal} />
      </StyledStatsContainer>

      <StyledPayment>
        <DynamicTable
          rowKey={`id`}
          columns={PayrollTableColumns}
          data={workers}
          expandable={workers}
          payrollTableExpanded={payrollTableExpanded}
          expandState={true}
          changeExpandedState={changeExpandedState}
          project_id={payrollData?.project_id}
          loadPayrollInfo={loadPayrollInfo}
          startDate={startDate}
          endDate={endDate}
          extra_left={[
            <SearchField key={0} handleSearch={handleSearch} query={query} />,
          ]}
          extra_right={[
            <ExportButtons
              key={0}
              loading={loading}
              data={payrollData?.workers}
              isPayroll={true}
              setLoading={setLoading}
            />,
          ]}
          isPayroll={true}
          payrollEdit={userProfile && accessSubpageEntityRetrieval(userProfile?.user_access, 'finance', 'payment', 'delete worker in payment')}
          loading={loading}
          setLoading={setLoading}
          pagination={{
            total: payrollData?.workers?.length,
          }}
          onChange={(value) => handleTableChange(value)}
        />
      </StyledPayment>
      <DeductionsDetailsModal
        showSummaryModalloading={showSummaryModalloading}
        title={<h3>Deductions Details</h3>}
        showModal={showDeductionsModal}
        handleCancel={() => setShowDeductionsModal(false)}
        // data={data}
        payrollId={payroll_id}
        payrollType={"Payroll"}
        deductionsDetails={deductionsDetails}
      />
      <NetAmount
        showNetAmountModalloading={showNetAmountModalloading}
        title={<h3>Net amount to be disbursed</h3>}
        showModal={showNetAmountModal}
        handleCancel={() => setShowNetAmountModal(false)}
        data={netAmountData}
      />
      {/* <PaymentSummaryModal
        payout={false}
        modalData={modalDeductionsData}
        handleCancel={() => setShowDeductionsModal(false)}
        handleOk={() => setShowDeductionsModal(false)}
        show={showDeductionsModal}
      /> */}
    </>
  );
};

export default Payroll;

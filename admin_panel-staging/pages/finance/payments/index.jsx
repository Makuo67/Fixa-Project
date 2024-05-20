import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import Layout from "../../../components/Layouts/DashboardLayout/Layout";
import DynamicTable from "../../../components/Tables/DynamicTable";
import {
  ExportButtons,
  PaymentsTableColumns,
  NewPaymentButton,
} from "../../../components";
import { StyledPayment } from '@/components/Tables/PayrollTable.styled';
import PaymentsFilters from "@/components/Filters/PaymentsFilters";
import Stats, {
  StyledPaymentTitle,
  StyledStatsContainer,
} from "@/components/Stats/Stats";
import { getAllPayments } from "@/helpers/payments/payments_home";
import { toMoney } from "@/helpers/excelRegister";
import { clearPaymentData } from "@/helpers/auth";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import RenderLoader from "@/components/Loaders/renderLoader";
import { PaymentsEmptyOnboarding } from "@/components/Sections/PaymentsEmptyOnboarding";
import ErrorComponent from "@/components/Error/Error";
import { accessRouteRetrieval, accessSubpageEntityRetrieval } from "@/utils/accessLevels";
import PaymentSummaryModal from "@/components/Modals/PaymentSummaryModal";
import objectToQuery from "@/components/Filters/helpers";

export default function Payments() {
  const [loading, setLoading] = useState(true);
  const [paymentsAggregates, setPaymentsAggregates] = useState();
  const [allPayments, setAllPayments] = useState([]);
  const [exportData, setExportData] = useState([]);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const router = useRouter();
  const query = router.query;

  const { userProfile, companyStatus } = useUserAccess();
  const { user_access } = userProfile;

  useEffect(() => {
    clearPaymentData();
    const fetchData = async () => {
      router.replace(router.pathname, undefined, { shallow: true });
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (query) {
      const storedPage = localStorage.getItem('currentPage');
      const storedLimit = localStorage.getItem('limit');

      if (parseInt(storedLimit) > 10 && router.asPath === "/finance/payments") {
        setLimit(10);
      }

      if (storedPage) {
        setCurrentPage(parseInt(storedPage));
      }

      query._sort = "added_on:DESC"
      const filters = objectToQuery(query);

      getAllPayments(filters).then((response) => {
        setTotal(response?.meta?.pagination?.total);
        setAllPayments(response?.data);
        setExportData(response?.export);
        setPaymentsAggregates(response?.aggregates);
        setLoading(false);
      });
    }
  }, [query, loading]);

  const handleTableChange = (pagination) => {
    setLoading(true)
    setLimit(pagination.pageSize);
    setCurrentPage(pagination.current);

    localStorage.setItem("limit", pagination.pageSize);
    localStorage.setItem("currentPage", pagination.current);

    if (pagination.current === 1) {
      const offset = pagination.current * pagination.pageSize - pagination.pageSize;
      router.replace({
        pathname: "/finance/payments", query: { ...router.query, _start: offset, _limit: pagination.pageSize },
      })

    } else {
      const pageStrt = pagination.pageSize * (pagination.current - 1);
      router.replace({
        pathname: "/finance/payments", query: { ...router.query, _start: pageStrt, _limit: pagination.pageSize },
      })
    }
  };

  const cancelPaymentModal = () => setShowPaymentsModal(false);
  const showPaymentModal = () => setShowPaymentsModal(true);

  if (companyStatus?.company_name === "") {
    return <RenderLoader />
  } else if (accessRouteRetrieval(user_access, 'finance', 'payment') === false) {
    return <ErrorComponent status={403} backHome={true} />
  } else if (companyStatus && !companyStatus.is_payment_added) {
    return <PaymentsEmptyOnboarding />
  }
  return (
    <>
      <StyledPaymentTitle>
        <span className="title">Payments</span>
      </StyledPaymentTitle>
      <PaymentsFilters
        setLoading={setLoading}
        isExpandable
        showAdvancedFilters
        hasPagination
        filter_fields={[
          "date_range",
          "project_id",
          "status",
          "payment_types_id",
          "total_amount",
          "added_on",
        ]}
      />
      <StyledStatsContainer className="mt-20 mb-20">
        <Stats
          isPayment={true}
          title="TOTAL PAYMENTS"
          value={paymentsAggregates?.total_payments}
          loading={loading}
        />
        <Stats
          isPayment={true}
          title="UNPAID PAYMENTS"
          value={paymentsAggregates?.unpaid_payments}
          loading={loading}
        />
        <Stats
          isPayment={true}
          title="OPEN PAYMENTS"
          value={paymentsAggregates?.open_payments}
          loading={loading}
        />
        <Stats
          isPayment={true}
          title="CLOSED PAYMENTS"
          value={paymentsAggregates?.closed_payments}
          loading={loading}
        />
        <Stats
          isPayment={true}
          info={Object.values(paymentsAggregates?.total_amount ?? {})?.some((value) => value > 0) && true}
          infoText="Total payments amount (RWF)"
          title="TOTAL AMOUNT (RWF)"
          value={toMoney(paymentsAggregates?.total_amount?.total)}
          loading={loading}
          onClick={Object.values(paymentsAggregates?.total_amount ?? {})?.some((value) => value > 0) ? showPaymentModal : null}
        />
      </StyledStatsContainer>
      <StyledPayment>
        <DynamicTable
          rowKey={`id`}
          columns={PaymentsTableColumns}
          data={allPayments}
          expandable={allPayments}
          extra_right={[
            user_access && accessSubpageEntityRetrieval(user_access, 'finance', 'payment', 'new payment') && <NewPaymentButton key={0} />,
            <ExportButtons
              key={1}
              loading={false}
              data={exportData}
              isPayment={true}
            />,
          ]}
          isPayment={true}
          paymentsEdit={user_access && accessSubpageEntityRetrieval(user_access, 'finance', 'payment', 'delete payment')}
          loading={loading}
          setLoading={setLoading}
          pagination={{
            total: total,
            current: currentPage,
            defaultCurrent: currentPage,
            pageSize: limit,
            defaultPageSize: limit,
          }}
          onChange={(value) => handleTableChange(value)}
        />
      </StyledPayment>
      <PaymentSummaryModal
        payout={false}
        modalData={paymentsAggregates?.total_amount}
        handleCancel={cancelPaymentModal}
        handleOk={showPaymentModal}
        show={showPaymentsModal}
        paymentsSummary={true}
      />
    </>
  );
}

Payments.getLayout = function getLayout(page) {
  return <Layout isPayment={true}>{page}</Layout>;
};

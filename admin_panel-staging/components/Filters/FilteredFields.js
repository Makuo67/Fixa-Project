import { CloseOutlined } from "@ant-design/icons";
import { Space } from "antd";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAppContext } from "../../context/paymentsContext";
import { getPaymentData } from "../../helpers/auth";
import NumberFormat from "../shared/NumberFormat";
import { FilterItem, StyledFiltersContainer } from "./StyledCardTabs";

export default function FilteredFields({
  onClear,
  payments,
  isPayroll,
  isPayout,
  id,
}) {
  const { projects, trades } = useSelector(
    (state) => state.workforce.filters
  );
  const [PayrollId, setPayrollId] = useState(null);

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      // Get payment data from API
      const res = await getPaymentData();
      setPayrollId(res?.payroll_id);
    };
    // Call fetchData function when component mounts
    fetchData();
  }, []);

  const {
    date_onboarded_lte,
    date_onboarded_gte,
    project_id,
    district,
    trade_id,
  } = router.query;
  const {
    invoice_status,
    invoice_added_on_gte,
    invoice_added_on_lte,
    province,
    last_attendance_lte,
    last_attendance_gte,
    daily_earnings_lte,
    daily_earnings_gte,
    amount_earned_lte,
    amount_earned_gte,
    total_deductions_lte,
    total_deductions_gte,
    certifications,
    attendance,
    status,
    payment_types_id,
    start_date_gte,
    end_date_lte,
    total_amount_gte,
    total_amount_lte,
    amount_gte,
    amount_lte,
    take_home_gte,
    take_home_lte,
    service_name,
    service,
    payee_type_name,
    is_active,
    is_payment_method,
    assigned,
    is_assessed,
    gender,
    rate_type,
    worker_type,
  } = router.query;

  const getLabelValue = (data, prop) => {
    if (typeof prop == "string") {
      return data?.find((item) => item.value.toString() == prop)?.label;
    } else {
      return data
        ?.filter((item) => prop.includes(item.value.toString()))
        .map((x) => x.label)
        .join(", ");
    }
  };

  const getValue = (data, prop) => {
    if (typeof prop == "string") {
      return data?.find((item) => item.id.toString() == prop)?.name;
    } else {
      return data
        ?.filter((item) => prop.includes(item.id.toString()))
        .map((x) => x.name)
        .join(", ");
    }
  };

  const removeFilter = (filter1, filter2) => {
    const query = {};
    Object.assign(query, router.query);
    delete query[filter1];
    if (filter2) {
      delete query[filter2];
      onClear();
    }

    router.replace({
      pathname: isPayroll
        ? `/finance/payments/${PayrollId}`
        : isPayout
          ? `/finance/payments/${id}`
          : router.pathname,
      query: isPayout ? { ...query, payment: `Payout` } : query,
    });

    // dispatch(getAllWorkforce(objectToQuery(query)));
  };

  return (
    ((date_onboarded_gte && date_onboarded_lte) ||
      assigned ||
      attendance ||
      is_assessed ||
      rate_type ||
      worker_type ||
      is_active ||
      is_payment_method ||
      gender ||
      project_id ||
      district ||
      trade_id ||
      service_name ||
      service ||
      payee_type_name ||
      province ||
      (last_attendance_gte && last_attendance_lte) ||
      (daily_earnings_gte && daily_earnings_lte) ||
      (amount_earned_gte && amount_earned_lte) ||
      (amount_gte && amount_lte) ||
      (total_deductions_gte && total_deductions_lte) ||
      certifications ||
      status ||
      invoice_status ||
      (invoice_added_on_gte && invoice_added_on_lte) ||
      payment_types_id ||
      (start_date_gte && end_date_lte) ||
      (total_amount_gte && total_amount_lte) ||
      (take_home_gte && take_home_lte)) && (
      <StyledFiltersContainer style={{ marginTop: 20 }}>
        <h3>Filters:</h3>
        <div className="filter-items-container">
          {date_onboarded_gte && date_onboarded_lte && (
            <FilterItem>
              <Space>
                Date Onboarded: {date_onboarded_gte} - {date_onboarded_lte}
                <CloseOutlined
                  onClick={() =>
                    removeFilter("date_onboarded_gte", "date_onboarded_lte")
                  }
                />
              </Space>
            </FilterItem>
          )}
          {invoice_added_on_gte && invoice_added_on_lte && (
            <FilterItem>
              <Space>
                Date Created: {invoice_added_on_gte} - {invoice_added_on_lte}
                <CloseOutlined
                  onClick={() =>
                    removeFilter("invoice_added_on_gte", "invoice_added_on_lte")
                  }
                />
              </Space>
            </FilterItem>
          )}
          {project_id && (
            <FilterItem>
              <Space>
                Past Projects: {getValue(projects, project_id)}
                <CloseOutlined onClick={() => removeFilter("project_id")} />
              </Space>
            </FilterItem>
          )}
          {district && (
            <FilterItem>
              <Space>
                Districts: {`${district}`}
                <CloseOutlined onClick={() => removeFilter("district")} />
              </Space>
            </FilterItem>
          )}

          {trade_id && (
            <FilterItem>
              <Space>
                Services: {getValue(trades, trade_id)}
                <CloseOutlined onClick={() => removeFilter("trade_id")} />
              </Space>
            </FilterItem>
          )}
          {service_name && (
            <FilterItem>
              <Space>
                Services: {`${service_name}`}
                <CloseOutlined onClick={() => removeFilter("service_name")} />
              </Space>
            </FilterItem>
          )}
          {service && (
            <FilterItem>
              <Space>
                Services: {`${service}`}
                <CloseOutlined onClick={() => removeFilter("service")} />
              </Space>
            </FilterItem>
          )}
          {payee_type_name && (
            <FilterItem>
              <Space>
                Type of Supplier: {`${payee_type_name}`}
                <CloseOutlined
                  onClick={() => removeFilter("payee_type_name")}
                />
              </Space>
            </FilterItem>
          )}
          {province && (
            <FilterItem>
              <Space>
                Province: {`${province}`}
                <CloseOutlined onClick={() => removeFilter("province")} />
              </Space>
            </FilterItem>
          )}
          {last_attendance_gte && last_attendance_lte && (
            <FilterItem>
              <Space>
                Attendance: {last_attendance_gte} - {last_attendance_lte}
                <CloseOutlined
                  onClick={() =>
                    removeFilter("last_attendance_gte", "last_attendance_lte")
                  }
                />
              </Space>
            </FilterItem>
          )}
          {daily_earnings_gte && daily_earnings_lte && (
            <FilterItem>
              <Space>
                Daily Earnings: {<NumberFormat value={daily_earnings_gte} />} -{" "}
                {<NumberFormat value={daily_earnings_lte} />} RWF
                <CloseOutlined
                  onClick={() =>
                    removeFilter("daily_earnings_gte", "daily_earnings_lte")
                  }
                />
              </Space>
            </FilterItem>
          )}
          {amount_earned_gte && amount_earned_lte && (
            <FilterItem>
              <Space>
                Amount Earned: {<NumberFormat value={amount_earned_gte} />} -{" "}
                {<NumberFormat value={amount_earned_lte} />} RWF
                <CloseOutlined
                  onClick={() =>
                    removeFilter("amount_earned_gte", "amount_earned_lte")
                  }
                />
              </Space>
            </FilterItem>
          )}
          {amount_gte && amount_lte && (
            <FilterItem>
              <Space>
                Total Amount: {<NumberFormat value={amount_gte} />} -{" "}
                {<NumberFormat value={amount_lte} />} RWF
                <CloseOutlined
                  onClick={() => removeFilter("amount_gte", "amount_lte")}
                />
              </Space>
            </FilterItem>
          )}
          {take_home_gte && take_home_lte && (
            <FilterItem>
              <Space>
                Earnings: {<NumberFormat value={take_home_gte} />} -{" "}
                {<NumberFormat value={take_home_lte} />} RWF
                <CloseOutlined
                  onClick={() => removeFilter("take_home_gte", "take_home_lte")}
                />
              </Space>
            </FilterItem>
          )}
          {total_deductions_gte && total_deductions_lte && (
            <FilterItem>
              <Space>
                Total deductions:{" "}
                {<NumberFormat value={total_deductions_gte} />} -{" "}
                {<NumberFormat value={total_deductions_lte} />} RWF
                <CloseOutlined
                  onClick={() =>
                    removeFilter("total_deductions_gte", "total_deductions_lte")
                  }
                />
              </Space>
            </FilterItem>
          )}
          {certifications && (
            <FilterItem>
              <Space>
                Certifications: {getValue(certs, certifications)}
                <CloseOutlined onClick={() => removeFilter("certifications")} />
              </Space>
            </FilterItem>
          )}
          {status && (
            <FilterItem>
              <Space>
                Payment Status : {`${status}`}
                <CloseOutlined onClick={() => removeFilter("status")} />
              </Space>
            </FilterItem>
          )}
          {invoice_status && (
            <FilterItem>
              <Space>
                Invoice Status : {`${invoice_status}`}
                <CloseOutlined onClick={() => removeFilter("invoice_status")} />
              </Space>
            </FilterItem>
          )}
          {payment_types_id && (
            <FilterItem>
              <Space>
                Payment Type: {getLabelValue(payments, payment_types_id)}
                <CloseOutlined
                  onClick={() => removeFilter("payment_types_id")}
                />
              </Space>
            </FilterItem>
          )}
          {start_date_gte && end_date_lte && (
            <FilterItem>
              <Space>
                Payroll Date Range: {start_date_gte} - {end_date_lte}
                <CloseOutlined
                  onClick={() => removeFilter("start_date_gte", "end_date_lte")}
                />
              </Space>
            </FilterItem>
          )}
          {total_amount_gte && total_amount_lte && (
            <FilterItem>
              <Space>
                Total Amount Range: {total_amount_gte} - {total_amount_lte}
                <CloseOutlined
                  onClick={() =>
                    removeFilter("total_amount_gte", "total_amount_lte")
                  }
                />
              </Space>
            </FilterItem>
          )}
          {assigned && (
            <FilterItem>
              <Space>
                Status : {assigned == "true" ? "Assigned" : "Unassigned"}
                <CloseOutlined onClick={() => removeFilter("assigned")} />
              </Space>
            </FilterItem>
          )}
          {is_assessed && (
            <FilterItem>
              <Space>
                Assessment : {is_assessed == "true" ? "Assessed" : "Not Assessed"}
                <CloseOutlined onClick={() => removeFilter("is_assessed")} />
              </Space>
            </FilterItem>
          )}
          {attendance && (
            <FilterItem>
              <Space>
                Attendance Percentange : {attendance}
                <CloseOutlined onClick={() => removeFilter("attendance")} />
              </Space>
            </FilterItem>
          )}
          {gender && (
            <FilterItem>
              <Space>
                Gender : {gender}
                <CloseOutlined onClick={() => removeFilter("gender")} />
              </Space>
            </FilterItem>
          )}
          {is_active && (
            <FilterItem>
              <Space>
                Worker Status : {is_active == "true" ? "Active" : "Inactive"}
                <CloseOutlined onClick={() => removeFilter("is_active")} />
              </Space>
            </FilterItem>
          )}
          {is_payment_method && (
            <FilterItem>
              <Space>
                Verified Phone : {is_payment_method === "green" ? "Verified" : "Not Verified"}
                <CloseOutlined onClick={() => removeFilter("is_payment_method")} />
              </Space>
            </FilterItem>
          )}
          {rate_type && (
            <FilterItem>
              <Space>
                Rate Type : {rate_type == "standard" ? "Standard" : "Negotiated"}
                <CloseOutlined onClick={() => removeFilter("rate_type")} />
              </Space>
            </FilterItem>
          )}
          {worker_type && (
            <FilterItem>
              <Space>
                Worker type : {worker_type == "casual" ? "Casual" : "Permanent"}
                <CloseOutlined onClick={() => removeFilter("worker_type")} />
              </Space>
            </FilterItem>
          )}
        </div>
        {/* <div className="buttons">
      <Space>
        <Button icon={<EditOutlined />}>Edit</Button>
        <Button icon={<ClearOutlined />} onClick={() => clearForm()}>
          Clear
        </Button>
      </Space>
    </div> */}
      </StyledFiltersContainer>
    )
  );
}

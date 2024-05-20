import {
  CloseOutlined,
  DownOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { Button, DatePicker, Form, Input, Select, Space } from "antd";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAppContext } from "../../context/paymentsContext";
import { getPaymentData } from "../../helpers/auth";
import {
  getProjects,
  getServices,
} from "../../redux/actions/workforce.actions";
import FilteredFields from "./FilteredFields";
import { StyledCardTabs, StyledFilterButton } from "./StyledCardTabs";

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function PayrollFilters({
  isExpandable,
  filter_fields,
  initial_queries,
  hasPagination,
  setReload,
}) {
  const format = "YYYY-MM-DD";
  const { projects, trades } = useSelector((state) => state.workforce.filters);

  const [filter_expanded, set_filter_expanded] = useState(!isExpandable);
  const [PayrollId, setPayrollId] = useState(null);

  const router = useRouter();
  const dispatch = useDispatch();
  const { project_id, status, service_name } = router.query;
  const paymentInfo = useAppContext();

  const [form] = Form.useForm();

  const get_initial_queries = (raw) => {
    return Object.keys(raw)
      .filter((key) => initial_queries?.includes(key))
      .reduce((obj, key) => {
        obj[key] = raw[key];
        return obj;
      }, {});
  };

  // clear filters but keep pagination data
  const clearForm = () => {
    const query = get_initial_queries(router.query);
    if (hasPagination) {
      // query["current_page"] = 1;
      query["_start"] = 0;
      query["_limit"] = -1;
    }
    form.resetFields();
    router.replace({
      pathname: `/finance/payments/${PayrollId}`,
      query,
    });
  };

  // dispatch select options
  useEffect(() => {
    dispatch(getProjects());
    dispatch(getServices());
    getPaymentData().then((res) => {
      setPayrollId(res.payroll_id);
    });
  }, []);

  // set default form values
  useEffect(() => {
    const values = {
      project_id,
      status,
      service_name,
    };

    form.setFieldsValue(values);
  }, [router.isReady, router.query]);

  const onFinish = (values) => {
    // delete empty fields
    Object.keys(values).forEach((key) => {
      if (values[key] === undefined || values[key] === null) {
        delete values[key];
      }
    });

    const query = { ...router.query, ...values };
    if (hasPagination) {
      // query["current_page"] = 1;
      query["_start"] = 0;
      query["_limit"] = -1;
    }
    router.replace({
      pathname: `/finance/payments/${PayrollId}}`,
      query,
    });

    if (isExpandable) set_filter_expanded(false);
    setReload(true);
  };
  const onFormChange = (values) => {
    Object.keys(values).forEach((key) => {
      if (values[key] === undefined || values[key] === null) {
        delete values[key];
      }
    });

    const query = { ...router.query, ...values };

    if (hasPagination) {
      query["current_page"] = 1;
      query["_start"] = 0;
      query["_limit"] = 10;
    }
    // router.replace({
    //   pathname: `/finance/payments/${PayrollId}}`,
    //   query,
    // });
  };

  const filterFormItems = [
    {
      name: "status",
      label: "Payment Status",
      node: (
        <Select
          mode={"multiple"}
          allowClear={true}
          placeholder="Please select"
          style={{ width: "100%" }}
          key="0"
        >
          <Option value="successful">Successful</Option>
          <Option value="failed">Failed</Option>
          <Option value="unpaid">Unpaid</Option>
          <Option value="pending">Pending</Option>
        </Select>
      ),
    },
    {
      name: "service_name",
      label: "Service",
      node: (
        <Select
          mode={"multiple"}
          allowClear={true}
          placeholder="Please select"
          style={{ width: "100%" }}
        >
          {trades?.map((item) => {
            return (
              <Option
                value={item.name.toString()}
                key={item.id}
                title={item.name}
              >
                {item.name}
              </Option>
            );
          })}
        </Select>
      ),
    },
    {
      name: "take_home",
      label: "Amount range in RWF",
      node: (
        <Input.Group compact>
          <Form.Item
            name="take_home_gte"
            style={{ width: "calc(50% - 15px)", marginBottom: 0 }}
          >
            <Input type="number" placeholder="Minimum" />
          </Form.Item>
          <Input
            className="site-input-split"
            style={{
              width: 30,

              pointerEvents: "none",
            }}
            placeholder="~"
            disabled
          />
          <Form.Item
            name="take_home_lte"
            style={{ width: "calc(50% - 15px)", marginBottom: 0 }}
          >
            <Input type="number" placeholder="Maximum" />
          </Form.Item>
        </Input.Group>
      ),
    },
    {
      name: "total_deductions",
      label: "Deductions range in RWF",
      node: (
        <Input.Group compact>
          <Form.Item
            name="total_deductions_gte"
            style={{ width: "calc(50% - 15px)", marginBottom: 0 }}
          >
            <Input type="number" placeholder="Minimum" />
          </Form.Item>
          <Input
            className="site-input-split"
            style={{
              width: 30,

              pointerEvents: "none",
            }}
            placeholder="~"
            disabled
          />
          <Form.Item
            name="total_deductions_lte"
            style={{ width: "calc(50% - 15px)", marginBottom: 0 }}
          >
            <Input type="number" placeholder="Maximum" />
          </Form.Item>
        </Input.Group>
      ),
    },
    {
      name: "is_payment_method",
      label: "Verified Phone",
      node: (
        <Select
          // mode={"multiple"}
          allowClear={true}
          placeholder="Please select"
          style={{ width: "100%" }}
          key="0"
        >
          <Option value={"green"}>Verified</Option>
          <Option value={"red"}>Not verified</Option>
        </Select>
      ),
    },
  ];

  return (
    <>
      <StyledCardTabs>
        {isExpandable && (
          <StyledFilterButton
            onClick={() => set_filter_expanded(!filter_expanded)}
            filter_expanded={filter_expanded}
          >
            <Space>
              <FilterOutlined />
              FILTER BY
              {filter_expanded ? (
                <Button className="clear" onClick={() => clearForm()}>
                  <CloseOutlined /> Clear
                </Button>
              ) : (
                <DownOutlined />
              )}
            </Space>
          </StyledFilterButton>
        )}
        {filter_expanded && (
          <div className="filter-body">
            <Form
              form={form}
              onFinish={onFinish}
              onValuesChange={onFormChange}
              name="basic"
              autoComplete="off"
              layout="vertical"
              className="form-container"
            >
              <div className="filter-fields">
                {filterFormItems
                  .filter((o) => filter_fields?.includes(o.name))
                  .map((item) => {
                    return (
                      <Form.Item
                        label={item.label}
                        name={item.name}
                        key={item.name}
                      >
                        {item.node}
                      </Form.Item>
                    );
                  })}
              </div>
              <div className="buttons-container">
                {/* <div className="submit-button"> */}
                <Space>
                  <Button htmlType="submit"type="primary"
                    className="primaryBtn">
                    Apply
                  </Button>
                </Space>
                {/* </div> */}
              </div>
            </Form>
          </div>
        )}
      </StyledCardTabs>
      <FilteredFields onClear={clearForm} isPayroll={true} />
    </>
  );
}

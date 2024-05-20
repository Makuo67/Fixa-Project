import {
  ArrowRightOutlined,
  ClearOutlined,
  CloseOutlined,
  DownOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { Button, Checkbox, DatePicker, Form, Input, Select, Space } from "antd";
import moment from "moment";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import FilteredFields from "./FilteredFields";
import { StyledCardTabs, StyledFilterButton } from "./StyledCardTabs";
import { getPayeeType } from "../../helpers/payments/payout/payout";
import { capitalize } from "../../helpers/excelRegister";

const { Option } = Select;
// const { RangePicker } = DatePicker;

export default function PayoutFilters({
  isExpandable,
  filter_fields,
  initial_queries,
  hasPagination,
  id,
}) {
  const [PayeeTypes, setPayeeTypes] = useState([]);

  const [filter_expanded, set_filter_expanded] = useState(!isExpandable);
  const router = useRouter();

  const { project_id, status, payment_types_name } = router.query;

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
    form.resetFields();
    router.replace({
      pathname: `/finance/payments/${id}`,
      query,
    });
  };

  // clear all filter
  const clearFilters = () => {
    const query = get_initial_queries(router.query);
    form.resetFields();
    router.replace({
      pathname: `/finance/payments/${id}`,
      query,
    });
  };

  // dispatch select options
  useEffect(() => {
    getPayeeType().then((res) => {
      setPayeeTypes(res);
    });
  }, []);

  // set default form values
  useEffect(() => {
    const values = {
      project_id,
      status,
      payment_types_name,
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
    router.replace({
      pathname: `/finance/payments/${id}`,
      query,
    });

    if (isExpandable) set_filter_expanded(false);
  };
  const onFormChange = (values) => {
    // console.log(values);
    Object.keys(values).forEach((key) => {
      if (values[key] === undefined || values[key] === null) {
        delete values[key];
      }
    });

    const query = { ...router.query, ...values };

    // router.replace({
    //   pathname: `/payments/${id}`,
    //   query,
    // });
  };

  const onChange = (checkedValues) => {
    console.log("checked = ", checkedValues);
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
          <Option value="failed">Failed</Option>
          <Option value="successful">Successful</Option>
          <Option value="unpaid">Unpaid</Option>
        </Select>
      ),
    },
    {
      name: "payee_type_name",
      label: "Type of payee",
      node: (
        <Select
          mode={"multiple"}
          allowClear={true}
          placeholder="Please select"
          style={{ width: "100%" }}
          key="0"
        >
          {PayeeTypes.map((item, index) => (
            <Option key={item.id} value={item.payee_type}>
              {capitalize(item.payee_type)}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      name: "amount",
      label: "Amount Range in RWF",
      node: (
        <Input.Group compact>
          <Form.Item
            name="amount_gte"
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
            name="amount_lte"
            style={{ width: "calc(50% - 15px)", marginBottom: 0 }}
          >
            <Input type="number" placeholder="Maximum" />
          </Form.Item>
        </Input.Group>
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
                <Button className="clear flex items-center" onClick={() => clearFilters()}>
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
                <div className="submit-button">
                  <Space>
                    <Button htmlType="submit"
                    style={{
                      color: "var(--button-color)",
                    }}>
                      Apply
                    </Button>
                  </Space>
                </div>
              </div>
            </Form>
          </div>
        )}
      </StyledCardTabs>
      <FilteredFields onClear={clearForm} isPayout={true} id={id} />
    </>
  );
}

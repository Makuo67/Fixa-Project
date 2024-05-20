import { CloseOutlined, DownOutlined, FilterOutlined } from "@ant-design/icons";
import { Button, Checkbox, DatePicker, Form, Input, Select, Space } from "antd";
import moment from "moment";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import FilteredFields from "./FilteredFields";
import { StyledCardTabs, StyledFilterButton } from "./StyledCardTabs";

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function InvoiceFilters({
  isExpandable,
  filter_fields,
  initial_queries,
  hasPagination,
}) {
  const format = "YYYY-MM-DD";

  const [filter_expanded, set_filter_expanded] = useState(!isExpandable);

  const router = useRouter();
  const dispatch = useDispatch();

  const { invoice_added_on_lte, invoice_added_on_gte, id, invoice_status } =
    router.query;

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
      // query["_start"] = 0;
      // query["_limit"] = -1;
    }
    form.resetFields();
    router.replace({
      pathname: `/projects/${router.query.name}`,
      query: { id: id },
    });
  };

  // set default form values
  useEffect(() => {
    const values = {
      status,
    };
    if (invoice_added_on_lte && invoice_added_on_gte) {
      values["invoice_added_on"] = [
        moment(invoice_added_on_gte),
        moment(invoice_added_on_lte),
      ];
    }
    form.setFieldsValue(values);
  }, [router.isReady, router.query]);

  const onFinish = (values) => {
    // delete empty fields
    Object.keys(values).forEach((key) => {
      if (values[key] === undefined || values[key] === null) {
        delete values[key];
        delete router.query.invoice_added_on_lte;
        delete router.query.invoice_added_on_gte;
      }
    });

    // set query params
    if (values["invoice_added_on"]) {
      values["invoice_added_on_gte"] = values["invoice_added_on"][0].format(format);
      values["invoice_added_on_lte"] =
        values["invoice_added_on"][1].format(format);
      delete values["invoice_added_on"];
    }

    const query = { ...router.query, ...values };
    if (hasPagination) {
      // query["current_page"] = 1;
      // query["_start"] = 0;
      // query["_limit"] = -1;
    }
    router.replace({
      pathname: router.pathname,
      query,
    });

    if (isExpandable) set_filter_expanded(false);
  };
  const onFormChange = (values) => {
    // console.log(values);
    Object.keys(values).forEach((key) => {
      if (values[key] === undefined || values[key] === null) {
        delete values[key];
        delete router.query.invoice_added_on_lte;
        delete router.query.invoice_added_on_gte;
      }
    });

    // set query params
    if (values["invoice_added_on"]) {
      values["invoice_added_on_gte"] = values["invoice_added_on"][0].format(format);
      values["invoice_added_on_lte"] =
        values["invoice_added_on"][1].format(format);
      delete values["invoice_added_on"];
    }

    const query = { ...router.query, ...values };

    if (hasPagination) {
      // query["current_page"] = 1;
      // query["_start"] = 0;
      // query["_limit"] = -1;
    }
    // router.replace({
    //   pathname: router.pathname,
    //   query,
    // });
  };

  const onChange = (checkedValues) => {
    console.log("checked = ", checkedValues);
  };

  const filterFormItems = [
    {
      name: "invoice_status",
      label: "Invoice Status",
      node: (
        <Select
          mode={"multiple"}
          allowClear={true}
          placeholder="Please select"
          style={{ width: "100%" }}
          key="0"
        >
          <Option value="paid">Paid</Option>
          <Option value="draft">Draft</Option>
          <Option value="unpaid">Unpaid</Option>
        </Select>
      ),
    },
    {
      name: "invoice_added_on",
      label: "Select Date Range",
      node: <RangePicker allowClear={true} />,
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
                <div className="submit-button">
                  <Space>
                    <Button htmlType="submit"
                      style={{
                        color: "var(--button-color)",
                      }}
                    >
                      Apply
                    </Button>
                  </Space>
                </div>
              </div>
            </Form>
          </div>
        )}
      </StyledCardTabs>
      <FilteredFields onClear={clearForm} />
    </>
  );
}

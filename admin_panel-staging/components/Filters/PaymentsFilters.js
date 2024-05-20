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
import { getProjects } from "../../redux/actions/workforce.actions";
import FilteredFields from "./FilteredFields";
import { StyledCardTabs, StyledFilterButton } from "./StyledCardTabs";

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function PaymentsFilters({
  isExpandable,
  filter_fields,
  initial_queries,
  hasPagination,
  setLoading,
}) {
  const format = "YYYY-MM-DD";
  const { projects } = useSelector((state) => state.workforce.filters);

  const [filter_expanded, set_filter_expanded] = useState(!isExpandable);

  const router = useRouter();
  const dispatch = useDispatch();
  const { end_date_lte, start_date_gte, project_id, status, payment_types_id } =
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
      query["current_page"] = 1;
      query["_start"] = 0;
      query["_limit"] = 10;
    }
    form.resetFields();
    setLoading(true);
    router.replace({
      pathname: router.pathname,
      query,
    });
  };

  // dispatch select options
  useEffect(() => {
    dispatch(getProjects());
  }, []);

  // set default form values
  useEffect(() => {
    const values = {
      project_id,
      status,
      payment_types_id,
    };
    if (end_date_lte && start_date_gte) {
      values["added_on"] = [moment(start_date_gte), moment(end_date_lte)];
    }
    form.setFieldsValue(values);
  }, [router.isReady, router.query]);

  const onFinish = (values) => {
    // delete empty fields
    Object.keys(values).forEach((key) => {
      if (values[key] === undefined || values[key] === null) {
        delete values[key];
        delete router.query.end_date_lte;
        delete router.query.start_date_gte;
      }
    });

    // set query params
    if (values["added_on"]) {
      values["start_date_gte"] = values["added_on"][0].format(format);
      values["end_date_lte"] = values["added_on"][1].format(format);
      delete values["added_on"];
    }

    const query = { ...router.query, ...values };
    if (hasPagination) {
      // query["current_page"] = 1;
      query["_start"] = 0;
      // query["_limit"] = 10;
    }
    setLoading(true);
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
        delete router.query.end_date_lte;
        delete router.query.start_date_gte;
      }
    });

    // set query params
    if (values["added_on"]) {
      values["start_date_gte"] = values["added_on"][0].format(format);
      values["end_date_lte"] = values["added_on"][1].format(format);
      delete values["added_on"];
    }

    const query = { ...router.query, ...values };

    if (hasPagination) {
      // query["current_page"] = 1;
      query["_start"] = 0;
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
  const options = [
    {
      label: "Payroll",
      value: "1",
    },
    {
      label: "Payout",
      value: "2",
    },
  ];

  const filterFormItems = [
    {
      name: "project_id",
      label: "Project",
      node: (
        <Select
          mode={"multiple"}
          allowClear={true}
          placeholder="Please select"
          style={{ width: "100%" }}
        >
          {projects?.map((item) => {
            return (
              <Option
                value={item.id.toString()}
                key={item.id}
                title={item.name}
                style={{ textTransform: "capitalize" }}
              >
                {item.name}
              </Option>
            );
          })}
        </Select>
      ),
    },
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
          <Option value="open">Open</Option>
          <Option value="closed">Closed</Option>
          <Option value="unpaid">Unpaid</Option>
        </Select>
      ),
    },
    {
      name: "payee_type",
      label: "Type of payee",
      node: (
        <Select
          allowClear={true}
          placeholder="Please select"
          style={{ width: "100%" }}
          key="0"
        >
          <Option value="open">Claims</Option>
          <Option value="closed">Restaurant</Option>
          <Option value="unpaid">Tools</Option>
        </Select>
      ),
    },
    {
      name: "payment_types_id",
      label: "Payment Type",
      node: <Checkbox.Group options={options} onChange={onChange} />,
    },
    {
      name: "added_on",
      label: "Select Date Range",
      node: <RangePicker allowClear={true} />,
    },
    {
      name: "total_amount",
      label: "Amount Range in RWF",
      node: (
        <Input.Group compact>
          <Form.Item
            name="total_amount_gte"
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
            name="total_amount_lte"
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
                    {/* <Button onClick={() => clearForm()}>
                      <Space>
                        <ClearOutlined />
                        Clear Filters
                      </Space>
                    </Button> */}

                    <Button htmlType="submit"
                    type="primary"
                    className="primaryBtn"
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
      <FilteredFields onClear={clearForm} payments={options} />
    </>
  );
}

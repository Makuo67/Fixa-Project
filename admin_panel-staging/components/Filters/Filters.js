import { ClearOutlined, MinusCircleOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Form, Input, Popconfirm, Select, Space } from "antd";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { getOnePayroll, getPayrollSummary } from "../../redux/actions/payroll.actions";
import { filter_fields } from "./filterFields";

const { Option } = Select;
const filter_conditions = [
  {
    title: "is",
    alt: "=",
    value: "_eq",
  },
  {
    title: "is not",
    alt: "≠",
    value: "_ne",
  },
  {
    title: "contains",
    value: "_contains",
  },
  {
    title: "does not contain",
    value: "_notContains",
  },
  {
    title: "is less than",
    alt: "<",
    value: "_lt",
  },
  {
    title: "is greater than",
    alt: ">",
    value: "_gt",
  },
  {
    title: "is less than or equal to",
    alt: "≤",
    value: "_lte",
  },
  {
    title: "is greater than or equal to",
    alt: "≥",
    value: "_gte",
  },
];

const Filters = ({ type, payroll_id, data }) => {
  const dispatch = useDispatch();
  const [isClear, setIsClear] = useState(false);
  const [form] = Form.useForm();

  const onFinish = ({ filters }) => {
    const filter_query = {};

    for (let i = 0; i < filters.length; i++) {
      filter_query[filters[i].field + filters[i].condition] = filters[i].value;
    }
    if (type == "review") dispatch(getOnePayroll(payroll_id, filter_query));
    if (type == "MTN") dispatch(getOnePayroll(payroll_id, filter_query));
    if (type == "summary") dispatch(getPayrollSummary(payroll_id, filter_query));
  };

  const clear = () => {
    form.resetFields();
    if (type == "review") dispatch(getOnePayroll(payroll_id));
    if (type == "MTN") dispatch(getOnePayroll(payroll_id));
    if (type == "summary") dispatch(getPayrollSummary(payroll_id));
    setIsClear(true);
  };
  return (
    <Form form={form} style={{ width: "615px" }} onFinish={onFinish}>
      <Form.List name="filters">
        {(fields, { add, remove }) => (
          <>
            {!isClear &&
              fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: "flex" }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, "field"]}
                    rules={[{ required: true, message: "Missing field" }]}
                  >
                    <Select placeholder="Select Field" style={{ width: 200 }}>
                      {filter_fields[type]?.map((item, index) => {
                        return (
                          <Option value={item.dataIndex} key={index}>
                            {item.title}
                          </Option>
                        );
                      })}
                    </Select>
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "condition"]}
                    rules={[{ required: true, message: "Missing condition" }]}
                  >
                    <Select placeholder="Select Condition" style={{ width: 200 }}>
                      {filter_conditions.map((item, index) => {
                        return (
                          <Option value={item.value} key={index}>
                            {item.title}
                          </Option>
                        );
                      })}
                    </Select>
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "value"]}
                    rules={[{ required: true, message: "Missing value" }]}
                  >
                    <Input placeholder="Input value" style={{ width: 200 }} />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}

            <Form.Item>
              <Button
                type="primary"
                ghost
                onClick={() => {
                  setIsClear(false);
                  add();
                }}
                icon={<PlusOutlined />}
              >
                Add a filter
              </Button>
              {fields.length > 0 && (
                <>
                  <Popconfirm
                    title="Are you sure?"
                    onConfirm={() => clear()}
                    onCancel={() => {}}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button icon={<ClearOutlined />} style={{ marginLeft: "10px" }}>
                      Clear filters
                    </Button>
                  </Popconfirm>

                  <Button type="primary" icon={<SearchOutlined />} htmlType="submit" style={{ float: "right" }}>
                    Search
                  </Button>
                </>
              )}
            </Form.Item>
          </>
        )}
      </Form.List>
    </Form>
  );
};

export default Filters;

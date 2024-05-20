import {
  CheckCircleOutlined,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  PlusCircleOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button, Form, InputNumber, notification, Select, Space, Typography } from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getOnePayroll, postAdditions } from "../../../redux/actions/payroll.actions";
import NumberFormat from "../../shared/NumberFormat";
const { Text } = Typography;
const OPTIONS = ["food", "tools", "uniform"];
const Increment = ({ headerData, workerData, project_id, data, payroll_id }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const filteredOptions = OPTIONS.filter((o) => !selectedItems.includes(o));
  const dispatch = useDispatch();
  const [showEdit, setShowEdit] = useState(false);
  const [totalValue, setTotalValue] = useState(
    data?.reduce((sum, current) => {
      return sum + Number(current.amount);
    }, 0)
  );
  /**
   *  Submitting deductions page
   */
  const [form] = Form.useForm();
  useEffect(() => {
    form.setFieldsValue({
      deductions: data,
    });
  }, []);
  const openNotification = (status, total, worker_name) => {
    if (status == "error") {
      notification.open({
        icon: <CloseCircleTwoTone twoToneColor="red" />,
        message: (
          <span>
            <Text type="danger">Error!</Text> Cannot deduct {total} RWF from {worker_name} because it exceeds the
            worker&#39;s earnings.
          </span>
        ),
      });
    } else {
      notification.open({
        icon: <CheckCircleTwoTone twoToneColor="#52c41a" />,
        message: (
          <span>
            <Text mark>{total} RWF</Text> Added {total} RWF to {worker_name}.
          </span>
        ),
      });
    }
  };
  const onFinish = (values) => {
    // hide editing interface
    setShowEdit(false);
    // update the form's values
    form.setFieldsValue({
      deductions: [...values.deductions],
    });
    // form.setFieldsValue({deductions: values.deductions});
    // get sum of deductions
    const newSum = values.deductions.reduce((sum, current) => {
      return sum + Number(current.amount);
    }, 0);
    // check if the deduction sum exceeds earnigns
    if (newSum < 0) {
      openNotification("error", newSum, workerData.names);
      return;
    } else {
      openNotification("success", newSum, workerData.worker_name);
    }
    let sum_to_add = newSum - parseInt(workerData.additions);

    // workerData.take_home = workerData.total_earnings + newSum - parseInt(workerData.total_deductions);
    workerData.take_home =  parseInt(workerData.take_home) + sum_to_add;
    // workerData.additions = values.deductions
    // workerData.additions = parseInt(workerData.additions) + (newSum - parseInt(workerData.total_deductions))
    workerData.additions = parseInt(workerData.additions) + sum_to_add
    // headerData.amount_due = headerData.amount_due + parseInt(workerData.additions) + (newSum - parseInt(workerData.total_deductions));
    headerData.amount_due = parseInt(headerData.amount_due) + sum_to_add;

    // sends POST request and updates table data
    dispatch(postAdditions(
    workerData.assigned_worker_id,
    workerData.id,
    workerData.take_home,
    sum_to_add,
    2 ))
    setTotalValue(newSum);
  };
  return (
    <>
      {showEdit ? (
        <Form form={form} onFinish={onFinish}>
          <Form.List name="deductions">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: "flex" }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, "amount"]}
                      rules={[{ required: true, message: "Missing amount" }]}
                    >
                      <InputNumber
                        style={{ height: "100%", marginTop: -5 }}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                        addonAfter="RWF"
                        min={0}
                      />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Form.Item style={{ margin: 0 }}>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Increment earnings
                  </Button>
                  <Button
                    type="primary"
                    block
                    icon={<CheckCircleOutlined />}
                    style={{ marginTop: 10 }}
                    htmlType="submit"
                  >
                    Confirm
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      ) : (
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <h3>
              <NumberFormat value={totalValue} />
            </h3>
          </div>
          <Button type="link" icon={<PlusCircleOutlined />} onClick={() => setShowEdit(true)} />
        </div>
      )}
    </>
  );
};
export default Increment;
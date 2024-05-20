import {
  CheckCircleOutlined,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  EditOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button, Form, InputNumber, notification, Select, Space, Typography } from "antd";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { postDeductions, getOnePayroll } from "../../../redux/actions/payroll.actions";
import NumberFormat from "../../shared/NumberFormat";
const { Text } = Typography;
const { Option } = Select;
const OPTIONS = ["food", "tools", "uniform"];
const Deductions = ({ headerData, workerData, project_id, data, payroll_id }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const filteredOptions = OPTIONS.filter((o) => !selectedItems.includes(o));
  const dispatch = useDispatch()
  const [showEdit, setShowEdit] = useState(false);
  const [totalValue, setTotalValue] = useState(
    data?.reduce((sum, current) => {
      return sum + Number(current.deduction_amount);
    }, 0)
  );

  /**
   *  remove additions display
   *  reduce time it takes to display and adding deductions add skeleton maybe.
   *  Filter doesn't work
   *  Summary page doesn't work
   *  Refresh the balance after running payroll
   *  Transaction progress not working
   *  Status changed pon rerunning payroll
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
            <Text mark>{total} RWF</Text> deducted from {worker_name}.
          </span>
        ),
      });
    }
  };
  const renameObject =(values) => {
    let response = [];
    for (let index = 0; index < values.length; index++) {
     response.push({
      "payroll_details_deductions_id": values[index].id?values[index].id:0,
      "type_id": values[index].deduction_type_id?values[index].deduction_type_id:values[index].title,
      "amount": values[index].deduction_amount
     });
    }
    return response;
  }
  const onFinish = (values) => {
    // hide editing interface
    setShowEdit(false);
    // get sum of deductions
    const newSum = values.deductions.reduce((sum, current) => {
      return sum + Number(current.deduction_amount);
    }, 0);
    // check if the deduction sum exceeds earnigns
    if (newSum > workerData.take_home) {
      openNotification("error", newSum, workerData.names);
      return;
    } else {
       // update worker's data
    let new_amoun_due = parseInt(headerData.amount_due) - (newSum -parseInt(workerData.total_deductions));
    workerData.deductions = values.deductions;
    workerData.total_deductions = parseInt(workerData.total_deductions)  + ( newSum-parseInt(workerData.total_deductions));
    workerData.take_home = parseInt(workerData.total_earnings) - newSum + parseInt(workerData.additions);
    headerData.amount_due =new_amoun_due;
      openNotification("success", newSum, workerData.worker_name);
    }
     // sends POST request and updates table data
    dispatch(postDeductions(project_id, payroll_id, workerData.assigned_worker_id, renameObject(values.deductions)));
    setTotalValue(newSum);
    // update the form's values
    form.setFieldsValue({
      deductions: [...values.deductions],
    });
    // setTimeout(() => {
    //   dispatch(getOnePayroll(payroll_id, {}));
    // }, 3000)
  };
  /**
   *  No way to update deductions on remove icon.
   *  Add endpoint for updating total shifts.
   */
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
                      name={[name, "id"]}
                      rules={[{ required: false, message: "Missing type" }]}
                    >
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "title"]}
                      rules={[{ required: true, message: "Missing type" }]}
                    >
                      <Select placeholder="Select Type">
                        {headerData?.deductions_types?.map((item) => {
                          return (
                            <Option value={item.id} key={item.id} >
                              <span style={{ textTransform: "capitalize" }}>{item.title}</span>
                            </Option>
                          );
                        })}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "deduction_amount"]}
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
                    Add deduction
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
          <Button type="link" icon={<EditOutlined />} onClick={() => setShowEdit(true)} />
        </div>
      )}
    </>
  );
};
export default Deductions;
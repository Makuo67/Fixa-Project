import { Icon } from "@iconify/react";
import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Modal, notification, Select, Space } from "antd";
import { StyledDeductionsModal } from "../../Tables/PayrollTable.styled";
import { useState } from "react";
import {
  addDeductions,
  deleteDeduction,
} from "../../../helpers/payments/payroll/payroll";
import { handleError } from "../../../helpers/payments/error";

const { Option } = Select;

const EditDeductionsModal = (props) => {
  const [other, setOther] = useState(false);
  const [form] = Form.useForm();
  let newDeductions;
  let deductions = [];
  let singleDeduction;

  const onFinish = (values) => {
    if (values.deductions != undefined) {
      values.deductions.map((item) => {
        if (item.deductionType != "Other") {
          singleDeduction = {
            type_id: item.deductionType,
            amount: item.amount,
          };
        } else {
          singleDeduction = {
            type_id: 0,
            type_name: item.description,
            amount: item.amount,
          };
        }
        deductions.push(singleDeduction);
      });
      newDeductions = {
        project_id: props.projectId,
        payroll_transaction_id: props.payrollTransactionId,
        assigned_worker_id: props.assignedWorkerId,
        deductions: deductions,
      };
      const totalDeductions = newDeductions.deductions.reduce((sum, item) => {
        return sum + parseInt(item.amount);
      }, 0);
      if (totalDeductions <= props.takeHome) {
        props.setLoading(true);
        addDeductions(newDeductions).then((res) => {
          handleError(res.status, res.status === 400 ? res.data.error : 'Deductions Added Successfully');
          props.setLoading(false);
        });
      } else {
        notification.error({
          message: "Failed",
          description: "Deductions exceeds worker's earnings",
        });
      }
    } else if (values != undefined) {
      delete values.deductions;
    }
  };
  const onFinishFailed = (errorInfo) => {
    notification.error({
      message: "Failed",
      description: errorInfo,
    });
  };

  const deleteDeductions = (id) => {
    props.setLoading(true);
    deleteDeduction(id).then((res) => {
      handleError(res.status, res.status === 400 ? res.data.data : 'Deductions Deleted Successfully');
      props.setLoading(false);
    });
  };

  const onSelect = (values) => {
    if (values === "Other") {
      setOther(true);
    } else {
      setOther(false);
    }
  };

  return (
    <Modal
      centered
      open={props.modalOpen}
      onOk={props.handleOk}
      onCancel={props.handleClose}
      title="Edit Deductions"
      styles={{
        body: {
          height: "fit-content",
        }
      }}
      footer={null}
    >
      <StyledDeductionsModal>
        <div className="body">
          <div>
            <Form
              initialValues={{
                remember: true,
              }}
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
              autoComplete="off"
              layout="vertical"
            >
              {props.workerDeductions.map((item, index) => (
                <div className="field" key={index}>
                  <div className="icon">
                    <Icon
                      icon="material-symbols:delete-outline-rounded"
                      color="#f5222d"
                      height="20px"
                      onClick={() => deleteDeductions(item.id)}
                    />
                  </div>
                  <Form.Item
                    label="Deduction type"
                    name={`deductionType_${index}`}
                  >
                    <Select
                      allowClear={true}
                      size="large"
                      defaultValue={item.title}
                      style={{ borderRadius: 8 }}
                      disabled
                    >
                      {props.deductionsTypes.map((item, i) => (
                        <Option key={i} value={item.id} style={{ textTransform: "capitalize" }}>
                          {item.title}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item label="Amount (Rwf)" name={`amount_${index}`}>
                    <InputNumber
                      defaultValue={item.deduction_amount}
                      bordered={true}
                      keyboard={false}
                      controls={false}
                      // value={item.deduction_amount}
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                      // onChange={(e) => setTradeRates({ ...tradeRate, daily_rate: e ? e?.toString() : "" })}
                      className="flex flex-col justify-center addedField h-[40px]"
                      disabled
                    />
                  </Form.Item>
                </div>
              ))}

              <Form.List name="deductions">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Space key={key} align="baseline" className="space">
                        <Form.Item
                          label="Deduction type"
                          {...restField}
                          name={[name, "deductionType"]}
                          rules={[
                            { required: true, message: "Missing deduction" },
                          ]}
                        >
                          <Select
                            allowClear={true}
                            size="large"
                            placeholder="Choose deduction type"
                            style={{
                              width: "450px",
                            }}
                            onSelect={onSelect}
                          >
                            {props.deductionsTypes.map((item, index) => (
                              <Option key={index} value={item.id} style={{ textTransform: "capitalize" }}>
                                {item.title}
                              </Option>
                            ))}
                            {props?.title !== "Add Deductions" && <option value="Other">Other</option>}
                          </Select>
                        </Form.Item>

                        {other && (
                          <Form.Item
                            label="Description"
                            {...restField}
                            name={[name, "description"]}
                          >
                            <Input className="addedField" size="large" />
                          </Form.Item>
                        )}

                        <Form.Item
                          label="Amount"
                          {...restField}
                          name={[name, "amount"]}
                          rules={[
                            { required: true, message: "Missing amount" },
                          ]}
                        >
                          <InputNumber
                            bordered={true}
                            disabled={false}
                            keyboard={false}
                            controls={false}
                            // value={item.deduction_amount}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                            // onChange={(e) => setTradeRates({ ...tradeRate, daily_rate: e ? e?.toString() : "" })}
                            className="flex flex-col justify-center addedField h-[40px]"
                          />
                        </Form.Item>
                        <Icon
                          icon="mdi:minus-circle-outline"
                          color="#f5222d"
                          height="20px"
                          className="remove"
                          onClick={() => remove(name)}
                        />
                      </Space>
                    ))}
                    <Form.Item>
                      <Button className="add" onClick={() => add()}>
                        <PlusOutlined />
                        <span className="addText">Add deductions</span>
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
              <Form.Item>
                <div className="buttons">
                  <Button
                    type="secondary"
                    onClick={props.handleClose}
                    className="secondaryBtn"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    onClick={props.handleOk}
                    className="primaryBtn"
                  >
                    Save
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </div>
        </div>
      </StyledDeductionsModal>
    </Modal>
  );
};

export default EditDeductionsModal;

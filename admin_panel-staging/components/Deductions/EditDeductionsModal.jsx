import { Alert, Button, Form, Input, InputNumber, Modal, Select, Space, notification } from 'antd'
import React, { useEffect, useState } from 'react'
import { StyledDeductionsModal } from '../Tables/PayrollTable.styled'
import { Icon } from '@iconify/react';
import { PlusOutlined } from '@ant-design/icons';
import { toMoney } from '../../helpers/excelRegister';

const { Option } = Select;


const validateNumber = (value, totalEarnings) => {
    if (Number(value?.target?.value) && !value?.target?.value.includes(" ")
        && Number(value?.target?.value) > 0 && Number(value?.target?.value) <= Number(totalEarnings)
    ) {
        return {
            validateStatus: 'success',
            errorMsg: null,
        }
    }
    return {
        validateStatus: 'error',
        errorMsg: `Amount must be a positive number and less or equal to ${toMoney(totalEarnings)} as total restaurants deduction.`,
    };
}

export default function EditDeductionsModal(
    {
        modalOpen,
        handleDeductionWorker,
        onFinishFailed,
        workersSelectedDeductions,
        deductionsTypes,
        handleClose,
        onSelect,
        other,
        form,
        workerSelected
    }) {
    const [amount, setAmount] = useState({ value: 1 });
    const [totalEarnings, setTotalEarnings] = useState(0);

    useEffect(() => {
        setTotalEarnings(workerSelected?.amount_available_restaurant);
    }, [workerSelected]);

    const onValueChange = (value) => {
        setAmount({ ...validateNumber(value, totalEarnings), value });
    };

    const onBlur = (value) => {
        setAmount({ ...validateNumber(value, totalEarnings), value });
    }

    const handleFinish = () => {
        const values = form.getFieldsValue();

        if (workersSelectedDeductions?.deductions?.length === 0) {
            const totaleductions = values?.deductions?.reduce((acc, item) => {
                return acc + parseInt(item.amount.toString())
            }, 0)

            if (totaleductions > parseInt(workerSelected?.amount_available_restaurant.toString())) {
                setAmount({ ...validateNumber(totaleductions, workerSelected?.amount_available_restaurant), totaleductions })
            } else {
                handleDeductionWorker(values.deductions)
            }

        } else {
            let totaleductionsValues = 0;
            const totaleductionsSelected = workersSelectedDeductions?.deductions?.reduce((acc, item) => {
                return acc + parseInt(item.amount.toString())
            }, 0)
            if (values?.deductions.length > 0) {
                totaleductionsValues = values?.deductions?.reduce((acc, item) => {
                    return acc + parseInt(item.amount.toString())
                }, 0);
            }

            const totaleductions = totaleductionsSelected + totaleductionsValues;


            if (totaleductions > parseInt(workerSelected?.amount_available_restaurant.toString())) {
                setAmount({ ...validateNumber(totaleductions, workerSelected?.amount_available_restaurant), totaleductions })
            } else {
                handleDeductionWorker(values.deductions)
            }
        }

    };
    const onClose = () => {
        setAmount({ value: 1, validateStatus: 'success', errorMsg: null });
        handleClose();
    }

    return (
        <Modal
            centered
            open={modalOpen}
            onOk={handleDeductionWorker}
            onCancel={onClose}
            // closeIcon={<Icon icon="fe:close" className="close" />}
            title="Add Deductions"
            bodyStyle={{
                height: "fit-content",
            }}
            footer={null}
        >
            <StyledDeductionsModal>
                <div className="body">
                    <div>
                        <Form
                            onFinish={handleFinish}
                            onFinishFailed={onFinishFailed}
                            form={form}
                            layout="vertical"
                        >
                            {amount.validateStatus === 'error' && <Alert
                                message="Error"
                                description={Number(totalEarnings) > 0 ? amount.errorMsg : "Maximum deduction amount for this worker have been reached"}
                                type="error"
                                showIcon
                                closable={false}
                                style={{
                                    margin: "10px 0px",
                                    borderRadius: "5px",
                                }}
                            />}
                            {
                                workersSelectedDeductions?.deductions?.map((itemx, indexx) => (
                                    <div key={indexx} className='space'>
                                        <span className="field" style={{ cursor: "pointer", color: "#ccdbe1", fontSize: "16px", fontWeight: "500" }}>{itemx.title}</span>
                                        <span className="field" style={{ cursor: "pointer", color: "#ccdbe1", fontSize: "16px", fontWeight: "500" }}>{toMoney(itemx?.amount)}</span>
                                    </div>
                                ))
                            }
                            <Form.List name="deductions" initialValue="">
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
                                                        {deductionsTypes.map((item, index) => (
                                                            <Option key={index} value={item.id}>
                                                                {item.title}
                                                            </Option>
                                                        ))}
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
                                                    // validateStatus={amount.validateStatus}
                                                    // help={amount.errorMsg}
                                                    label="Amount"
                                                    {...restField}
                                                    name={[name, "amount"]}
                                                    rules={[
                                                        { required: true, message: "Missing amount" },
                                                    ]}
                                                >
                                                    <Input
                                                        // disabled={false}
                                                        // keyboard={false}
                                                        // controls={false}
                                                        // formatter={(value) => `${value.toString()}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                        // parser={(value) => value.toString().replace(/\$\s?|(,*)/g, '')}
                                                        style={{ width: "205px" }}
                                                        className="addedField"
                                                        size="large"
                                                        value={amount.value}
                                                        onChange={onValueChange}
                                                        onBlur={onBlur}
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
                                            <Button type="secondary" className="secondaryBtn bg-[#B6EBFF]" onClick={() => add()}>
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
                                        onClick={onClose}
                                        className="secondaryBtn"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        className="primaryBtn"
                                        style={{
                                            color: "var(--button-color)",
                                        }}
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
    )
}

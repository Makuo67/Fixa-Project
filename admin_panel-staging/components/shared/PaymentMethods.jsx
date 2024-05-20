import React, { useEffect, useState } from 'react'
import { Button, Form, Input, Select, Switch } from 'antd'
import { itemStyles } from "@/components/Forms/WorkerRegistrationForm";
import { Icon } from "@iconify/react";
import { PlusOutlined } from "@ant-design/icons";
import { PlaceHolder, renderOption } from '../WorkerRegistration/PaymentMethods';
import { useUserAccess } from '../Layouts/DashboardLayout/AuthProvider';
import { extractPaymentMethods, extractPaymentMethodsValues } from '@/utils/transformObject';
import { getCompanyPaymentMethods } from '@/helpers/payment-methods/payment-methods';
import { setItem } from 'localforage';
import { accessSubpageEntityRetrieval } from '@/utils/accessLevels';

export const PaymentMethods = ({ showTitle, titleText, cancelText, paymentMethods, handleCancel, handleSave, saveLoading }) => {
    const [form] = Form.useForm();
    const [payments, setPayments] = useState([])
    const [items, setItems] = useState(paymentMethods)

    const { userProfile } = useUserAccess();
    const { user_access } = userProfile;

    useEffect(() => {
        getCompanyPaymentMethods().then((data) => {
            setPayments(extractPaymentMethods(data));
        });
    }, [])

    const filterOption = (input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

    const onSearch = (value) => {
        console.log("search:", value);
    };

    const onSelectPayment = (value, data, key) => {
        setItems(
            items.map((item, i) => ({
                ...item,
                payment_method_id: i === key ? value : item.payment_method_id
            }))
        )
    }

    const onChangePaymentName = (value, key) => {
        setItems(
            items.map((item, i) => ({
                ...item,
                account_name: i === key ? value : item.account_name
            }))
        )

    }

    const onChangePaymentNumber = (value, key) => {
        setItems(
            items.map((item, i) => ({
                ...item,
                account_number: i === key ? value : item.account_number
            }))
        )
    }

    const handleSwitch = (index) => {
        setItems(
            items.map((item, i) => ({
                ...item,
                is_active: i === index ? !item.is_active : false,
            }))
        )
    }

    const onFinish = () => {
        const payment_methods = extractPaymentMethodsValues(items)
        handleSave(payment_methods)
        form.resetFields();
    }

    const onFinishFailed = (errors) => {
        console.log("OnfinishFailed", errors);
    }

    return (
        <>
            <Form
                form={form}
                layout="vertical"
                className="flex flex-col gap-8"
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
            >
                {showTitle && (

                    <div className="text-center">
                        <h1 className="text-2xl font-normal">{titleText}</h1>
                    </div>
                )}
                <Form.List name="payment_methods"
                    initialValue={items}
                >
                    {(fields, { add, remove }) => {
                        return (
                            <div className="flex flex-col gap-8">
                                {fields.map(({ key, name, ...restField }) => {
                                    return (
                                        <div key={key}>
                                            {/* =====  ===== */}
                                            <div className="flex flex-col rounded-lg gap-2 border border-primary p-4">
                                                <div
                                                    className="flex items-center text-bder-color cursor-pointer justify-end"
                                                    onClick={() => {
                                                        remove(name)
                                                        setItems(items.filter((item, i) => i !== key));
                                                        // handleAccountHolderView(null, key, 'delete', null)
                                                    }}
                                                >
                                                    <Icon icon="charm:cross" width={20} height={20} />
                                                    <span>Delete</span>
                                                </div>
                                                <div className={""}>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, "payment_method_id"]}
                                                        label={
                                                            <span className="text-sub-title cursor-pointer">
                                                                Methods
                                                            </span>
                                                        }
                                                    >
                                                        <Select
                                                            showSearch
                                                            optionFilterProp="children"
                                                            filterOption={filterOption}
                                                            onSearch={onSearch}
                                                            onSelect={(value, data) => onSelectPayment(value, data, key)}
                                                            style={itemStyles.inputStyles}
                                                            options={payments?.map((item) => ({
                                                                value: item.id,
                                                                label: item.name,
                                                                payment_method_id: item.id,
                                                                is_bank: item.is_bank ?? false
                                                            }))}
                                                            placeholder={<PlaceHolder />}
                                                            optionRender={renderOption}
                                                        />
                                                    </Form.Item>
                                                    {items && typeof items[key]?.payment_method_id === "string" && (
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, "account_name"]}
                                                            // rules={[
                                                            //     { validator: validatePhoneInputList },
                                                            // ]}
                                                            label={
                                                                <span className="text-sub-title cursor-pointer">
                                                                    Account Holder Name
                                                                </span>
                                                            }
                                                        >
                                                            <Input
                                                                disabled={false}
                                                                style={itemStyles.inputStyles}
                                                                onChange={(e) => onChangePaymentName(e.target.value, key)}
                                                            />
                                                        </Form.Item>
                                                    )}
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, "account_number"]}
                                                        rules={[
                                                            {
                                                                required: true,
                                                                message: 'Please input the account number!',
                                                            },
                                                            {
                                                                pattern: typeof items[key]?.payment_method_id === "string" ? ""
                                                                    : payments?.find(item => item.id === items[key]?.payment_method_id)?.name?.toLowerCase().includes('airtel') ? /^(072|073)\d{7}$/ : payments?.find(item => item.id === items[key]?.payment_method_id)?.name?.toLowerCase().includes('mtn') ? /^(078|079)\d{7}$/
                                                                        : "",
                                                                message: 'Please input a valid account number.',
                                                            },
                                                        ]}
                                                        label={
                                                            <span className="text-sub-title cursor-pointer">
                                                                Account Number
                                                            </span>
                                                        }
                                                    >
                                                        <Input
                                                            disabled={false}
                                                            style={itemStyles.inputStyles}
                                                            onChange={(e) => onChangePaymentNumber(e.target.value, key)}
                                                        />
                                                    </Form.Item>

                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, "is_active"]}
                                                    >
                                                        <div className='flex gap-2 w-full' >
                                                            <Switch
                                                                onChange={() => handleSwitch(key)}
                                                                className={`${items[key]?.is_active ? "activeSwitchBtn" : "switchBtn"}`}
                                                                checked={items[key]?.is_active}
                                                                defaultChecked={items[key]?.is_active}
                                                            />
                                                            <p className="text-sub-title space-x-3">
                                                                Set as primary payment method
                                                            </p>
                                                        </div>
                                                    </Form.Item>
                                                </div>
                                            </div>
                                        </div>)
                                }
                                )
                                }
                                <div className="">
                                    {user_access && accessSubpageEntityRetrieval(user_access, 'workforce', 'workers', 'register workers') && (
                                        <Form.Item>
                                            <Button
                                                type="secondary"
                                                className="secondaryCustomBtn w-full"
                                                onClick={() => {
                                                    add()
                                                    setItems(
                                                        [
                                                            ...items,
                                                            {
                                                                account_number: "",
                                                                account_name: "",
                                                                payment_method_id: null,
                                                                is_active: false,
                                                            }
                                                        ]
                                                    )
                                                }}
                                                icon={<PlusOutlined />}
                                            >
                                                Add Payment
                                            </Button>
                                        </Form.Item>
                                    )}
                                </div>
                                {/* ===== Buttons ==== */}
                                {user_access && accessSubpageEntityRetrieval(user_access, 'workforce', 'workers', 'register workers') && (
                                    <div className="flex gap-4 justify-center">
                                        <Form.Item>
                                            <Button
                                                className="secondaryCustomBtn w-40"
                                                onClick={handleCancel}
                                            >
                                                {cancelText}
                                            </Button>
                                        </Form.Item>

                                        <Form.Item>

                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                className="primaryBtnCustom w-40"
                                                loading={saveLoading ?? false}
                                            >
                                                Save
                                            </Button>
                                        </Form.Item>
                                    </div>
                                )}
                            </div>
                        )
                    }}
                </Form.List>
            </Form>
        </>
    )
}

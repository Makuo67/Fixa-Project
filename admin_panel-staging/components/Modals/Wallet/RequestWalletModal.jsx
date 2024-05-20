import { itemStyles } from '@/components/Forms/WorkerRegistrationForm';
import UploadFile from '@/components/shared/UploadFile';
import { getAllPaymentMethods, getCompanyPaymentMethods } from '@/helpers/payment-methods/payment-methods';
import { requestNewWallet } from '@/helpers/wallet/wallet';
import { validateEmail } from '@/utils/regexes';
import { Icon } from '@iconify/react';
import { Button, Checkbox, Col, Divider, Form, Input, Modal, Row, Select, Spin, Tooltip, Upload, message, notification } from 'antd'
import React, { useEffect, useState } from 'react'

const { Dragger } = Upload;
export const RequestWalletModal = ({ isModalOpen, setShowModal, setReloadRequests }) => {
    const [form] = Form.useForm()
    const [checkTerms, setCheckTerms] = useState(null)
    const [paymentMethods, setPaymentMethods] = useState([])
    const [btnLoading, setBtnLoading] = useState(false)
    const [newWallet, setNewWallet] = useState({
        certificate_link: "",
        email: "",
        payment_method: "",
    })

    useEffect(() => {
        getCompanyPaymentMethods().then((response) => {
            setPaymentMethods(response)
        })
    }, [])

    const allowedExtensions = ['.pdf'];
    // const acceptExtensions = allowedExtensions.join(',');


    const handleFileUpload = (file_url) => {
        setNewWallet({ ...newWallet, certificate_link: file_url })
    }
    const handleOk = async () => {
        setBtnLoading(true)
        requestNewWallet(newWallet).then((response) => {
            if (response?.status === "success" || response?.data) {
                notification.success({
                    message: "Success",
                    description: "Wallet request was successfully!",
                })
                setReloadRequests(true)
                setBtnLoading(false)
                setShowModal(false);
            } else {
                setBtnLoading(false)
                notification.error({
                    message: "Failed",
                    description: Array.isArray(response?.error) ? response?.error[0] : "Uploading file failed, please try again!" ,
                })
            }
        })
    };
    const handleCancel = () => {
        setShowModal(false);
    };

    const filterOption = (input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

    const onSearch = (value) => {
        console.log("search:", value);
    };

    const onCheckboxChange = (e) => {
        setCheckTerms(e.target.checked);
    };

    return (
        <>
            <Modal
                title={false}
                open={isModalOpen}
                // onOk={handleOk}
                onCancel={handleCancel}
                footer={null}
            >
                <div className='className="flex flex-col space-y-11"'>
                    <div className="text-start">
                        <h1 className="text-2xl font-normal">New Wallet</h1>
                    </div>
                    <Divider />
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleOk}
                        className="flex flex-col gap-8"
                        requiredMark={false}
                    >
                        <Row gutter={16}>
                            {/* <Col span={12}>
                                <Form.Item
                                    name="email"
                                    rules={[
                                        {
                                            required: true,
                                            message: "Please input the email!"
                                        },
                                        { validator: validateEmail },
                                    ]}
                                    label={
                                        <span className="text-sub-title cursor-pointer">
                                            Billing Email: <span style={{ color: "red" }}>*</span>
                                        </span>
                                    }
                                >
                                    <Input
                                        disabled={false}
                                        style={itemStyles.inputStyles}
                                        onChange={(e) => setNewWallet({ ...newWallet, email: e.target.value })}
                                    />
                                </Form.Item>
                            </Col> */}
                            <Col span={24}>
                                <Form.Item
                                    name="payment_method"
                                    rules={[
                                        {
                                            required: true,
                                            message: "Please select the wallet type!"
                                        },
                                    ]}
                                    label={
                                        <span className="text-sub-title cursor-pointer">
                                            Wallet Type: <span style={{ color: "red" }}>*</span>
                                        </span>
                                    }>
                                    <Select
                                        showSearch
                                        optionFilterProp="children"
                                        filterOption={filterOption}
                                        onChange={(e) => setNewWallet({ ...newWallet, payment_method: parseInt(e) })}
                                        onSearch={onSearch}
                                        style={itemStyles.inputStyles}
                                        options={paymentMethods?.map((item) => ({
                                            value: item.id,
                                            label: item.name.toLowerCase() === "kremit" ? "Bank" : item.name,
                                        }))}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item
                            name={[name, "rdb_certificate"]}
                            rules={[
                                {
                                    required: true,
                                    message: "Please upload your company's certificate!"
                                },
                            ]}
                            label={
                                <span className="text-sub-title cursor-pointer">
                                    Upload your Company Full Certificate: <span style={{ color: "red" }}>*</span>
                                </span>
                            }
                        >
                            <div className='w-full'>
                                {/* <Spin spinning={uploadLoading}> */}
                                <UploadFile setFileUrl={handleFileUpload} uploadText="Select a PDF file to upload or drag and drop it here" />
                                {/* </Spin> */}
                            </div>
                        </Form.Item>
                        <Form.Item>
                            <Checkbox checked={checkTerms} onChange={onCheckboxChange}>
                                I have read and understood the terms and conditions.
                            </Checkbox>
                        </Form.Item>
                        <div className="flex gap-4 justify-center">
                            <Form.Item
                            rules={[
                                {
                                    required: true,
                                    message: "Please Confirm that you agree to our terms and conditions"
                                }
                            ]}
                            >
                                <Tooltip title={`${!checkTerms ? "Make sure you aggree to terms and conditions.": ""}`}>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        // onClick={handleOk}
                                        className={`${checkTerms ? "primaryBtn" : "primaryBtnDisabled"}`}
                                        loading={btnLoading ?? false}
                                        disabled={checkTerms === true ? false : true}
                                    >
                                        Submit
                                    </Button>
                                </Tooltip>
                            </Form.Item>
                        </div>
                    </Form>
                </div>
            </Modal>
        </>
    )
}

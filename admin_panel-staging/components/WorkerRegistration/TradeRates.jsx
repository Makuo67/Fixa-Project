import { Button, Form, Input, Popconfirm, Row, Select, message, notification } from "antd"
import { PlusOutlined, InfoCircleOutlined } from "@ant-design/icons"
import { Content } from "../shared/Content"
import { itemStyles } from "../Forms/WorkerRegistrationForm"
import { useEffect, useRef, useState } from "react"
import { useUserAccess } from "../Layouts/DashboardLayout/AuthProvider";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { registerWorkerContactDetails } from "@/helpers/workforce/workforce";
import { getServices } from "@/redux/actions/workforce.actions";
import { capitalizeAll } from "@/helpers/capitalize";
import { addService } from "@/redux/actions/services.actions";
import moment from "moment"
import { InputNumber } from "antd/lib"
import { get, set } from "idb-keyval"
import { decodeJSONBase64, encodeJSONBase64 } from "@/utils/decodeBase"
import { NotFoundContent } from "../Onboarding/Forms/WorkerRates"
import { accessSubpageEntityRetrieval } from "@/utils/accessLevels"

export const TradeRates = ({ workerRegisteredId, handleBackStep, handleNextStep }) => {
    const [form] = Form.useForm()
    const router = useRouter();
    const dispatch = useDispatch();
    const { userProfile } = useUserAccess();
    const { user_access } = userProfile;
    const serviceNameRef = useRef(null);

    const [btnLoading, setBtnLoading] = useState(false);
    const [trades, setTrades] = useState([])
    const [tradeRate, setTradeRates] = useState({
        service_id: "",
        daily_rate: ""
    })
    const [serviceModal, setServiceModal] = useState(false);
    const [serviceName, setServiceName] = useState(null);
    const [addedService, setAddedService] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        dispatch(getServices()).then((response) => {
            setTrades(response)
        })
    }, [])

    useEffect(() => {
        if (workerRegisteredId) {
            get("tradeRateForm").then((data) => {
                if (data) {
                    const formInfo = decodeJSONBase64(data)
                    // console.log("SAVED DATA", formInfo)
                    setTradeRates(formInfo?.trades_services)
                    form.setFieldsValue({
                        trade: parseInt(formInfo?.trades_services?.service_id),
                        daily_rate: formInfo?.trades_services?.daily_rate
                    })
                }
            })
        }
    }, [workerRegisteredId])

    const onSearch = (value) => {
        // console.log('search:', value);
        setServiceName(value);
    };
    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

    const onSaveService = () => {
        serviceNameRef.current = serviceName;
        setServiceModal(true)
    }

    const handleAddService = () => {
        const payload = {
            "name": serviceNameRef.current,
            "icon_class": null,
            "service_status": "on",
            "locale": "en",
            "published_at": moment(),
            "created_at": moment(),
            "updated_at": moment(),
            "localizations": []
        }
        dispatch(addService(payload)).then((res) => {
            setAddedService(true);
            // setTradeRates
            dispatch(getServices()).then((response) => {
                setTrades(response)
            });
            setTradeRates({ ...tradeRate, service_id: res?.id.toString() })
            form.setFieldValue("trade", capitalizeAll(res?.name))
            message.success(`Created service ${serviceNameRef.current} successfully`);
        }).finally(() => {
            setServiceModal(false);
            setAddedService(false);
        })
    };
    const handleCancel = () => {
        setServiceModal(false);
    };

    const onFinish = async () => {

        const contactDetails = {
            "trades_services": tradeRate
        }
        const encodedContactDetails = encodeJSONBase64(contactDetails)

        setBtnLoading(true);

        await registerWorkerContactDetails(workerRegisteredId, contactDetails)
            .then((response) => {
                if (response.status == 'success' && Object.keys(response?.data).length > 0) {
                    form.resetFields();
                    setBtnLoading(false);
                    set("tradeRateForm", encodedContactDetails)
                    // Go to next step  
                    handleNextStep()
                } else {
                    setBtnLoading(false);
                }
            })
            .catch((error) => {
                console.log("errors", error)
                setBtnLoading(false)
            });
    }
    const onFinishFailed = async (errorInfo) => {
        console.log("Failed:", errorInfo);
        notification.error({
            message: "Error",
            description: `Failed ${errorInfo.errorFields.map((item) => item.errors)}`,
        });
    }
    return (
        <Content>
            <div className="flex flex-col items-center space-y-8">
                <div className="w-1/2">
                    <h1 className="text-xl md:text-2xl font-medium text-black text-center">Trade and rate</h1>
                    <Form
                        form={form}
                        layout="vertical"
                        className="flex flex-col gap-8"
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                    >
                        <div className="">
                            <Form.Item
                                name={"trade"}
                                label="Trade"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Select a trade',
                                    }
                                ]}
                            >
                                <Select
                                    showSearch
                                    placeholder="Select a trade"
                                    optionFilterProp="children"
                                    value={tradeRate.service_id}
                                    onChange={(e) => setTradeRates({ ...tradeRate, service_id: e?.toString() })}
                                    onSearch={onSearch}
                                    filterOption={filterOption}
                                    style={itemStyles.inputStyles}
                                    options={trades?.map((item) => ({
                                        value: item.id,
                                        label: capitalizeAll(item?.name),
                                    }))}
                                    notFoundContent={
                                        <NotFoundContent
                                            handleCancel={handleCancel}
                                            serviceModal={serviceModal}
                                            serviceNameRef={serviceNameRef}
                                            serviceLoading={addedService}
                                            handleAddService={handleAddService}
                                            onSaveService={onSaveService} />
                                    }
                                />
                            </Form.Item>
                            <Form.Item
                                name={"daily_rate"}
                                label="Daily Rate (RWF)"
                                tooltip={{
                                    title: "Amount per shift for this trade.",
                                    icon: <InfoCircleOutlined />,
                                }}
                                rules={[
                                    {
                                        required: true,
                                        message: 'Enter a rate',
                                    }
                                ]}>
                                <InputNumber
                                    bordered={true}
                                    disabled={false}
                                    keyboard={false}
                                    controls={false}
                                    value={tradeRate.daily_rate}
                                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                                    onChange={(e) => setTradeRates({ ...tradeRate, daily_rate: e ? e?.toString() : "" })}
                                    className="flex flex-col justify-center"
                                    style={itemStyles.inputStyles}
                                />
                            </Form.Item>
                        </div>
                        <div className="flex flex-row w-full gap-3 items-center justify-center">
                            <Form.Item>
                                <Button
                                    type="secondary"
                                    onClick={() => handleBackStep()}
                                    className="secondaryBtn">Back</Button>
                            </Form.Item>

                            <Form.Item>
                                {user_access && accessSubpageEntityRetrieval(user_access, 'workforce', 'workers', 'register workers') && (

                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        className="primaryBtn"
                                        loading={btnLoading}
                                    // onClick={handleNextStep}
                                    >
                                        Next
                                    </Button>
                                )}
                            </Form.Item>
                        </div>
                    </Form>
                </div>
            </div>
        </Content>
    )
}
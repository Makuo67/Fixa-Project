import { Button, Col, Form, Input, Row, Select, Space, message, notification } from "antd"
import { useEffect, useState } from "react";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";

import { useUserAccess } from "../Layouts/DashboardLayout/AuthProvider";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { get, set } from "idb-keyval";
import { itemStyles } from "../Forms/WorkerRegistrationForm";
import { Content } from "../shared/Content";
import { getNextOfKinRelations, registerWorkerContactDetails } from "@/helpers/workforce/workforce";
import { transformEmergencyInfoObject } from "@/utils/transformObject";
import { getAllDistricts } from "@/redux/actions/services.actions";
import { decodeJSONBase64, encodeJSONBase64 } from "@/utils/decodeBase";
import { isArray } from "underscore";
import { capitalizeAll } from "@/utils/capitalizeAll";
import { accessSubpageEntityRetrieval } from "@/utils/accessLevels";


const rowStyle = {
    // background: '#0092ff',
    padding: '8px 0',
}

export const ContactDetails = ({ workerRegisteredId, handleBackStep, handleNextStep }) => {
    const [btnLoading, setBtnLoading] = useState(false);
    const [inputsDisabled, setInputsDisabled] = useState(false);
    const [relations, setRelations] = useState([])
    const [districts, setDistricts] = useState([])
    const [personalContactData, setPersonalContactData] = useState({
        phone_number: "",
        email: "",
        district: "",
    });
    const [emergencyContactData, setEmergencyContactData] = useState([])

    const [form] = Form.useForm()
    const router = useRouter();
    const dispatch = useDispatch();
    const {  userProfile } = useUserAccess();
    const { user_access } = userProfile;

    useEffect(() => {
        getNextOfKinRelations().then((data) => {
            setRelations(data)
        })
        dispatch(getAllDistricts()).then((data) => {
            setDistricts(data)
        });
    }, [])

    useEffect(() => {
        if (workerRegisteredId) {
            get("contactFormData").then((data) => {
                if (data) {
                    const formInfo = decodeJSONBase64(data)
                    // console.log("SAVED DATA", formInfo, formInfo?.emergency_contacts?.slice(1))
                    setPersonalContactData(formInfo?.personal_contacts)
                    form.setFieldsValue({
                        phone_number: formInfo?.personal_contacts?.phone_number,
                        email: formInfo?.personal_contacts?.email,
                        district: parseInt(formInfo?.personal_contacts?.district),
                        emergency_name_0: formInfo?.emergency_contacts?.[0]?.name,
                        emergency_relation_0: formInfo?.emergency_contacts?.[0]?.relation,
                        emergency_phone_number_0: formInfo?.emergency_contacts?.[0]?.phone_number
                    })
                    if (formInfo?.emergency_contacts?.length > 1) {
                        setEmergencyContactData(formInfo?.emergency_contacts?.slice(1))
                    }
                    // setInputsDisabled(true);
                }
            })
        }
    }, [workerRegisteredId])

    const removeEmergencyContact = (index) => {
        const newEmergencyContactData = [...emergencyContactData];
        newEmergencyContactData.splice(index, 1);
        setEmergencyContactData(newEmergencyContactData);
    }

    const onSearch = (value) => {
        console.log('search:', value);
    };

    // Filter `option.label` match the user type `input`
    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

    const onFinish = async (values) => {
        let newEmergencyInfo = [];
        let singleEmergencyInfo;
        let finalEmergencyInfo;

        const { emergencyInfo, ...rest } = values
        newEmergencyInfo = transformEmergencyInfoObject(rest)

        if (typeof values.emergencyInfo !== "undefined" && newEmergencyInfo && isArray(values.emergencyInfo)) {
            values?.emergencyInfo?.map((item) => {
                singleEmergencyInfo = {
                    name: item.emergency_name,
                    relation: item.emergency_relation,
                    phone_number: item.emergency_phone_number
                }
                newEmergencyInfo.push(singleEmergencyInfo)
            });
            newEmergencyInfo.push(...emergencyContactData)
            finalEmergencyInfo = newEmergencyInfo
        } else {
            newEmergencyInfo.push(...emergencyContactData)
            finalEmergencyInfo = newEmergencyInfo
        }

        const contactDetails = {
            "personal_contacts": personalContactData,
            "emergency_contacts": finalEmergencyInfo
        }
        const encodedContactDetails = encodeJSONBase64(contactDetails)

        // if (areAllInputsFilled()) {

        setBtnLoading(true);

        await registerWorkerContactDetails(workerRegisteredId, contactDetails)
            .then((response) => {
                if (response.status == 'success' && Object.keys(response?.data).length > 0) {
                    form.resetFields();
                    setBtnLoading(false);
                    set("contactFormData", encodedContactDetails)
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
        // }
    }

    const onFinishFailed = (errorInfo) => {
        notification.error({
            message: "Error",
            description: `Failed ${errorInfo.errorFields.map((item) => item.errors)}`,
        });
    }
    const validatePhoneInput = (rule, value) => {
        if (!value) {
            return Promise.resolve();
        }
        if (value.length === 10 && !isNaN(value) && value.startsWith('07')) {
            return Promise.resolve();
        }
        return Promise.reject('Phone number format 07xxxxxxxx');
    };
    const validateEmail = (rule, value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
            return Promise.resolve();
        }

        if (emailRegex.test(value)) {
            return Promise.resolve();
        }
        return Promise.reject('Please enter a valid email address.');
    };
    return (
        <Content>
            <div className="space-y-8">
                <h1 className="text-xl md:text-2xl font-medium text-black">Contact Details</h1>
                <Form
                    form={form}
                    layout="vertical"
                    className="flex flex-col gap-6"
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                >
                    <>
                        <div className="space-y-2">
                            <h2 className="heading-2">Personal contacts</h2>
                            <Row
                                gutter={{
                                    xs: 8,
                                    sm: 16,
                                    md: 24,
                                    lg: 32,
                                }}>
                                <Col span={8} className="gutter-row">
                                    <Form.Item

                                        label="Phone number :"
                                        name="phone_number"
                                        initialValue={personalContactData?.phone_number}
                                        rules={[
                                            { validator: validatePhoneInput },
                                        ]}
                                    >
                                        <Input
                                            placeholder="07XXXXXXXX"
                                            disabled={inputsDisabled}
                                            defaultValue={personalContactData?.phone_number}
                                            value={personalContactData?.phone_number}
                                            onChange={(e) => setPersonalContactData({ ...personalContactData, phone_number: e.target.value })}
                                            style={itemStyles.inputStyles}
                                            maxLength={10}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8} className="gutter-row">
                                    <Form.Item

                                        label="Email :"
                                        name="email"
                                        initialValue={personalContactData?.email}
                                        rules={[
                                            { validator: validateEmail },
                                        ]}
                                    >
                                        <Input
                                            placeholder="example@gmail.com"
                                            disabled={inputsDisabled}
                                            defaultValue={personalContactData?.email}
                                            value={personalContactData?.email}
                                            onChange={(e) => setPersonalContactData({ ...personalContactData, email: e.target.value })}
                                            style={itemStyles.inputStyles}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8} className="gutter-row">
                                    <Form.Item

                                        label="District of residence :"
                                        name="district"
                                        initialValue={personalContactData?.district ?? ""}
                                    >

                                        <Select
                                            showSearch
                                            placeholder="Select a district"
                                            optionFilterProp="children"
                                            disabled={inputsDisabled}
                                            defaultValue={personalContactData?.district ?? ""}
                                            value={personalContactData?.district ?? ""}
                                            onChange={(e) => setPersonalContactData({ ...personalContactData, district: e?.toString() })}
                                            onSearch={onSearch}
                                            filterOption={filterOption}
                                            style={itemStyles.inputStyles}
                                            options={districts?.map((item) => ({
                                                value: item.id,
                                                label: item.name,
                                            }))}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>
                        <div className="space-y-4">
                            <h2 className="heading-2">emergency contact</h2>
                            <Row
                                gutter={{
                                    xs: 4,
                                    sm: 8,
                                    md: 16,
                                    lg: 16,
                                }}>

                                <Col span={8} className="gutter-row">
                                    <Form.Item

                                        label="Name :"
                                        name="emergency_name_0"
                                    >
                                        <Input
                                            disabled={inputsDisabled}
                                            style={itemStyles.inputStyles}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8} className="gutter-row">
                                    <Form.Item

                                        label="Relation :"
                                        name="emergency_relation_0"
                                    >
                                        <Select
                                            showSearch
                                            placeholder="Select Relation"
                                            optionFilterProp="children"
                                            disabled={inputsDisabled}
                                            onSearch={onSearch}
                                            filterOption={filterOption}
                                            style={itemStyles.inputStyles}
                                            options={relations?.map((item) => ({
                                                value: item.id,
                                                label: capitalizeAll(item.name),
                                            }))}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8} className="gutter-row">
                                    <Form.Item
                                        label="Phone number :"
                                        name="emergency_phone_number_0"
                                        rules={[
                                            { validator: validatePhoneInput },
                                        ]}
                                    >
                                        <Input
                                            placeholder="07XXXXXXXX"
                                            disabled={inputsDisabled}
                                            style={itemStyles.inputStyles}
                                            maxLength={10}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>
                    </>
                    <div>
                        {emergencyContactData?.length > 0 && emergencyContactData?.map((item, index) => <Row gutter={{
                            xs: 4,
                            sm: 8,
                            md: 16,
                            lg: 16,
                        }}
                            key={index}>
                            <Col span={8} className="gutter-row">
                                <div className="border border-[#cccbca] bg-[#f0efed] rounded-md p-2 cursor-pointer">
                                    {item.name}
                                </div>
                            </Col>
                            <Col span={8} className="gutter-row">
                                <div className="border border-[#cccbca] bg-[#f0efed] rounded-md p-2 cursor-pointer">
                                    {item.relation}
                                </div>
                            </Col>
                            <Col span={8} className="gutter-row">
                                <div className="border border-[#cccbca] bg-[#f0efed] rounded-md p-2 cursor-pointer">
                                    {item.phone_number}
                                </div>
                            </Col>
                            <div className="w-full text-right px-2">
                                <MinusCircleOutlined className="text-bder-red cursor-pointer"
                                    onClick={() => removeEmergencyContact(index)}
                                />
                            </div>
                        </Row>
                        )
                        }
                    </div>
                    <div>
                        <Form.List name="emergencyInfo" className="">
                            {(fields, { add, remove }, { errors }) => (
                                <div className="space-y-8">
                                    {fields.map(({ key, name, ...restField }) => (
                                        <Row
                                            gutter={{
                                                xs: 4,
                                                sm: 8,
                                                md: 16,
                                                lg: 16,
                                            }}
                                            key={key}
                                        >
                                            <Col span={8} className="gutter-row">
                                                <Form.Item
                                                    {...restField}
                                                    label="Name"
                                                    name={[name, `emergency_name`]}
                                                >
                                                    <Input
                                                        placeholder="Name"
                                                        style={itemStyles.inputStyles}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={8} className="gutter-row">
                                                <Form.Item
                                                    {...restField}
                                                    label="Relation"
                                                    name={[name, `emergency_relation`]}
                                                >
                                                    <Select
                                                        showSearch
                                                        placeholder="Select Relation"
                                                        optionFilterProp="children"
                                                        onSearch={onSearch}
                                                        filterOption={filterOption}
                                                        style={itemStyles.inputStyles}
                                                        options={relations?.map((item) => ({
                                                            value: item.id,
                                                            label: capitalizeAll(item.name),
                                                        }))}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={8} className="gutter-row">
                                                <Form.Item
                                                    {...restField}
                                                    label="Phone number"
                                                    name={[name, `emergency_phone_number`]}
                                                    rules={[
                                                        { validator: validatePhoneInput },
                                                    ]}
                                                >
                                                    <Input
                                                        placeholder="07XXXXXXXX"
                                                        style={itemStyles.inputStyles}
                                                        maxLength={10}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <div className="w-full text-right px-2">
                                                <MinusCircleOutlined className="text-bder-red"
                                                    onClick={() => remove(name)}
                                                />
                                            </div>
                                        </Row>
                                    ))}
                                    <Form.ErrorList errors={errors} />
                                    <Form.Item>
                                        <Button className="add secondaryBtn" onClick={() => add()}>
                                            <PlusOutlined />
                                            <span className="addText">Add another</span>
                                        </Button>
                                    </Form.Item>
                                </div>
                            )}
                        </Form.List>
                    </div>
                    <Row className="gap-4">
                        <div className="flex flex-row w-full gap-3 items-center justify-center">
                            <Form.Item>
                                <Button
                                    type="secondary"
                                    onClick={() => handleBackStep()} className="secondaryBtn">Back</Button>
                            </Form.Item>

                            <Form.Item>
                                {user_access && accessSubpageEntityRetrieval(user_access, 'workforce', 'workers', 'register workers') && (

                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        className="primaryBtn"
                                        loading={btnLoading}
                                    >
                                        Next
                                    </Button>
                                )}
                            </Form.Item>
                        </div>
                    </Row>
                </Form>
            </div>
        </Content>
    )
}
import { useEffect, useState } from "react"
import { Form, Input, Select, DatePicker, notification, Button, Row, Col } from 'antd';
import dayjs from "dayjs";
import { get, set } from 'idb-keyval';

import { Content } from "../shared/Content";
import { getAllCountries, getCountries } from "../../helpers/projects/projects";
import { registerWorker } from "../../helpers/workforce/workforce";
import { useUserAccess } from "../Layouts/DashboardLayout/AuthProvider";
import { decodeJSONBase64, encodeJSONBase64 } from "@/utils/decodeBase";
import { accessSubpageEntityRetrieval } from "@/utils/accessLevels";

const { Option } = Select;
// styles
export const itemStyles = {
    inputStyles: { borderRadius: "4px", height: "40px", width: "100%", textDecoration: "capitalize" },
    loginInputStyles: { borderRadius: "4px", height: "40px !important", width: "100%", backgroundColor: "rgba(0, 0, 0, 0.25)", borderColor: "#ffffff !important", color: "#ffffff !important" }
}

const WorkerRegistrationForm = ({ rssbData, idSubmitted, handleNextStep, setWorkerRegisteredId, setCountryId, handleBackStep, workerRegisteredId }) => {

    const [formData, setFormData] = useState({
        nid_number: "",
        first_name: "",
        last_name: "",
        country: "",
        gender: "",
        date_of_birth: "",
        worker_id: workerRegisteredId ? parseInt(workerRegisteredId.toString()) : 0,
        phone_numbers_masked: []
    });
    const [btnLoading, setBtnLoading] = useState(false);
    const [countries, setCountries] = useState([]);
    const [inputsDisabled, setInputsDisabled] = useState(false);

    const [form] = Form.useForm();
    const { userAccess, setCompanyStatusLoading, userProfile } = useUserAccess();
    const { user_access, user_level } = userProfile;

    // func to get form from indexDB
    const getFormData = async () => {
        const formCoded = await get("regForm");
        if (formCoded) {
            // decode
            const formInfo = decodeJSONBase64(formCoded)
            setFormData(formInfo.formData);
            form.setFieldsValue(formInfo.formData);
            form.setFieldsValue({
                nid_number: formInfo.formData?.nid_number,
                first_name: formInfo.formData?.first_name,
                last_name: formInfo.formData?.last_name,
                date_of_birth: dayjs(formInfo.formData?.date_of_birth),
                gender: formInfo.formData?.gender,
                country: formInfo.formData?.country,
            });
            setInputsDisabled(formInfo.disabled);
        }
    }

    useEffect(() => {
        getAllCountries().then((data) => {
            setCountries(data)
        }).catch((err) => setCountries([]));
        getFormData();
    }, []);

    // func to save form in indexDB
    const saveFormData = (data, disabled, worker_id) => {
        const formInfo = {
            formData: {
                nid_number: data.nid_number,
                first_name: data.first_name,
                last_name: data.last_name,
                country: data.country,
                gender: data.gender,
                date_of_birth: data.date_of_birth,
                worker_id: worker_id,
                phone_numbers_masked: data.phone_numbers_masked
            },
            disabled: disabled
        };
        // encode json
        const encodedJson = encodeJSONBase64(formInfo);
        set("regForm", encodedJson);
    }

    /* === disabling inputs ==== */
    useEffect(() => {
        if (rssbData !== null && Object.keys(rssbData).length > 0) {
            setInputsDisabled(true);
            setFormData({
                ...formData,
                nid_number: rssbData?.nidNumber,
                first_name: rssbData?.firstName,
                last_name: rssbData?.lastName,
                country: rssbData?.country,
                date_of_birth: dayjs(rssbData.dateOfBirth, 'DD/MM/YYYY').format('YYYY-MM-DD'),
                phone_numbers_masked: rssbData?.phoneNumbersMasked,
            });

            // Update the form item's value using setFieldsValue
            form.setFieldsValue({
                nid_number: rssbData?.nidNumber,
                first_name: rssbData?.firstName,
                last_name: rssbData?.lastName,
                date_of_birth: dayjs(rssbData.dateOfBirth, 'DD/MM/YYYY'),
                gender: rssbData?.gender,
                country: rssbData?.country,
            });
        }

    }, [rssbData]);

    useEffect(() => {
        if (idSubmitted === false) {
            form.resetFields();
        }
    }, [idSubmitted]);

    const formItemLayout = {
        labelCol: {
            xs: {
                span: 24,
            },
            sm: {
                span: 24
            }
        },
        wrapperCol: {
            xs: {
                span: 24,
            },
            sm: {
                span: 24
            }
        }
    }

    const onFinish = async () => {
        setBtnLoading(true);
        await registerWorker(formData)
            .then((response) => {
                if (response.status == 'success' && Object.keys(response?.data).length > 0) {
                    // console.log("this response", response?.data)
                    setWorkerRegisteredId(response?.data?.id)
                    setCountryId(formData.country)
                    saveFormData(formData, inputsDisabled, response?.data?.id);
                    // form.resetFields();
                    // router.push('/workforce')
                    setBtnLoading(false);
                    // setCompanyStatusLoading(true)
                    handleNextStep()
                } else {
                    setBtnLoading(false);
                }
            })
            .catch((error) => {
                console.log("errors", error)
                setBtnLoading(false)
                // notification.error({ message: "Error", description: `Failed ${error.response?.data?.message}`, })
            });
    };

    const onFinishFailed = async (errorInfo) => {
        // Notification(`Failed: ${errorInfo.errorFields.map((item) => item.errors)}.`, 'error');
        notification.error({
            message: "Error",
            description: `Failed ${errorInfo.errorFields.map((item) => item.errors)}`,
        });

    }
    // Date picker default years (18 years from Now)
    // const eighteenYearsAgo = dayjs().subtract(18, 'years');

    return (
        <Content>
            <div className="pb-5">
                <h1 className="text-black text-2xl">Profile details</h1>
            </div>
            <Form
                {...formItemLayout}
                form={form}
                name="basic"
                labelAlign="left"
                initialValues={{
                    remember: true,
                }}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="off"
                className="flex flex-col gap-3"
                preserve={true}
            >
                <Row
                    gutter={{
                        xs: 8,
                        sm: 16,
                        md: 24,
                        lg: 32,
                    }}
                >
                    {/* ===== The left side ===== */}
                    <Col span={12}>

                        <Form.Item
                            label="First Name"
                            name="first_name"
                            rules={[
                                {
                                    required: true,
                                    message: 'Enter First Name',
                                },
                            ]}
                            initialValue={formData.first_name}
                        >
                            <Input
                                disabled={inputsDisabled}
                                defaultValue={formData.first_name}
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                style={itemStyles.inputStyles}
                            />

                        </Form.Item>

                        <Form.Item
                            label={`ID Number ${idSubmitted === false && '/ Passport'}`}
                            name="nid_number"
                            rules={[
                                {
                                    required: true,
                                    message: 'Enter NID number',
                                },
                            ]}
                            initialValue={formData.nid_number}
                        >
                            <Input
                                disabled={inputsDisabled}
                                defaultValue={formData.nid_number}
                                value={formData.nid_number}
                                onChange={(e) => setFormData({ ...formData, nid_number: e.target.value })}
                                style={itemStyles.inputStyles}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Gender"
                            name="gender"
                            rules={[
                                {
                                    required: true,
                                    message: 'Select Gender',
                                },
                            ]}
                            initialValue={formData.gender}
                        >
                            <Select
                                style={itemStyles.inputStyles}
                                defaultValue={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e })}
                            >
                                <Option value="male">Male</Option>
                                <Option value="female">Female</Option>
                            </Select>
                        </Form.Item>
                    </Col>

                    {/* ===== The Right side ===== */}
                    <Col span={12}>

                        <Form.Item
                            label="Last Name"
                            name="last_name"
                            rules={[
                                {
                                    required: true,
                                    message: 'Enter Last Name',
                                },
                            ]}
                            initialValue={formData.last_name}
                        >
                            <Input
                                disabled={inputsDisabled}
                                defaultValue={formData.last_name}
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                style={itemStyles.inputStyles}
                            />

                        </Form.Item>

                        <Form.Item
                            label="Date of Birth"
                            name="date_of_birth"
                            rules={[
                                {
                                    required: true,
                                    message: 'Enter Date of Birth',
                                },
                            ]}
                            initialValue={formData.date_of_birth && formData.date_of_birth !== "" && dayjs(formData.date_of_birth)}
                        >
                            <DatePicker
                                disabled={inputsDisabled}
                                defaultPickerValue={dayjs().subtract(18, 'years')}
                                defaultValue={formData.date_of_birth && dayjs(formData.date_of_birth)}
                                format="YYYY-MM-DD"
                                value={formData.date_of_birth && dayjs(formData.date_of_birth)}
                                onChange={(date, dateString) => {
                                    setFormData({
                                        ...formData,
                                        date_of_birth: dateString
                                    });
                                }}
                                style={itemStyles.inputStyles}
                            />
                        </Form.Item>

                        {idSubmitted === false && (

                            <Form.Item
                                label="Nationality"
                                name="country"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Select country',
                                    },
                                ]}
                                initialValue={formData.country}
                            >
                                <Select
                                    showSearch
                                    disabled={inputsDisabled}
                                    defaultValue={formData.country}
                                    value={formData.country}
                                    placeholder="Search to select"
                                    optionFilterProp="children"
                                    filterOption={(input, option) => option.children.includes(input.charAt(0).toUpperCase() + input.slice(1).toLowerCase())}
                                    filterSort={(optionA, optionB) =>
                                        optionA.children.toLowerCase().localeCompare(optionB.children.toLowerCase())
                                    }
                                    onChange={(e) => setFormData({ ...formData, country: e })}
                                    style={itemStyles.inputStyles}
                                >
                                    {countries.map((item, index) => (
                                        <Option value={item.id} key={item.id}>{item?.country_name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        )}

                    </Col>

                </Row>
                {/* ===== Buttons ===== */}
                <Row className="gap-4">
                    <div className="flex flex-row w-full gap-3 items-center justify-center">
                        <Form.Item>
                            <Button
                                type="secondary"
                                onClick={handleBackStep}
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
                </Row>

            </Form>
        </Content>
    )
}

export default WorkerRegistrationForm;
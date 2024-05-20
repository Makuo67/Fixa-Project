import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, notification, message, Form, Select } from 'antd';
import { useRouter } from 'next/router';
import _ from 'underscore';

import { registerWorkersBulk } from '../../helpers/workforce/workforce';
import { itemStyles } from '../Forms/WorkerRegistrationForm';
import { validateDailyEarnings, validateName, validatePhoneNumber } from '@/utils/regexes';
import { changeKey, updateKeys } from '@/utils/transformObject';
import { validateNidNumber } from '../../utils/regexes';
import { payoutAddBulkTemp } from '@/helpers/payments/payout/payout';
import { getAllPaymentMethods } from '@/helpers/payment-methods/payment-methods';
import { getIndexDB } from '@/utils/indexDBUtils';
import { decodeJSONBase64Workfoces } from '@/utils/decodeBase';
import { usePusher } from '@/context/PusherContext';
import { useUserAccess } from '../Layouts/DashboardLayout/AuthProvider';

const WorkersColumnsMapping = ({ uploadSuccess, fileId, fileName, fileData, fileColumns, handleCancel, type, paymentId, payoutInfo, handleNext, setViewSection }) => {
    const [form] = Form.useForm()
    const [columnsList, setColumnsList] = useState([]);
    const [expectedData, setExpectedData] = useState(null);
    const [btnLoading, setBtnLoading] = useState(false);
    const correctedDataRef = useRef([]);
    const [paymentMethods, setAllPaymentMethods] = useState([])
    const [saveTemp, setSaveTemp] = useState(false);

    const pusher_env = process.env.NEXT_PUBLIC_PUSHER_ENV;
    const router = useRouter();
    const pusher = usePusher();
    const { userProfile } = useUserAccess();
    const { id } = userProfile; // Logged in User ID
    // Specify the columns to exclude
    const columnsToExtractRegistration = [
        "idNumber",
        "phoneNumber",
        "service",
        "daily_earnings",
        "firstname",
        "lastname",
        "names",
    ];
    const columnsToExtractPayout = [
        "names",
        "amount",
        "payee_type",
        "account_number"
    ];
    const fullNamesPossibility = ["fullname", "full name", "full names", "fullnames", "name", "names", "full_name", "full_names", "amazina"];
    const lastFirstNamePossibility = ["firstname", "lastname", "first_name", "last_name", "first name", "last name", "second name", "firstnames", "lastnames", "first_names", "last_names", "first names", "last names", "second names"]

    useEffect(() => {
        transformColumns();
        getAllPaymentMethods().then((response) => {
            setAllPaymentMethods(response)
        })
    }, []);


    useEffect(() => {
        if (saveTemp && pusher_env) {
            const channelName = `temporary-workers-${pusher_env}-${fileId}-${id}`;
            const eventName = `temporary-workers-${pusher_env}-${fileId}-${id}-event`;

            let channel = pusher.subscribe(channelName);

            channel.bind(eventName,
                function (data) {
                    // console.log("data ==== ", data, expectedData?.length);
                    if (data.status === expectedData?.length) {
                        setSaveTemp(false)
                        setBtnLoading(false)
                        router.replace(`worker-registration/file/preview`);
                    }
                    // else {
                    //     setBtnLoading(false)
                    //     setSaveTemp(false)
                    // }
                }
            );

            return () => {
                pusher.unsubscribe();
                setBtnLoading(false)
                setSaveTemp(false)
            };
        }
    }, [saveTemp, pusher_env]);

    const transformColumns = () => {
        const columns = Object.entries(fileColumns).map((item) => ({
            key: item[0],
            name: item[1]
        }));
        setColumnsList(columns);
    }

    const onSearch = (value) => {
        console.log('search:', value);
    };

    // Filter `option.label` match the user type `input`
    const filterOption = (input, option) => {
        // console.log("option", option.label === input);
        return (option?.label ?? '').toLowerCase().includes(input.toLowerCase());
    }

    const setSelectionError = (field, errors) => {
        const fieldNames = ['idNumber', 'phoneNumber', 'service', 'daily_earnings', 'payee_name', 'payee_type', 'amount_to_pay', 'account_number', 'firstname', 'lastname', 'names'];
        const errorIndex = errors?.length > 0 ? errors[0]?.split("#")[1]?.split(" ")[0] : 0;

        fieldNames.forEach(fieldName => {
            if (field === "idNumber") {
                form.setFields([
                    {
                        name: field,
                        value: "",
                        errors: errors?.length > 0 && parseInt(errorIndex) !== 0 ? errors : ['The selected column data does not match worker NID numbers'],
                    },
                ]);
                // form.validateFields([fieldName]);
            } else if (field === "phoneNumber") {
                form.setFields([
                    {
                        name: field,
                        value: "",
                        errors: errors?.length > 0 && parseInt(errorIndex) !== 0 ? errors : ['The selected column data does not match worker phone numbers'],
                    },
                ]);
                // form.validateFields([fieldName]);
            } else if (field === "service") {
                form.setFields([
                    {
                        name: field,
                        value: "",
                        errors: errors?.length > 0 && parseInt(errorIndex) !== 0 ? errors : ['The selected column data does not match worker trades.'],
                    },
                ]);
            } else if (field === "payee_name") {
                form.setFields([
                    {
                        name: field,
                        value: "",
                        errors: errors?.length > 0 && parseInt(errorIndex) !== 0 ? errors : ['The selected column data does not match Payee Names.'],
                    },
                ]);
            } else if (field === "payee_type") {
                form.setFields([
                    {
                        name: field,
                        value: "",
                        errors: errors?.length > 0 && parseInt(errorIndex) !== 0 ? errors : ['The selected column data does not match Payee Types.'],
                    },
                ]);
            } else if (field === "account_number") {
                form.setFields([
                    {
                        name: field,
                        value: "",
                        errors: errors?.length > 0 && parseInt(errorIndex) !== 0 ? errors : ['The selected column data does not match Payee Account Number.'],
                    },
                ]);
            } else if (field === "daily_earnings") {
                form.setFields([
                    {
                        name: field,
                        value: "",
                        errors: errors?.length > 0 && parseInt(errorIndex) !== 0 ? errors : ['The selected column data does not match worker rates.'],
                    },
                ]);
            } else if (field === "amount_to_pay") {
                form.setFields([
                    {
                        name: field,
                        value: "",
                        errors: errors?.length > 0 && parseInt(errorIndex) !== 0 ? errors : ['The selected column data does not match Amount to pay.'],
                    },
                ]);
            }
            else if (field === "firstname") {
                form.setFields([
                    {
                        name: field,
                        value: "",
                        errors: errors?.length > 0 && parseInt(errorIndex) !== 0 ? errors : ['The selected column data does not match First Names.'],
                    },
                ]);
            }
            else if (field === "lastname") {
                form.setFields([
                    {
                        name: field,
                        value: "",
                        errors: errors?.length > 0 && parseInt(errorIndex) !== 0 ? errors : ['The selected column data does not match Last Names.'],
                    },
                ]);
            }
            else if (field === "names") {
                form.setFields([
                    {
                        name: field,
                        value: "",
                        errors: errors?.length > 0 && parseInt(errorIndex) !== 0 ? errors : ['The selected column data does not match Names.'],
                    },
                ]);
            }
            else {
                form.validateFields([fieldName]);
                form.setFields([
                    {
                        name: fieldName,
                        value: form.getFieldValue(fieldName),
                        errors: [],
                    },
                ]);
            }
        });

        return true;
    };

    const onSelectColumnValidate = (value, type) => {
        // TODO: Refactor, Check the undefined error        
        switch (type) {
            case "idNumber":
                const errorNid = []
                // Some to ignore (some) errors in a column && Do not push errors []
                const validateNid = fileData.some((item, index) => {
                    if (!validateNidNumber(item[value])) {
                        errorNid.push(`Check row #${item?.id} for possible errors`)
                    }
                    return validateNidNumber(item[value])
                });

                if (errorNid.length > 0) message.error(`Check ${value} column for possible errors`, 5);

                if (!validateNid) {
                    setExpectedData(null);
                    setSelectionError("idNumber", []);
                } else {
                    const renamedData = updateKeys(fileData, correctedDataRef.current, value, "idNumber");
                    correctedDataRef.current = renamedData;
                    setExpectedData(correctedDataRef.current);
                    setSelectionError("noIdNumber");
                }
                break;
            case "phoneNumber":
                const errorPhone = []
                const validatePhone = fileData.some((item, index) => {
                    if (!validatePhoneNumber(item[value])) {
                        errorPhone.push(`Check row #${item?.id} for possible errors`)
                    }
                    return validatePhoneNumber(item[value])
                });

                if (errorPhone.length > 0) message.error(`Check ${value} column for possible errors`, 5);

                if (!validatePhone) {
                    setExpectedData(null);
                    setSelectionError("phoneNumber", []);
                } else {

                    const renamedData = updateKeys(fileData, correctedDataRef.current, value, "phoneNumber");
                    correctedDataRef.current = renamedData;

                    setExpectedData(correctedDataRef.current);
                    setSelectionError("noPhoneNumber");
                }
                break;
            case "service":
                // Validate the selected column values
                const errorTrade = []
                const validateTrade = fileData.some((item, index) => {
                    if (!validateName(item[value])) {
                        errorTrade.push(`Check row #${item?.id} for possible errors`)
                    }
                    return validateName(item[value]);
                })

                if (errorTrade.length > 0) message.error(`Check ${value} column for possible errors`, 5);

                if (!validateTrade) {
                    setExpectedData(null);
                    setSelectionError("service", []);
                } else {

                    const renamedData = updateKeys(fileData, correctedDataRef.current, value, "service");
                    correctedDataRef.current = renamedData;

                    setExpectedData(correctedDataRef.current);
                    setSelectionError("noService");
                }
                break;
            case "payee_name":
                // Validate the selected column values
                const payeeError = []
                const validatePayeeName = fileData.every((item, index) => {
                    if (item[value] && item[value].length > 0) {
                        if (!validateName(item[value], index)) {
                            payeeError.push(`Check row #${item?.id} for possible errors`)
                        }
                        return validateName(item[value], index);
                    }
                })

                if (!validatePayeeName) {
                    setExpectedData(null);
                    setSelectionError("payee_name", payeeError);
                } else {

                    const renamedData = updateKeys(fileData, correctedDataRef.current, value, "names");
                    correctedDataRef.current = renamedData;

                    setExpectedData(correctedDataRef.current);
                    setSelectionError("noPayee");
                }
                break;
            case "payee_type":
                // Validate the selected column values
                const typeError = []
                const validateType = fileData.every((item, index) => {
                    if (!validateName(item[value])) {
                        typeError.push(`Check row #${item?.id} for possible errors`)
                    }
                    return validateName(item[value]);
                })

                if (!validateType) {
                    setExpectedData(null);
                    setSelectionError("payee_type", typeError);
                } else {
                    const renamedData = updateKeys(fileData, correctedDataRef.current, value, "payee_type");
                    correctedDataRef.current = renamedData;

                    setExpectedData(correctedDataRef.current);
                    setSelectionError("noPayeeType");
                }
                break;
            case "account_number":
                // Validate the selected column values
                const accountError = []
                const validateAccount = fileData.every((item, index) => {
                    if (!validatePhoneNumber(item[value])) {
                        accountError.push(`Check row #${item?.id} for possible errors`)
                    }
                    return validatePhoneNumber(item[value]);
                })

                if (!validateAccount) {
                    setExpectedData(null);
                    setSelectionError("account_number", accountError);
                } else {

                    const renamedData = updateKeys(fileData, correctedDataRef.current, value, "account_number");
                    correctedDataRef.current = renamedData;

                    setExpectedData(correctedDataRef.current);
                    setSelectionError("noAccount");
                }
                break;
            case "daily_earnings":
                // Validate the selected column values
                const errorEarnings = []
                const validateRate = fileData.some((item, index) => {
                    if (!validateDailyEarnings(item[value])) {
                        errorEarnings.push(`Check row #${item?.id} for possible errors`);
                    }
                    return validateDailyEarnings(item[value]);
                });

                if (errorEarnings.length > 0) message.error(`Check ${value} column for possible errors`, 5);

                if (!validateRate) {
                    setExpectedData(null);
                    setSelectionError("daily_earnings", []);
                }
                else {
                    const renamedData = updateKeys(fileData, correctedDataRef.current, value, "daily_earnings");
                    correctedDataRef.current = renamedData;

                    setExpectedData(correctedDataRef.current);
                    setSelectionError("noDailyEarnings");
                }
                break;
            case "amount_to_pay":
                // Validate the selected column values
                const errorPay = []
                const validatePay = fileData.every((item, index) => {
                    if (!validateDailyEarnings(item[value])) {
                        errorPay.push(`Check row #${item?.id} for possible errors`);
                    }
                    return validateDailyEarnings(item[value]);
                });
                if (!validatePay) {
                    setExpectedData(null);
                    setSelectionError("amount_to_pay", errorPay);
                }
                else {
                    const renamedData = updateKeys(fileData, correctedDataRef.current, value, "amount");
                    correctedDataRef.current = renamedData;

                    setExpectedData(correctedDataRef.current);
                    setSelectionError("noAmountToPay");
                }
                break;
            case "firstname":
                // Validate the selected column values
                const errorFirstname = []
                const validateFirstname = fileData.some((item, index) => {
                    if (!validateName(item[value])) {
                        errorFirstname.push(`Check row #${item?.id} for possible errors`)
                    }
                    return validateName(item[value]);
                })

                if (errorFirstname.length > 0) message.error(`Check ${value} column for possible errors`, 5);

                if (!validateFirstname) {
                    setExpectedData(null);
                    setSelectionError("firstname", []);
                } else {

                    const renamedData = updateKeys(fileData, correctedDataRef.current, value, "firstname");
                    correctedDataRef.current = renamedData;

                    setExpectedData(correctedDataRef.current);
                    setSelectionError("noFirstname");
                }
                break;
            case "lastname":
                // Validate the selected column values
                const errorLastname = []
                const validateLastname = fileData.some((item, index) => {
                    if (!validateName(item[value])) {
                        errorLastname.push(`Check row #${item?.id} for possible errors`)
                    }
                    return validateName(item[value]);
                })

                if (errorLastname.length > 0) message.error(`Check ${value} column for possible errors`, 5);

                if (!validateLastname) {
                    setExpectedData(null);
                    setSelectionError("lastname", []);
                } else {

                    const renamedData = updateKeys(fileData, correctedDataRef.current, value, "lastname");
                    correctedDataRef.current = renamedData;

                    setExpectedData(correctedDataRef.current);
                    setSelectionError("noLastname");
                }
                break;
            case "names":
                // Validate the selected column values
                const errorNames = []
                const validateNames = fileData.some((item, index) => {
                    if (!validateName(item[value])) {
                        errorNames.push(`Check row #${item?.id} for possible errors`)
                    }
                    return validateName(item[value]);
                })

                if (errorNames.length > 0) message.error(`Check ${value} column for possible errors`, 5);

                if (!validateNames) {
                    setExpectedData(null);
                    setSelectionError("names", []);
                } else {

                    const renamedData = updateKeys(fileData, correctedDataRef.current, value, "names");
                    correctedDataRef.current = renamedData;

                    setExpectedData(correctedDataRef.current);
                    setSelectionError("noNames");
                }
                break;
            default:
                message.error("Invalid type");
        }

    }

    const onFinishFailed = (errorInfo) => {
        notification.error({
            message: "Failed",
            description: `Failed ${errorInfo.errorFields.map((item) => item.errors)}`,
        });
    }

    const onFinishRegistration = async () => {
        if (expectedData) {
            // TODO: Call the API endpoint || Save data for preview
            const modifiedFileData = _.map(expectedData, (item) => _.pick(item, columnsToExtractRegistration));
            const services = await getIndexDB("services");

            const payload = {
                file_id: fileId,
                file_name: fileName,
                data: modifiedFileData,
                services: decodeJSONBase64Workfoces(services),
            }
            setBtnLoading(true)
            registerWorkersBulk(payload).then(async () => {
                setSaveTemp(true)
            })
        } else {
            notification.error({
                message: "Failed",
                description: `Failed to map columns`,
            });
        }
    }

    const onFinishPayout = async () => {
        if (expectedData) {
            // TODO: Call the API endpoint || Save data for preview
            const modifiedFileData = _.map(expectedData, (item) => _.pick(item, columnsToExtractPayout));
            // console.log("modifiedFileData", modifiedFileData)
            const momoPaymentId = _.find(paymentMethods, (item) => item.name.toLowerCase().includes("mtn"))?.id

            const payload = {
                file_id: fileId,
                file_name: fileName,
                payment_method_id: momoPaymentId,
                payment_id: paymentId,
                data: modifiedFileData
            }
            setBtnLoading(true)
            await payoutAddBulkTemp(payload).then(() => {
                setBtnLoading(false)
                handleNext()
                // TODO Redirect to Preview page
                // router.push({
                //     pathname: `/finance/payments/preview`,
                //     query: {
                //         paymentId,
                //         momoPaymentId,
                //         paymentName: payoutInfo.payout_name
                //     }
                // });
            })
        } else {
            notification.error({
                message: "Error",
                description: `Failed to map columns`,
            });
        }
    }

    return (
        <div>
            <div className="flex flex-col items-center justify-center gap-5 h-full w-full">
                <h1 className="text-black font-inter text-xl md:text-2xl font-medium leading-normal">
                    {type === "payout_momo" ? " Which rows in your Payee List are associated with:" :
                        "Which Columns in your data are associated with:"}
                </h1>
                <div className=" flex flex-col text-center text-base font-medium w-2/3" >
                    <p className="text-center  text-title">
                        {type === "payout_momo" ? "Select the row in your data from the dropdown below that represent the right payee information below" :
                            "Select the columns in your data from the dropdown below that represent the right worker information below."}
                    </p>
                </div>

                {/* notifications */}
                {uploadSuccess && type === "registration" ? (
                    <Form
                        form={form}
                        layout="vertical"
                        className="flex flex-col gap-6 w-2/3"
                        onFinish={onFinishRegistration}
                        onFinishFailed={onFinishFailed}
                        requiredMark={false}
                        scrollToFirstError={true}
                    >
                        {!columnsList.some(item => fullNamesPossibility.includes(item?.name?.toString()?.toLowerCase())) ?
                            (<div className='flex flex-row gap-8'>
                                <div className="p-10 rounded-md shadow-md w-1/2">
                                    <Form.Item
                                        label={<h1>First Name</h1>}
                                        name="firstname"
                                    >
                                        <Select
                                            showSearch
                                            placeholder="Select column"
                                            optionFilterProp="children"
                                            onChange={(e) => onSelectColumnValidate(e, "firstname")}
                                            onSearch={onSearch}
                                            filterOption={filterOption}
                                            style={itemStyles.inputStyles}
                                            options={columnsList
                                                ?.filter(item => !fullNamesPossibility
                                                    ?.includes(item?.name?.toString()?.toLowerCase()))
                                                ?.map((item) => ({
                                                    value: item.name,
                                                    label: item.name,
                                                }))}
                                        />
                                    </Form.Item>
                                </div>
                                <div className="p-10 rounded-md shadow-md w-1/2">
                                    <Form.Item
                                        label={<h1>Last Name</h1>}
                                        name="lastname"
                                    >
                                        <Select
                                            showSearch
                                            placeholder="Select column"
                                            optionFilterProp="children"
                                            onChange={(e) => onSelectColumnValidate(e, "lastname")}
                                            onSearch={onSearch}
                                            filterOption={filterOption}
                                            style={itemStyles.inputStyles}
                                            options={columnsList
                                                ?.filter(item => !["fullname", "full name", "full names", "name", "names", "full_name", "full_names"]
                                                    ?.includes(item?.name?.toString()?.toLowerCase()))
                                                ?.map((item) => ({
                                                    value: item.name,
                                                    label: item.name,
                                                }))}
                                        />
                                    </Form.Item>
                                </div>
                            </div>)
                            : (
                                <div className='flex flex-row gap-8'>
                                    <div className="p-10 rounded-md shadow-md w-full">
                                        <Form.Item
                                            label={<h1>Full Names</h1>}
                                            name="names"
                                        >
                                            <Select
                                                showSearch
                                                placeholder="Select column"
                                                optionFilterProp="children"
                                                onChange={(e) => onSelectColumnValidate(e, "names")}
                                                onSearch={onSearch}
                                                filterOption={filterOption}
                                                style={itemStyles.inputStyles}
                                                options={columnsList
                                                    ?.filter(item => !lastFirstNamePossibility
                                                        ?.includes(item?.name?.toString()?.toLowerCase()))
                                                    ?.map((item) => ({
                                                        value: item.name,
                                                        label: item.name,
                                                    }))}
                                            />
                                        </Form.Item>
                                    </div>
                                </div>
                            )
                        }
                        <div
                            className='flex flex-row gap-8'
                        >
                            <div className="p-10 rounded-md shadow-md w-1/2">
                                <Form.Item
                                    label={<h1>Worker ID Number</h1>}
                                    name="idNumber"
                                >
                                    <Select
                                        showSearch
                                        placeholder="Select column"
                                        optionFilterProp="children"
                                        onChange={(e) => onSelectColumnValidate(e, "idNumber")}
                                        onSearch={onSearch}
                                        filterOption={filterOption}
                                        style={itemStyles.inputStyles}
                                        options={columnsList?.map((item) => ({
                                            value: item.name,
                                            label: item.name,
                                        }))}
                                    />
                                </Form.Item>
                            </div>
                            <div className="p-10 rounded-md shadow-md w-1/2">
                                <Form.Item
                                    label={<h1>Worker Phone Number </h1>}
                                    // <span className='text-bder-red'>*</span>  
                                    name="phoneNumber"
                                >
                                    <Select
                                        showSearch
                                        placeholder="Select column"
                                        optionFilterProp="children"
                                        onChange={(e) => onSelectColumnValidate(e, "phoneNumber")}
                                        onSearch={onSearch}
                                        filterOption={filterOption}
                                        style={itemStyles.inputStyles}
                                        options={columnsList?.map((item) => ({
                                            value: item.name,
                                            label: item.name,
                                        }))}
                                    />
                                </Form.Item>
                            </div>
                        </div>
                        <div
                            className='flex flex-row gap-8'
                        >
                            <div className="p-10 rounded-md shadow-md w-1/2">
                                <Form.Item
                                    label={<h1>Worker Trade</h1>}
                                    name="service"
                                >
                                    <Select
                                        showSearch
                                        placeholder="Select column"
                                        optionFilterProp="children"
                                        onChange={(e) => onSelectColumnValidate(e, "service")}
                                        onSearch={onSearch}
                                        filterOption={filterOption}
                                        style={itemStyles.inputStyles}
                                        options={columnsList?.map((item) => ({
                                            value: item.name,
                                            label: item.name,
                                        }))}
                                    />
                                </Form.Item>
                            </div>
                            <div className="p-10 rounded-md shadow-md w-1/2">
                                <Form.Item
                                    label={<h1>Worker Rate</h1>}
                                    name="daily_earnings"
                                >
                                    <Select
                                        showSearch
                                        placeholder="Select column"
                                        optionFilterProp="children"
                                        onChange={(e) => onSelectColumnValidate(e, "daily_earnings")}
                                        onSearch={onSearch}
                                        filterOption={filterOption}
                                        style={itemStyles.inputStyles}
                                        options={columnsList?.map((item) => ({
                                            value: item.name,
                                            label: item.name,
                                        }))}
                                    />
                                </Form.Item>
                            </div>
                        </div>

                        <div className="flex flex-row gap-4 justify-center">
                            <Form.Item>
                                <Button
                                    type="secondary"
                                    className="secondaryBtn"
                                    onClick={() => handleCancel()}>
                                    Cancel
                                </Button>
                            </Form.Item>
                            <Form.Item>
                                <Button
                                    type="primary"
                                    className="primaryBtn"
                                    htmlType="submit"
                                    loading={btnLoading}
                                >
                                    Next
                                </Button>
                            </Form.Item>
                        </div>
                    </Form>
                ) : (
                    <Form
                        form={form}
                        layout="vertical"
                        className="flex flex-col gap-6 w-full p-8"
                        onFinish={onFinishPayout}
                        onFinishFailed={onFinishFailed}
                        requiredMark={false}
                        scrollToFirstError={true}
                    >
                        <div
                            className='flex flex-row gap-8'
                        >
                            <div className="p-10 rounded-md shadow-md w-1/2">
                                <Form.Item
                                    label={<h1>Payee Names <span className='text-bder-red'>*</span></h1>}
                                    name="payee_name"
                                >
                                    <Select
                                        showSearch
                                        placeholder="Select column"
                                        optionFilterProp="children"
                                        onChange={(e) => onSelectColumnValidate(e, "payee_name")}
                                        onSearch={onSearch}
                                        filterOption={filterOption}
                                        style={itemStyles.inputStyles}
                                        options={columnsList?.map((item) => ({
                                            value: item.name,
                                            label: item.name,
                                        }))}
                                    />
                                </Form.Item>
                            </div>
                            <div className="p-10 rounded-md shadow-md w-1/2">
                                <Form.Item
                                    label={<h1>Account Number <span className='text-bder-red'>*</span></h1>}
                                    name="account_number"
                                >
                                    <Select
                                        showSearch
                                        placeholder="Select column"
                                        optionFilterProp="children"
                                        onChange={(e) => onSelectColumnValidate(e, "account_number")}
                                        onSearch={onSearch}
                                        filterOption={filterOption}
                                        style={itemStyles.inputStyles}
                                        options={columnsList?.map((item) => ({
                                            value: item.name,
                                            label: item.name,
                                        }))}
                                    />
                                </Form.Item>
                            </div>
                        </div>
                        <div
                            className='flex flex-row gap-8'
                        >
                            <div className="p-10 rounded-md shadow-md w-1/2">
                                <Form.Item
                                    label={<h1>Payee Type <span className='text-bder-red'>*</span></h1>}
                                    name="payee_type"
                                >
                                    <Select
                                        showSearch
                                        placeholder="Select column"
                                        optionFilterProp="children"
                                        onChange={(e) => onSelectColumnValidate(e, "payee_type")}
                                        onSearch={onSearch}
                                        filterOption={filterOption}
                                        style={itemStyles.inputStyles}
                                        options={columnsList?.map((item) => ({
                                            value: item.name,
                                            label: item.name,
                                        }))}
                                    />
                                </Form.Item>
                            </div>
                            <div className="p-10 rounded-md shadow-md w-1/2">
                                <Form.Item
                                    label={<h1>Amount To Pay <span className='text-bder-red'>*</span></h1>}
                                    name="amount_to_pay"
                                >
                                    <Select
                                        showSearch
                                        placeholder="Select column"
                                        optionFilterProp="children"
                                        onChange={(e) => onSelectColumnValidate(e, "amount_to_pay")}
                                        onSearch={onSearch}
                                        filterOption={filterOption}
                                        style={itemStyles.inputStyles}
                                        options={columnsList?.map((item) => ({
                                            value: item.name,
                                            label: item.name,
                                        }))}
                                    />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="flex flex-row gap-4 justify-center">
                            <Form.Item>
                                <Button
                                    type="secondary"
                                    className="secondaryBtn"
                                    onClick={() => {
                                        setViewSection('upload');
                                        handleCancel()
                                    }}>
                                    Cancel
                                </Button>
                            </Form.Item>
                            <Form.Item>
                                <Button
                                    type="primary"
                                    className="primaryBtn"
                                    htmlType="submit"
                                    loading={btnLoading}
                                >
                                    Next
                                </Button>
                            </Form.Item>
                        </div>
                    </Form>
                )}
            </div>
        </div >
    )
}

export default WorkersColumnsMapping;
import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Select, Button, Input, Progress, Mentions, Form, Upload, Spin, InputNumber } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { del } from 'idb-keyval';
import Content from '../Uploads/WorkerExcel.styled';
import ExcelErrors from '../Error/ExcelErrors';
import { Icon } from '@iconify/react';
import { getPayeeType, createSinglePayee, deleteSinglePayee, editSinglePayee, deleteExcelTemp, excelNext, getWorkersDb, getPayeesDb, readExcelFile, getWorkforce } from '../../helpers/payments/payout/payout';
import { capitalize } from '../../helpers/excelRegister';
import { capitalizeAll } from "../../helpers/capitalize"
import localforage from 'localforage';
import { getAllPaymentMethods, getCompanyPaymentMethods } from '@/helpers/payment-methods/payment-methods';
import { extractAdjacentPaymentMethods, extractPaymentMethods, extractPrimaryPaymentMethods, retrieveActivePaymentMethod, retrieveAdjacentBankId } from '@/utils/transformObject';
import { renderOption } from '../WorkerRegistration/PaymentMethods';
import WorkersColumnsMapping from '../Uploads/WorkersColumnsMapping';
import WorkerExcel from '../Uploads/WorkerExcel';
import { useRouter } from 'next/router';
import _ from 'underscore';
import { usePusher } from '@/context/PusherContext';

const ModalTitle = ({ type, payoutInfo }) => (
    <Content>
        {type === 'payee' ? (

            <h1 className='import'>
                Add {payoutInfo && payoutInfo?.meta_data?.payment?.payment_types_id === "2" ? "Payee" : "Worker"}
            </h1>
        ) : type === 'excel' ? (

            <h1 className='import'>Bulk Add Payees</h1>
        ) : type === 'edit' ? (

            <h1 className='import'>Edit {payoutInfo && payoutInfo?.meta_data?.payment?.payment_types_id === "2" ? "Payee" : "Worker"}</h1>
        ) : (
            <h1 className='import'>New Payout</h1>
        )}
    </Content>
);

const filterOption = (input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

// Payroll Modal content and states
const ExcelContent = ({ payoutInfo, handleExcelModal, successUpload, setCallbackData, setSuccessUpload, callbackData, validationData, setValidationData }) => {
    const [uploadLoading, setUploadLoading] = useState(false);
    const { Dragger } = Upload;
    const allowedExtensions = ['.csv', '.xls', '.xlsx'];
    const acceptExtensions = allowedExtensions.join(',');

    useEffect(() => {
        if (successUpload) {
            handleExcelModal(callbackData, validationData);
        }
    }, [successUpload]);

    // file processing function
    const fileProcessing = async (file) => {
        if (file) {
            setUploadLoading(true);
            const response = await readExcelFile(file, payoutInfo);
            console.log(response)
            if (response?.status === 200) {
                setSuccessUpload(true);
                setValidationData(response?.data);
            } else {
                setValidationData([]);
                setUploadLoading(false)
                setSuccessUpload(false);
            }
            setUploadLoading(false)
        }
    }

    // Dragger props for upload
    const props = {
        name: 'file',
        accept: acceptExtensions,
        showUploadList: false,
        multiple: true,
        customRequest: async ({ onSuccess, onError, file, onDrop }) => {
            fileProcessing(file);
        },
    };

    return (
        <Content>
            <div className='excelContent'>
                <div className='flex flex-col space-y-3 pt-4'>
                    {/* <div className='excelproject'>
                        {payoutInfo.project !== null && <h3 style={{
                            background: '#DFF3FB',
                            borderRadius: 5,
                            padding: '2px 12px'
                        }}>{capitalizeAll(payoutInfo.project)}</h3>}
                        <h3 style={{
                            background: '#DFF3FB',
                            borderRadius: 5,
                            padding: '2px 12px'
                        }}>{payoutInfo.payout_name}</h3>
                    </div> */}
                    <div className=''>
                        <h3 className='info'>Upload any excel, csv or text file with the list of Payees and their Payment methods.<span className='text-primary upload-span'><a href="https://datadumpfixa.s3.eu-central-1.amazonaws.com/Instant_payout_template.xlsx" download>(You can download and use this provided template)</a></span>.</h3>
                    </div>
                    <div style={{
                        alignSelf: 'center'
                    }}>
                        <Spin spinning={uploadLoading}>
                            <Dragger {...props} className="flex h-48 w-[600px] px-2 md:py-4 flex-col items-center gap-2 bg-white !border-primary text-primary" >
                                <p className="ant-upload-drag-icon">
                                    <Icon icon="fa6-solid:file-circle-plus" width="40" height="36" />
                                </p>
                                <p className="ant-upload-text flex w-full px-2 py-1 gap-2 rounded-md bg-primary justify-center" style={{
                                    color: 'white'
                                }}>Select an Excel or CSV file to upload</p>
                                <p className="ant-upload-hint !text-primary text-base">
                                    Or drag and drop it here
                                </p>
                            </Dragger>
                        </Spin>
                        {/* <Progress
                            percent={(parseInt(payoutAggregates?.successful) / parseInt(payoutAggregates?.total_transactions)) * 100}
                            status={payoutStatus === 'open' ? 'success' : 'active'}
                            strokeColor={payoutStatus === 'success' ? '#389e0d' : '#389e0d'}
                            showInfo={false}
                        /> */}
                    </div>
                </div>
            </div>
        </Content>

    )
}

/**
 * EDIT PAYEE CONTENTS 
 **/
const EditPayeeContent = ({ handleCancel, editingWorker, payment_id, setTableActions, setIsEditing, payoutInfo }) => {
    const [payeeData, setPayeeData] = useState({
        payee_type: '',
        payee_name: '',
        momo_account: '',
        amount: '',
        payee_payment_method_id: '',
        payee_payment_provider: '',
        payee_account_number: '',
        to_be_saved: false,
        is_bank: false,
    });
    const [editingWorkerInfo, setEditingWorkerInfo] = useState(editingWorker);
    const [payeeTypes, setPayeeTypes] = useState([]);
    const [payeeNameCollections, setPayeeNameCollections] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [payee_names, setPayee_names] = useState([]);
    const [loadingNextBtn, setLoadingNextBtn] = useState(false);
    const [isPayrollClaim, setIsPayrollClaim] = useState(true);

    // primary payment method
    const [paymentMethods, setPaymentMethods] = useState([]);
    // adjacent payment method
    const [adjacentPaymentMethods, setAdjacentPaymentMethods] = useState([]);

    const { Option } = Select;
    const [form] = Form.useForm();

    useEffect(() => {
        const fetchPaymentMethods = async () => {
            const paymentMethods = await getCompanyPaymentMethods();
            setPaymentMethods(extractPrimaryPaymentMethods(paymentMethods));
            setAdjacentPaymentMethods(extractAdjacentPaymentMethods(paymentMethods));
            const bankId = retrieveAdjacentBankId(paymentMethods, editingWorkerInfo.payment_method);
            setEditingWorkerInfo((pre) => {
                return {
                    ...pre, payee_payment_provider: bankId
                }
            })

            //setting form data
            form.setFieldsValue({
                payee_account_number: editingWorkerInfo.account_number,
                payee_name: capitalize(editingWorkerInfo?.payee_name),
                amount: editingWorkerInfo.amount,
                payee_type: capitalize(editingWorkerInfo.payee_type_name),
                payment_method_id: Number(editingWorkerInfo.payment_method_id),
                payee_payment_provider: bankId
            })

        }

        // Get payee types
        getPayeeType().then((res) => {
            setPayeeTypes(res);
        });
        getWorkersDb().then((res) => {
            setWorkers(res);
        });
        getPayeesDb().then((res) => {
            setPayee_names(res);
        });

        fetchPaymentMethods();
    }, []);

    // console.log("editingWorkerInfo=====", editingWorkerInfo)
    // console.log("adjacentPaymentMethods =====", adjacentPaymentMethods)
    // console.log("paymentMethods =====", paymentMethods)

    useEffect(() => {
        if (payoutInfo && payoutInfo.meta_data.payment) {
            if (payoutInfo && payoutInfo?.meta_data?.payment?.parent_claim && payoutInfo?.meta_data?.payment?.parent_claim.toLowerCase() === 'payroll') {
                setIsPayrollClaim(true);
                setPayeeData((pre) => {
                    return {
                        ...pre, payee_type: "1"
                    };
                });
                setPayeeNameCollections(workers);
            }
            else {
                setIsPayrollClaim(false);
            }
        }
    }, [payoutInfo, workers]);

    // Switching the collection
    const handleSwitchCollection = (type_of_payee) => {
        //clean payee data state
        setPayeeData({
            payee_type: '',
            payee_name: '',
            payee_account_number: '',
            amount: ''
        })
        if (parseInt(type_of_payee) === 1) {
            //get the workers db & switch collection
            setPayeeNameCollections(workers);
        }
        else {
            //get the payees db & switch collection
            setPayeeNameCollections(payee_names);
        }
    }

    // Changes in Mentions
    const onChange = (value) => {
        setEditingWorkerInfo((pre) => {
            return { ...pre, payee_name: value };
        });
        setEditingWorkerInfo((pre) => {
            return { ...pre, to_be_saved: true };
        });
    };

    // Select in Mentions
    const handleSelectChange = (value) => {
        setEditingWorkerInfo((pre) => {
            return { ...pre, payee_name: value.label.split('-')[0].trim() };
        });
        // setEditingWorkerInfo((pre) => {
        //     return { ...pre, phone_number: value.label.split('-')[1].trim() };
        // });
        setEditingWorkerInfo((pre) => {
            return { ...pre, to_be_saved: false };
        });
        /* use form hook to update the form fields */
        form.setFieldsValue({
            // momo_account: value.label.split('-')[1].trim(),
            payee_name: value.label.split('-')[0].trim(),
        });
    }

    const handleEditingPayee = () => {
        let payload = {
            "payee_type_id": editingWorkerInfo.payee_type_id,
            "payee_name": editingWorkerInfo.payee_name,
            "amount": editingWorkerInfo.amount,
            "payee_type_name": editingWorkerInfo.payee_type_name,
            "payee_payment_method_id": editingWorkerInfo.payee_payment_method_id,
            "payee_payment_provider": editingWorkerInfo.payee_payment_provider,
            "payee_account_number": editingWorkerInfo?.account_number,
        }
        setLoadingNextBtn(true);
        editSinglePayee(payment_id, editingWorkerInfo.id, payload).then(() => {
            setTableActions(true);
            setIsEditing(false);
        }).catch((err) => {
            setLoadingNextBtn(false);
            setIsEditing(false);
        });
    }

    const onSelectPrimaryPayment = (value, data) => {
        setEditingWorkerInfo((pre) => {
            return { ...pre, payee_payment_method_id: data?.value, is_bank: data?.is_bank }
        })
    }

    // select between primary adjacents payments
    const onSelectAdjecentsPayments = (value, data) => {
        setEditingWorkerInfo((pre) => {
            return { ...pre, payee_payment_provider: data?.value }
        })
    }

    return (
        <Content>
            <div className='PayeeContent'>
                <div className='payeeBody'>

                    {/* START Form */}
                    <Form
                        layout="vertical"
                        form={form}
                        onFinish={handleEditingPayee}
                        requiredMark={false}
                        className='w-full'
                    >
                        {!isPayrollClaim && (

                            <Form.Item
                                label={'Type of payee'}
                                name="payee_type"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please select an Supplier Type.',
                                    },
                                ]}
                            >
                                <Select
                                    className='formInput'
                                    value={capitalize(editingWorkerInfo.payee_type_name)}
                                    // value={form.getFieldValue('payee_name')}
                                    name="payee_type"
                                    onChange={(e) => {
                                        handleSwitchCollection(e.split('-')[0].trim());
                                        setEditingWorkerInfo((pre) => {
                                            return {
                                                ...pre, payee_type_name: e.split('-')[1].trim()
                                            };
                                        });
                                        setEditingWorkerInfo((pre) => {
                                            return {
                                                ...pre, payee_type_id: e.split('-')[0].trim()
                                            };
                                        });
                                        setEditingWorkerInfo((pre) => {
                                            return { ...pre, to_be_saved: true };
                                        });
                                    }}
                                    placeholder='Enter Supplier Names'
                                    disabled={isPayrollClaim ? isPayrollClaim : !editingWorkerInfo.is_editable}
                                >
                                    {payeeTypes?.map((item) => {
                                        return (
                                            <Option
                                                value={`${item.id} - ${item.payee_type}`}
                                                key={item.id}
                                            >
                                                {capitalize(item.payee_type)}
                                            </Option>
                                        );
                                    })}
                                </Select>
                            </Form.Item>
                        )}

                        <Form.Item
                            label={
                                <p>
                                    {payoutInfo && payoutInfo?.meta_data?.payment?.payment_types_id === "2" ? "Payee" : "Worker"} Name
                                </p>
                            }
                            name="payee_name"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please input the payee name!',
                                },
                            ]}

                        >
                            <Mentions
                                className='formInput flex justify-center'
                                placeholder="Input @ to mention payees"
                                filterOption={(input, option) => option.value.includes(input.slice(1).toLowerCase())}
                                prefix='@'
                                disabled={!editingWorkerInfo.is_editable}
                                onChange={onChange}
                                value={editingWorkerInfo.payee_name}
                                onSelect={handleSelectChange}
                                options={payeeNameCollections.map((d, index) => ({
                                    label: `${d.names}`,
                                    value: d.names,
                                    key: ` ${d.names}-${d.phone_number}-${index}`,
                                    data: d
                                }))}
                            />
                        </Form.Item>

                        <Form.Item
                            label={'Total Amount to Pay'}
                            name="amount"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please input the amount!',
                                },
                                {
                                    pattern: /^\d+$/,
                                    message: 'Amount must be a whole number',
                                },
                            ]}
                        >
                            <InputNumber
                                disabled={false}
                                keyboard={false}
                                controls={false}
                                value={editingWorkerInfo.amount}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                                className="formInput flex flex-col justify-center"
                                onChange={(e) => {
                                    setEditingWorkerInfo((pre) => {
                                        return { ...pre, amount: e };
                                    });
                                }}
                            />
                        </Form.Item>

                        {/* ===== START payment methods ========= */}
                        <Form.Item
                            name={"payment_method_id"}
                            label={'Payment Method'}
                        >
                            <Select
                                defaultValue={editingWorkerInfo.payee_payment_method_id}
                                className='formInput'
                                showSearch
                                optionFilterProp="children"
                                filterOption={filterOption}
                                // onSearch={onSearch}
                                onSelect={onSelectPrimaryPayment}
                                // style={itemStyles.inputStyles}
                                options={paymentMethods?.map((item) => ({
                                    value: item.id,
                                    label: item.name,
                                    payment_method_id: item.id,
                                    is_bank: item.is_bank ?? false
                                }))}
                                placeholder={'Select a payment method'}
                                optionRender={renderOption}
                                disabled={isPayrollClaim ? isPayrollClaim : !editingWorkerInfo.is_editable}
                            />

                        </Form.Item>

                        {editingWorkerInfo?.is_bank && (
                            <Form.Item
                                name={"payee_payment_provider"}
                                label={'Bank Name'}
                            >
                                <Select
                                    // defaultValue={editingWorkerInfo.payee_payment_provider}
                                    className='formInput'
                                    showSearch
                                    optionFilterProp="children"
                                    filterOption={filterOption}
                                    // onSearch={onSearch}
                                    onSelect={onSelectAdjecentsPayments}
                                    // style={itemStyles.inputStyles}
                                    options={adjacentPaymentMethods?.map((item) => ({
                                        value: item.id,
                                        label: item.name,
                                        // payment_method_id: item.id,
                                        // is_bank: item.is_bank ?? false
                                    }))}
                                    placeholder={'Select a bank name'}
                                    optionRender={renderOption}
                                    disabled={isPayrollClaim ? isPayrollClaim : !editingWorkerInfo.is_editable}
                                />
                            </Form.Item>
                        )}
                        {/* ===== END payment methods ========= */}

                        <Form.Item
                            label={'Account Number'}
                            name="payee_account_number"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please input the account number!',
                                },
                                {
                                    pattern: !editingWorkerInfo?.is_bank ? /^07\d{8}$/ : '',
                                    message: 'Please input a valid 10-digit phone number.',
                                },
                            ]}
                        >

                            <Input
                                defaultValue={editingWorkerInfo.account_number}
                                className='formInput'
                                name="account_number"
                                placeholder='XXXX XXX XXX'
                                value={editingWorkerInfo.account_number}
                                onChange={(e) => {
                                    setEditingWorkerInfo((pre) => {
                                        return { ...pre, account_number: e.target.value };
                                    });
                                }}
                                disabled={isPayrollClaim ? isPayrollClaim : !editingWorkerInfo.is_editable}
                            />
                        </Form.Item>

                        <Form.Item className='formItem flex items-center justify-center' >
                            <Button
                                type="primary"
                                className='primaryBtnCustom w-32 h-12'
                                loading={loadingNextBtn}
                                htmlType="submit"
                            >
                                Edit Payee
                            </Button>
                        </Form.Item>
                    </Form>

                    {/* END form */}
                </div>
            </div>
        </Content >
    );
}

/* ========= Adding Payee Modal and states ======== */
const PayeeContent = ({ handleCancel, editingWorker, payment_id, setTableActions, payoutInfo }) => {
    const [payeeData, setPayeeData] = useState({
        payee_type: '',
        payee_name: '',
        amount: '',
        payee_payment_method_id: '',
        payee_payment_provider: '',
        payee_account_number: '',
        to_be_saved: false,
        is_bank: false,
        payee_name_id: ''
    });
    const [nextDisabled, setNextDisabled] = useState(true);
    const [editingWorkerInfo, setEditingWorkerInfo] = useState(editingWorker);
    const [payeeTypes, setPayeeTypes] = useState([]);
    const [selectLoading, setSelectLoading] = useState(true);
    const [payeeNameCollections, setPayeeNameCollections] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [payee_names, setPayee_names] = useState([]);
    const [loadingNextBtn, setLoadingNextBtn] = useState(false);
    const [isPayrollClaim, setIsPayrollClaim] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [claimProject, setClaimProject] = useState([]);
    const [loadingSelect, setLoadingSelect] = useState(false)

    // primary payment method
    const [paymentMethods, setPaymentMethods] = useState([]);
    // adjacent payment method
    const [adjacentPaymentMethods, setAdjacentPaymentMethods] = useState([]);

    const { Option } = Select;
    const [form] = Form.useForm();

    localforage.getItem('claim_project').then((res) => {
        setClaimProject(res);
    });

    // bring workers from a project
    const fetchWorkers = useCallback(() => {
        setLoadingSelect(true)
        getWorkforce(payoutInfo.project_id).then((res) => {
            setPayeeNameCollections(res);
            setWorkers(res)
            setPayeeData((pre) => {
                return {
                    ...pre, payee_type: "1"
                };
            });
            setLoadingSelect(false)
        })
    }, [isPayrollClaim]);

    useEffect(() => {
        if (isPayrollClaim) {
            fetchWorkers()
        }
    }, [isPayrollClaim])

    useEffect(() => {
        // Get payee types
        getPayeeType().then((res) => {
            setPayeeTypes(res);
            setSelectLoading(false);
        });

        getWorkersDb().then((res) => {
            setWorkers(res);
            setPayeeNameCollections(res);
            setPayeeData((pre) => {
                return {
                    ...pre, payee_type: "1"
                };
            });
        });

        getPayeesDb().then((res) => {
            setPayee_names(res);
        });

        getCompanyPaymentMethods().then((data) => {
            setPaymentMethods(extractPrimaryPaymentMethods(data));
            setAdjacentPaymentMethods(extractAdjacentPaymentMethods(data));
        });

        if (payoutInfo && payoutInfo?.meta_data?.payment?.parent_claim && payoutInfo?.meta_data?.payment?.parent_claim.toLowerCase() === 'payroll') {
            setIsPayrollClaim(true);

        }
        else {
            setIsPayrollClaim(false);
        }
    }, []);

    // Switching the collection
    const handleSwitchCollection = (type_of_payee) => {
        //clean payee data state
        setPayeeData({
            payee_type: '',
            payee_name: '',
            payee_account_number: '',
            amount: ''
        })
        if (parseInt(type_of_payee) === 1) {
            //get the workers db & switch collection
            setPayeeNameCollections(workers);
        }
        else {
            //get the payees db & switch collection
            setPayeeNameCollections(payee_names);
        }
    }


    // useEffect(() => {
    //     if (!editingWorker) {
    //         handlePayeeData();
    //     }
    // }, [payeeData]);

    // Editing Payee checking
    useEffect(() => {
        if (editingWorker) {
            handleEditingWorkerInfo();
        }
    }, [editingWorkerInfo]);

    //Handling the editing input change
    const handleEditingWorkerInfo = () => {
        if (editingWorkerInfo.payee_type > 0
            &&
            editingWorkerInfo.payee_name > 0
            &&
            editingWorkerInfo.payee_phone.toString().length > 9
            &&
            editingWorkerInfo.payee_amount.toString().length > 2
        ) {
            setNextDisabled(false);
        } else {
            setNextDisabled(false);
        }
    }

    //Handling the payout input change
    // const handlePayeeData = () => {
    //     if (payeeData.payee_type > 0
    //         &&
    //         payeeData.payee_name.length > 0
    //         &&
    //         payeeData.payee_account_number?.toString().length > 9
    //         &&
    //         payeeData.amount?.toString().length > 1
    //     ) {
    //         setNextDisabled(false);
    //     } else {
    //         setNextDisabled(true);
    //     }
    // }

    // Handle adding payee
    const handleAddingPayee = () => {
        let payload = {
            "payee_type_id": payeeData.payee_type,
            "payee_names": payeeData.payee_name,
            "payee_names_id": payeeData.payee_name_id,
            "payee_amount": payeeData.amount,
            "payment_id": payment_id,
            "to_be_saved": payeeData.to_be_saved,
            "payee_payment_method_id": payeeData.payee_payment_method_id,
            "payee_payment_provider": payeeData.payee_payment_provider,
            "payee_account_number": payeeData.payee_account_number,
        }
        // console.log("payload ===>", payload)
        setLoadingNextBtn(true);
        setNextDisabled(true);
        createSinglePayee(payload).then(() => {
            setTableActions(true);
            handleCancel();
        }).catch((err) => {
            setNextDisabled(false);
            setLoadingNextBtn(false);
        });
    };

    // Changes in Mentions Adding
    const onChangeAdd = (value) => {
        if (value.includes('@')) {
            // Set changes to not be saved
            return
            // console.log("value includes @===> ", value)
            // const parts = value.split(" - ")
            // setPayeeData((pre) => {
            //     return { ...pre, payee_name: parts[0].replace("@", "") };
            // });
            // setPayeeData((pre) => {
            //     return { ...pre, payee_account_number: parts.length > 1 ? parts[1] : '' };
            // });
            // setPayeeData((pre) => {
            //     return { ...pre, to_be_saved: false };
            // });
            // setIsReadOnly(true);
        } else {
            // Save changes here
            setPayeeData((pre) => {
                return { ...pre, payee_name: value, payee_name_id: 0 };
            });
            setPayeeData((pre) => {
                return { ...pre, to_be_saved: true };
            });
        }

    };

    // // Select in Mentions
    // const onSelect = (option) => {
    //     setEditingWorkerInfo((pre) => {
    //         return { ...pre, payee_name: option.value.split('-')[0].trim() };
    //     });
    //     setEditingWorkerInfo((pre) => {
    //         return { ...pre, phone_number: option.value.split('-')[1].trim() };
    //     });
    //     setEditingWorkerInfo((pre) => {
    //         return { ...pre, to_be_saved: false };
    //     });
    // };

    const handleSelectChange = (value, data) => {
        const { payment_method, payment_provider, payment_account_number, is_bank } = retrieveActivePaymentMethod(value.data);
        // if property available we disable inputs to be readOnly
        if (payment_method != '' && payment_provider != '' && payment_account_number != '') {
            setIsReadOnly(true);
            /* use form hook to update the available form fields */
            form.setFieldsValue({
                payment_method_id: payment_method,
                payee_payment_provider: payment_provider,
                payee_account_number: payment_account_number,
            })
        }
        setPayeeData((pre) => {
            // return { ...pre, payee_name: value.label.split('-')[0].trim() };
            return { ...pre, payee_name: value.label };
        });
        setPayeeData((pre) => {
            let payee_id = value.data?.worker_id ? value.data?.worker_id : value.data?.id;
            return {
                ...pre,
                payee_account_number: payment_account_number,
                is_bank,
                payee_payment_provider: payment_provider,
                payee_payment_method_id: payment_method,
                payee_name_id: payee_id ? payee_id : 0
            };
        });
        setPayeeData((pre) => {
            return { ...pre, to_be_saved: false };
        });
        form.setFieldsValue({
            // payee_name: value.label.split('-')[0].trim(),
            payee_name: value.label,
        })
    }

    // on CLAIM
    const onPayeeSelect = (value) => {

        setPayeeData((pre) => {
            return { ...pre, payee_name: value.split('-')[0].trim() };
        });
        // setPayeeData((pre) => {
        //     return { ...pre, payee_account_number: value.split('-')[1].trim() };
        // });
        setPayeeData((pre) => {
            return { ...pre, to_be_saved: false };
        });
        /* use form hook to update the form fields */
        form.setFieldsValue({
            payee_name: value.split('-')[0].trim(),
        })
    }
    // console.log("payeeData ====>", payeeData)

    // const filterOption = (input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

    // select between primary payments
    const onSelectPrimaryPayment = (value, data) => {
        setPayeeData((pre) => {
            return { ...pre, payee_payment_method_id: data?.value, is_bank: data?.is_bank, payee_payment_provider: data?.is_bank ? "" : data?.label }
        })
    }

    // select between primary adjacents payments
    const onSelectAdjecentsPayments = (value, data) => {
        setPayeeData((pre) => {
            return { ...pre, payee_payment_provider: data?.value }
        })
    }


    return (
        < Content >
            <div className='PayeeContent'>
                <div className='payeeBody'>
                    {/* START Form */}
                    <Form
                        layout="vertical"
                        form={form}
                        onFinish={handleAddingPayee}
                        requiredMark={false}
                    >
                        {/* SHow this only on payouts */}
                        {!isPayrollClaim && (
                            <Form.Item
                                label={'Type of payee'}
                                name="payee_type"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please select an Supplier Type.',
                                    },
                                ]}
                                initialValue={"1"}
                            >
                                <Select
                                    className='formInput'
                                    value={payeeData.payee_type}
                                    onChange={(e) => {
                                        handleSwitchCollection(e);
                                        setPayeeData((pre) => {
                                            return {
                                                ...pre, payee_type: e
                                            };
                                        });
                                    }}
                                    placeholder='Enter Supplier Types'
                                    disabled={isPayrollClaim}
                                    loading={selectLoading}
                                >
                                    {payeeTypes?.map((item) => {
                                        return (
                                            <Option
                                                value={item.id.toString()}
                                                key={item.id}
                                            //title={item.name}
                                            >
                                                {capitalize(item.payee_type)}
                                            </Option>
                                        );
                                    })}
                                </Select>
                            </Form.Item>
                        )}

                        <Form.Item
                            label={
                                <p>

                                    {payoutInfo && payoutInfo?.meta_data?.payment?.payment_types_id === "2" ? "Payee" : "Worker"} Name
                                </p>
                            }
                            name="payee_name"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please input the payee name!',
                                },
                            ]}

                        >
                            {/*BUG: select */}
                            {payoutInfo && payoutInfo?.meta_data?.payment?.parent_claim?.toLowerCase() === 'payroll' ?
                                <Select
                                    allowClear={true}
                                    showSearch={true}
                                    size="large"
                                    placeholder='Search & Select payee name'
                                    onSelect={(value, data) => handleSelectChange(data)}
                                    style={{
                                        borderRadius: "5px",
                                        background: "#F7FBFE",
                                        width: "100%",
                                    }}
                                    optionFilterProp="children"
                                    filterOption={(input, option) =>
                                        option.value.toLowerCase().indexOf(input.toLowerCase()) !== -1
                                    }
                                    // options={payeeNameCollections.filter(item => item.project_id?.toString() === claimProject?.toString()).map((item, index) => ({
                                    //     // label: `${capitalizeAll(item.names)}` + ` - ${item.phone_number}`,
                                    //     label: `${capitalizeAll(item.names)}`,
                                    //     // value: `${item.names}` + `-${item.phone_number}`,
                                    //     value: item.names,
                                    //     key: index,
                                    //     data: item
                                    // }))}
                                    options={payeeNameCollections.map((item, index) => ({
                                        // label: `${capitalizeAll(item.names)}` + ` - ${item.phone_number}`,
                                        label: `${capitalizeAll(item.names)}`,
                                        // value: `${item.names}` + `-${item.phone_number}`,
                                        value: item.names,
                                        key: index,
                                        data: item
                                    }))}
                                    loading={loadingSelect}
                                // showArrow={false}
                                />
                                :
                                <Mentions
                                    className='formInput flex flex-col justify-center'
                                    placeholder="Input @ to mention payees"
                                    filterOption={(input, option) => option.value.includes(input.slice(1).toLowerCase())}
                                    prefix='@'
                                    value={payeeData.payee_name}
                                    onChange={onChangeAdd}
                                    onSelect={handleSelectChange}
                                    options={payeeNameCollections.map((d, index) => ({
                                        label: `${d.names}`,
                                        value: d.names,
                                        key: ` ${d.names}-${d.phone_number}-${index}`,
                                        data: d
                                    }))}
                                // readOnly={isPayrollClaim && isReadOnly}
                                />
                            }
                        </Form.Item>

                        <Form.Item
                            label={'Total Amount to Pay'}
                            name="amount"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please input the amount!',
                                },
                                {
                                    pattern: /^\d+$/,
                                    message: 'Amount must be a whole number',
                                },
                            ]}
                        >
                            <InputNumber
                                disabled={false}
                                keyboard={false}
                                controls={false}
                                value={payeeData.amount}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                                className="formInput flex flex-col justify-center"
                                onChange={(e) => {
                                    setPayeeData((pre) => {
                                        return { ...pre, amount: e };
                                    });
                                }}
                            />
                        </Form.Item>

                        {/* ===== START payment methods ========= */}
                        <Form.Item
                            name={"payment_method_id"}
                            label={'Payment Method'}
                        >
                            <Select
                                defaultValue={payeeData.payee_payment_method_id}
                                className='formInput'
                                showSearch
                                optionFilterProp="children"
                                filterOption={filterOption}
                                // onSearch={onSearch}
                                onSelect={onSelectPrimaryPayment}
                                // style={itemStyles.inputStyles}
                                options={paymentMethods?.map((item) => ({
                                    value: item.id,
                                    label: item.name,
                                    payment_method_id: item.id,
                                    is_bank: item.is_bank ?? false
                                }))}
                                placeholder={'Select a payment method'}
                                optionRender={renderOption}
                                disabled={isPayrollClaim ? isPayrollClaim : isReadOnly}
                            />
                        </Form.Item>
                        {payeeData.is_bank && (
                            <Form.Item
                                name={"payee_payment_provider"}
                                label={'Bank Name'}
                            >
                                <Select
                                    defaultValue={payeeData.payee_payment_provider}
                                    className='formInput'
                                    showSearch
                                    optionFilterProp="children"
                                    filterOption={filterOption}
                                    // onSearch={onSearch}
                                    onSelect={onSelectAdjecentsPayments}
                                    // style={itemStyles.inputStyles}
                                    options={adjacentPaymentMethods?.map((item) => ({
                                        value: item.id,
                                        label: item.name,
                                        // payment_method_id: item.id,
                                        // is_bank: item.is_bank ?? false
                                    }))}
                                    placeholder={'Select a bank name'}
                                    optionRender={renderOption}
                                    disabled={isPayrollClaim ? isPayrollClaim : isReadOnly}
                                />
                            </Form.Item>
                        )}
                        {/* ===== END payment methods ========= */}

                        <Form.Item
                            label={'Account Number'}
                            name="payee_account_number"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please input the account number!',
                                },
                                {
                                    pattern: !payeeData.is_bank ? /^07\d{8}$/ : '',
                                    message: 'Please input a valid 10-digit phone number.',
                                },
                            ]}
                        >

                            <Input
                                // type='number'
                                style={{
                                    width: 350,
                                    height: 40,
                                    borderRadius: 5
                                }}
                                // className="formInput flex flex-col justify-center"
                                name="account_number"
                                placeholder='XXXX XXX XXX'
                                value={payeeData.payee_account_number}
                                onChange={(e) => {
                                    setPayeeData((pre) => {
                                        return { ...pre, payee_account_number: e.target.value };
                                    });
                                }}
                                disabled={isPayrollClaim ? isPayrollClaim : isReadOnly}
                            />
                        </Form.Item>

                        <Form.Item className='formItem flex items-center justify-center' >
                            <Button
                                type="primary"
                                className='primaryBtnCustom w-32 h-12'
                                loading={loadingNextBtn}
                                htmlType="submit"
                            >
                                Add Payee
                            </Button>
                        </Form.Item>
                    </Form>

                    {/* END form */}

                </div>
            </div>
        </Content >)

}

/* EXCEL Payout ERRORS */
const ExcelPayoutErrors = ({ errorCount }) => {
    return (
        <div className='excelErrorWrapper'>

            <div className='excelErrorTitle'>
                <h3 className='errorCountTitle'>Errors found:</h3>
            </div>

            <div className='excelErrorSection'>
                {errorCount.map((err, key) => (

                    <div className='excelError' key={key}>
                        <h3 className='excelErrorName'>{err?.count} {err?.message}</h3>
                    </div>
                ))}
            </div>
        </div>
    )
}

/*  ==== PAYOUT MODAL EXCEL content and states === */
const ExcelPayout = ({ handleExcelPayoutCancel, handleReupload, recentFile, upload, excelErrors, errorCount, setTableActions, setOpenExcelModal, payment_id, validationData }) => {

    const [nextLoading, setNextLoading] = useState(false);

    const handleExcePayoutlNext = () => {
        setNextLoading(true);
        let payload = {
            "payment_id": payment_id
        }
        excelNext(payload).then((res) => {
            setOpenExcelModal(false);
            setTableActions(true);
            setNextLoading(false);
        });
    }

    const handleClickReupload = (modal_name) => {
        handleExcelPayoutCancel()
        handleReupload(modal_name);
        del('recentFile');
    }



    return (
        <Content>
            <div className='excelContentPayout'>
                <div className='excelBodyPayout'>
                    <div className='excelDescription'>
                        <h1 className='import'>Import data</h1>
                        <h3 className='info'>Uploads a list of Supplier for payout</h3>
                    </div>
                    {upload && (

                        <div className='fileInfoSection'>
                            <div className='fileName'>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    gap: '2px'
                                }}>
                                    <Icon icon="teenyicons:csv-outline"
                                        color="#0da35b"
                                        width={27} height={36} />

                                    <h3 style={{
                                        paddingTop: '10px'
                                    }}>{validationData?.data?.file_name} <span style={{ color: '#414A52' }}>{
                                        upload ? `Successfully Uploaded` : `Successifull Uploaded`}</span> <span style={{
                                            fontStyle: 'normal',
                                            color: '#414A52'
                                        }}> {validationData?.data?.total_payees} Payees.</span></h3>
                                </div>

                                <div>
                                    {upload && excelErrors === false ?

                                        <Icon icon="material-symbols:delete-outline-rounded" color="#f5222d" height={32}
                                            onClick={handleExcelPayoutCancel}
                                            style={{ cursor: 'pointer' }}
                                        /> : ExcelErrors ? (
                                            <div className='excelReupload'
                                                onClick={(e) => handleClickReupload('excel')}
                                            >

                                                <Icon icon="eva:file-add-fill" color="var(--primary)"
                                                    width={20}
                                                    onClick={handleExcelPayoutCancel}
                                                />
                                                <h3 style={{ color: "var(--primary)" }}>Reupload</h3>
                                            </div>
                                        ) : (

                                            <CloseOutlined style={{ fontSize: '25px', color: 'red', cursor: 'pointer' }} />
                                        )
                                    }

                                </div>

                            </div>
                            <div className='progressSection'>
                                {excelErrors ? (
                                    <Progress
                                        percent={100}
                                        status="exception"
                                        strokeColor='#F5222D'
                                        showInfo={false}
                                    />

                                ) : (

                                    <Progress
                                        percent={100}
                                        status='active'
                                        strokeColor='var(--primary)'
                                        showInfo={false}
                                    />
                                )}
                            </div>
                            {excelErrors && (
                                <div>
                                    <ExcelPayoutErrors errorCount={errorCount} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div style={{
                display: 'flex', justifyContent: 'center',
                alignItems: 'center',
                gap: 23
            }}>
                <Button className='excelErrorcancelBtn' onClick={handleExcelPayoutCancel}>
                    Cancel
                </Button>
                <Button className='excelErrorNextBtn' disabled={excelErrors} onClick={handleExcePayoutlNext} loading={nextLoading}>
                    Next
                </Button>

            </div>
        </Content>

    )
}

const PayoutModals = ({
    show,
    type,
    handleCancel,
    payoutInfo,
    handleReupload,
    isEditing,
    editingWorker,
    handleCancelEdit,
    setIsEditing,
    isDeleting,
    handleCancelDelete,
    setIsDeleting,
    payment_id,
    setTableActions
}) => {
    const [openExcelModal, setOpenExcelModal] = useState(false);
    const [upload, setUpload] = useState(false);
    const [recentFile, setRecentFile] = useState({});
    const [excelErrors, setExcelErrors] = useState(false);
    const [errorCount, setErrorCount] = useState([]);

    const [successUpload, setSuccessUpload] = useState(false);
    const [callbackData, setCallbackData] = useState([]);
    const [validationData, setValidationData] = useState([]);

    const [viewSection, setViewSection] = useState('upload');
    const [fileData, setFileData] = useState([]);
    const [fileColumns, setFileColumns] = useState([]);
    const [fileId, setFileId] = useState('');
    const [fileName, setFileName] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const [progress, setProgress] = useState(0);
    const router = useRouter();
    const pusher = usePusher();

    const pusher_env = process.env.NEXT_PUBLIC_PUSHER_ENV;

    useEffect(() => {
        if (router.isReady && viewSection === 'progress' && fileId) {
            let channel = pusher.subscribe(
                `uploading-status-${pusher_env}-${fileId}`
            );

            channel.bind(
                `uploading-status-${pusher_env}-${fileId}-event`,
                function (data) {
                    if (data.status) {
                        setProgress(parseInt(data.status))
                        if (data.status === '100') {
                            router.push({
                                pathname: `/finance/payments/preview`,
                                query: {
                                    paymentId: payment_id,
                                    paymentName: payoutInfo.payout_name
                                }
                            });
                        }
                    }
                }
            );

            return () => {
                // clearInterval(updateProgressFunc);
                // channel.unbind(`uploading-status-${pusher_env}-${fileId}`);
                pusher.unsubscribe();
                // pusher.disconnect(`uploading-status-${pusher_env}-${fileId}`);
            };
        }
    }, [router.isReady, viewSection, progress]);

    const handleExcelModal = (data, validation) => {
        setRecentFile(data);
        if (validation) {
            setOpenExcelModal(true);
            if (validation?.status === 'failed') {
                setExcelErrors(true);
            }
            setErrorCount(validation?.errors)
            setUpload(true);
            setSuccessUpload(false);
        }
        else {
            setUpload(false);
        }
        handleCancel();
    }

    const handleExcelPayoutCancel = () => {
        setOpenExcelModal(false);
        del('recentfile');
        deleteExcelTemp();
    }

    const handleOk = () => {
        setIsModalOpen(false);
    };

    const handleNext = () => {
        if (viewSection === 'upload') {
            setViewSection('mapping');
        } else if (viewSection === 'mapping') {
            setViewSection('progress');
        }
        else {
            // onBack();
        }
    }


    if (type === 'payee' && show) {

        return (
            <Modal
                title={<ModalTitle type={type} payoutInfo={payoutInfo} />}
                okText="Next"
                open={show}
                onOk={handleOk}
                onCancel={handleCancel}
                width={500}
                styles={{
                    body: {
                        height: payoutInfo &&
                            payoutInfo?.meta_data?.payment?.parent_claim &&
                            payoutInfo?.meta_data?.payment?.parent_claim.toLowerCase() === 'payroll'
                            ? 420 : 520
                    }
                }}
                footer={null}
            >
                <PayeeContent
                    handleCancel={handleCancel}
                    payment_id={payment_id}
                    setTableActions={setTableActions}
                    payoutInfo={payoutInfo}
                />
            </Modal>
        )
    }
    if (type === 'excel' && show) {

        return (
            <Modal
                // title={<ModalTitle type={type} />}
                okText="Next"
                open={show}
                onOk={handleOk}
                onCancel={() => {
                    setViewSection('upload');
                    handleCancel()
                }}
                width={700}
                bodyStyle={{
                    height: "fit-content"
                }}
                footer={null}
            >
                {viewSection === "upload" ? (
                    <WorkerExcel
                        handleNext={handleNext}
                        fileName={fileName}
                        uploadSuccess={uploadSuccess}
                        setUploadSuccess={setUploadSuccess}
                        setFileData={setFileData}
                        setFileColumns={setFileColumns}
                        setFileId={setFileId}
                        setFileName={setFileName}
                        type={"payout_momo"}
                        paymentId={payment_id}
                        payoutInfo={payoutInfo}
                        handleCancel={handleCancel}
                    />
                ) : viewSection === 'mapping' ? (
                    <WorkersColumnsMapping
                        setViewSection={setViewSection}
                        uploadSuccess={uploadSuccess}
                        fileId={fileId}
                        fileName={fileName}
                        fileData={fileData}
                        fileColumns={fileColumns}
                        handleCancel={handleCancel}
                        handleNext={handleNext}
                        type={"payout_momo"}
                        paymentId={payment_id}
                        payoutInfo={payoutInfo}
                    />
                ) : viewSection === 'progress' ? (
                    <div className="flex flex-col gap-2">
                        <h2>Uploading</h2>
                        <p>Please wait while we are processing your file.</p>
                        <Progress
                            percent={progress}
                            status="active"
                            strokeColor={'#00A1DE'}
                        />
                    </div>
                ) : (
                    <div>
                        Last step
                    </div>
                )
                }
            </Modal>
        )
    }
    if (type && show) {
        return (
            <Modal
                okText="Next"
                open={show}
                // onOk={handleOk}
                onCancel={handleCancel}
                // width={700}
                footer={null}
                styles={{
                    body: { height: 250 }
                }}
            >
                <div className="flex flex-col items-center justify-center gap-2 h-full">
                    <h1 className="text-black font-inter text-2xl md:text-3xl font-medium leading-normal">Bulk Add</h1>
                    <div className="flex flex-col gap-2">
                        <Button
                            type="primary"
                            className='addWorkerModalBtn'
                            onClick={() => {
                                handleReupload('excel')
                                // handleCancel()
                            }}
                        >
                            MoMo Payees
                        </Button>
                        <Button
                            type="primary"
                            className='addWorkerModalBtn'
                            onClick={handleReupload('excelBank')}
                        >
                            Bank Account Payees
                        </Button>
                    </div>
                </div>
            </Modal>
        )
    }
    if (openExcelModal && show === false) {
        return (
            // <Modal
            //     title={<ModalTitle type={'upload'} />}
            //     okText="Next"
            //     open={openExcelModal}
            //     onOk={handleOk}
            //     onCancel={handleExcelPayoutCancel}
            //     width={800}
            //     bodyStyle={{
            //         height: "fit-content"
            //     }}
            //     footer={null}
            // //closeIcon={<Icon icon="fe:close" className="close" />}
            // >
            //     <ExcelPayout handleExcelPayoutCancel={handleExcelPayoutCancel} handleReupload={handleReupload}
            //         recentFile={recentFile}
            //         upload={upload}
            //         setUpload={setUpload}
            //         excelErrors={excelErrors}
            //         setExcelErrors={setExcelErrors}
            //         setRecentFile={setRecentFile}
            //         errorCount={errorCount}
            //         setTableActions={setTableActions}
            //         setOpenExcelModal={setOpenExcelModal}
            //         payment_id={payment_id}
            //         validationData={validationData}
            //     />

            // </Modal>
            <Modal
                okText="Next"
                open={openExcelModal}
                // onOk={handleOkMapping}
                // onCancel={handleCancelMapping}
                // width={700}
                footer={null}
                styles={{
                    body: { height: 250 }
                }}
            >
                <>
                    <WorkersColumnsMapping
                        uploadSuccess={uploadSuccess}
                        fileId={fileId}
                        fileName={fileName}
                        fileData={fileData}
                        fileColumns={fileColumns}
                    // handleCancel={onBack}
                    // handleNext={handleNext}
                    />
                </>
            </Modal>
        )
    }
    /* ===== EDITING PAYEE Modal==== */
    if (isEditing && show === false) {


        return (
            <Modal
                title={<ModalTitle type={'edit'} payoutInfo={payoutInfo} />}
                okText="Next"
                open={isEditing}
                //onOk={handleEditingPayee}
                onCancel={handleCancelEdit}
                width={500}
                styles={{
                    body: {
                        height: payoutInfo &&
                            payoutInfo?.meta_data?.payment?.parent_claim &&
                            payoutInfo?.meta_data?.payment?.parent_claim.toLowerCase() === 'payroll'
                            ? 350 : 520
                    }
                }}
                footer={null}
            //closeIcon={<Icon icon="fe:close" className="close" />}
            >
                <EditPayeeContent
                    handleCancel={handleCancel}
                    payoutInfo={payoutInfo}
                    editingWorker={editingWorker}
                    setIsEditing={setIsEditing}
                    payment_id={payment_id}
                    setTableActions={setTableActions}
                />

            </Modal>
        )
    }
    /* ===== DELETING PAYEE MODAL==== */
    if (isDeleting && show === false) {
        //Saving Editing payee
        const handleDeletingPayee = (deletingPayeeInfo) => {
            setIsDeleting(false);
            //On OK
            deleteSinglePayee(deletingPayeeInfo.id).then(() => {
                setTableActions(true);
            })
        }

        return (
            <Modal
                title={null}
                okText="Next"
                open={isDeleting}
                onOk={handleDeletingPayee}
                onCancel={handleCancelDelete}
                width={660}
                styles={{
                    body: {
                        height: 'fit-content'
                    }
                }}
                footer={null}
                closeIcon={<Icon icon="fe:close" className="close" />}
            >
                <div className='flex flex-col justify-center items-center p-6 gap-12'>
                    <div className='flex flex-col items-center justify-center w-[566px] h-10'>
                        <p className='font-medium text-lg leading-5 text-black'>
                            Are you sure you would like to Delete {editingWorker.payee_name} from Payout #{payment_id}?
                        </p>
                    </div>
                    <div className='flex w-full gap-9 items-center justify-center'>
                        <Button className='secondaryCustomBtn w-32' onClick={handleCancelDelete}> No </Button>
                        <Button className='primaryBtnCustom w-32' onClick={() => handleDeletingPayee(editingWorker)}> Yes </Button>
                    </div>
                </div>
            </Modal >
        )
    }

}

export default PayoutModals;
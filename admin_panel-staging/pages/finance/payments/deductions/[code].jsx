import React, { useEffect, useState } from 'react'
import { Button, Form, Select, notification, } from 'antd';
import { useRouter } from 'next/router';
import Image from 'next/image';
import localforage from 'localforage';
import OtpDeductions from '@/components/Modals/Deductions/OtpDeductionsModal';
import { InputOtp } from '@/components/Deductions/DeductionsOtp';
import EditDeductionsModal from '@/components/Deductions/EditDeductionsModal';
import Confirm from '@/components/Projects/Modals/Invoice/confirmation';
import ConfirmDeductions from '@/components/Modals/Deductions/ConfirmDeductionsModal';
import DeductionsLayout from '@/components/Layouts/DeductionsLayout/DeductionsLayout';
import RenderLoader from '@/components/Loaders/renderLoader';
import ErrorComponent from "@/components/Error/Error"
import InfoIconSvg from '@/assets/svgs/info-circle.svg';
import deleteSvg from '@/assets/svgs/delete_d.svg';
import { capitalizeAll } from '@/helpers/capitalize';
import { clearLocalForage, createOTP, getAllOtpTypes, getWorkers, verifyDeductionOTP } from '@/helpers/deduction/deduction';
import { checkLink } from '@/middlewares/checkLink';



export default function Deductions() {
    const [modalOpen, setModalOpen] = useState(false);
    const [deductionsTypes, setDeductionsTypes] = useState([]);

    const [openConfirmModal, setOpenConfirmModal] = useState(false);
    const [isSelected, setIsSelected] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [workersSelected, setWorkersSelected] = useState([]);
    const [workersSelectedDeductions, setWorkersSelectedDeductions] = useState({
        deductions: [],
        total_external_deductions: 0,
    });
    const [workers, setWorkers] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [otp, setOtp] = useState('');
    const [otpVerification, setOtpVerification] = useState({
        otp_type_id: 3,
        otp_pin: "",
        email: "",
    });
    const [next, setNext] = useState(false);
    const [verifyNumber, setVerifyNumber] = useState(false);
    const [paymentId, setPaymentId] = useState(null);
    const [payeeId, setPayeeId] = useState(null);
    const [other, setOther] = useState(false);
    const [btnLoading, setBtnLoading] = useState(false);
    const [payee_info, setPayeeInfo] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [deductions, setDeductions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false)
    const [errorCode, setErrorCode] = useState(404)
    const [errorMessage, setErrorMessage] = useState('')
    const [workerDeductionsTypes, setWorkerDeductionsTypes] = useState([]);
    const [workerSelected, setWorkerSelected] = useState([]);
    const [otpId, setOtpId] = useState(null)

    const router = useRouter();

    // Handling deductions of the worker
    const handleDeductionWorker = async (deductionValues) => {
        // console.log("deductionValues ===>", deductionValues, "workersSelectedDeductions", workersSelectedDeductions)
        let payeeID = await localforage.getItem(`payeeId_${payeeId}_${paymentId}`);

        if (!Array.isArray(deductionValues)) {
            deductionValues = [deductionValues];
        }
        // Iterate over the deductionValues array
        deductionValues.forEach((deduction) => {
            const existingDeduction = workersSelectedDeductions.deductions.find((existing) => existing.deductionType === deduction.deductionType);
            if (existingDeduction) {
                existingDeduction.amount = deduction.amount;
            } else {
                // workersSelectedDeductions.deductions.push(deduction);
                const deductionType = deductionsTypes.find((type) => type.id === deduction.deductionType);
                if (!deductionType) {
                    return notification.error({
                        message: "Failed",
                        description: "Please select deductions first",
                    })
                }
                workersSelectedDeductions.deductions.push({
                    deductionType: deduction.deductionType,
                    title: deductionType.title,
                    amount: deduction.amount
                });

            }
        });

        // Calculate the total sum of all deductions
        const totalDeductions = workersSelectedDeductions.deductions.reduce((total, deduction) => {
            return total + parseFloat(deduction.amount);
        }, 0);

        // // Update the total_external_deductions property of the object
        workersSelectedDeductions.total_external_deductions = totalDeductions;

        setWorkersSelected(prevState => {
            const updatedItems = prevState.map(item => {
                if (item.id?.toString() === selectedId?.toString()) {
                    return {
                        ...item,
                        total_external_deductions: workersSelectedDeductions.total_external_deductions,
                        deductions_external: workersSelectedDeductions.deductions

                    }
                }
                return item
            })
            localforage.setItem(`workerSelected_${payeeID}`, updatedItems);
            return updatedItems;
        })



        form.resetFields()
        setModalOpen(false);

    };

    const fetchWorkers = async (paymentId, payeeId) => {
        try {
            const response = await getWorkers(paymentId, payeeId);
            if (response?.status !== "failed") {
                const { data } = response;
                const { deduction_state: deductionState } = response?.data;
                const { payee_info, deductions_types: deductionsTypes } = data;

                setPayeeInfo(payee_info || []);
                setDeductionsTypes(deductionsTypes);
                saveToLocalforage(data, data.workers[0].payment_id, payeeId);
                if (deductionState?.toString()?.toLowerCase() === "submitted") {
                    router.push({
                        pathname: '/finance/payments/deductions/success/list',
                        query: { payee_id: payeeId, payment_id: paymentId },
                    });
                } else {
                    setLoading(false);
                    setError(false);
                }
            } else {
                const { error: errorMessage } = response;
                notification.error({ message: "Failed", description: errorMessage });
                setLoading(false);
                setError(true);
                setWorkers([]);
                setErrorCode(400);
                setErrorMessage(errorMessage);
            }
        } catch (error) {
            // console.log("catch 1", error);
            notification.error({ message: "Failed", description: "Oops... You do not have permission to access this page." });
            setLoading(false);
            setError(true);
            setErrorCode(403);
            setErrorMessage("You are not authorized to access this page");
            setWorkers([]);
        }
    }


    useEffect(() => {
        const { code } = router.query;

        if (code) {
            const { payment_id, payee_id } = checkLink(code);
            if (payment_id && payee_id) {
                setPaymentId(payment_id);
                setPayeeId(payee_id);
                localforage.setItem(`payeeId_${payee_id}_${payment_id}`, `${payee_id}_${payment_id}`);

                fetchWorkers(payment_id, payee_id);
            }
        }
    }, [router.query.code]);

    useEffect(() => {
        getAllOtpTypes().then((res) => {
            if (res && res?.length > 0) {
                let otpID = res.find(item => item.type_name === "external").id;
                setOtpId(otpID)
            }
        })
    }, [])

    const [form] = Form.useForm();
    const onFinishFailed = (errorInfo) => {
        console.log("Failed:", errorInfo);
    };
    const onFinish = async () => {
        let payeeID = await localforage.getItem(`payeeId_${payeeId}_${paymentId}`);
        setVerifyNumber(true);
        // console.log("workersSelected ===>", workersSelected);
        let deductions = deductionBody(workersSelected)
        localforage.setItem("deductions_" + payeeID + "", deductions).then((res) => {
            setDeductions(deductions)
        });
    };

    const resendOTP = () => {
        setVerifyNumber(true);
        setNext(false)
        // let encodedIdz = Buffer.from({ payee_id: payee_id, payment_id: payment_id }).toString('base64');
    };

    // handling the external deductions array
    const getWorkerDeductionExternal = (deductions_external_data_worker) => {
        // console.log("deductions_external_data_worker", deductions_external_data_worker);

        let response = [];
        for (let index = 0; index < deductions_external_data_worker.length; index++) {
            const element = deductions_external_data_worker[index];
            var body_data = {
                "amount": element.amount,
                "type_id": element.deductionType
            }
            response.push(body_data);
        }
        return response;
    }

    const deductionBody = (data_to_transformed) => {
        let response = [];
        for (let index = 0; index < data_to_transformed.length; index++) {
            const item = data_to_transformed[index];
            var deduction_body = {
                "assigned_worker_id": parseInt(item.assigned_worker_id),
                "payroll_transaction_id": item.id,
                "project_id": headers?.project_id,
                "deductions": getWorkerDeductionExternal(item.deductions_external)
            };
            response.push(deduction_body)
        }
        return response;

    }

    const handleClose = () => {
        setModalOpen(false);
        setWorkersSelectedDeductions({
            deductions: [],
            total_external_deductions: 0
        });
    };

    const handleShowDeductionsModal = (id) => {

        setSelectedId(id);
        setWorkerDeductionsTypes(deductionsTypes?.filter(item => item.is_available === true && item.is_external === true && item.title !== "other"))

        let worker_selected = workersSelected.find(item => item.id.toString() === id.toString());
        setWorkerSelected(worker_selected);

        setWorkersSelectedDeductions({
            deductions: worker_selected?.deductions_external || [],
            total_external_deductions: worker_selected?.total_external_deductions || 0
        });
        setModalOpen(true);
    };

    useEffect(() => {
    }, [workersSelected])


    const showConfirm = (deductionId) => {
        setDeleteId(deductionId);
        setOpenConfirmModal(true);

    };

    const closeConfirm = () => {
        setOpenConfirmModal(false);
    };

    const closeConfirmNumberModal = () => {
        setVerifyNumber(false);
    }
    const closeOtpDeductionsModal = () => {
        setNext(false);
    }

    const saveToLocalforage = (workers_list, payroll_id, payee_id) => {
        localforage.getItem(`workersList_${payee_id}_${payroll_id}`).then((res) => {
            if (!res) {
                localforage.setItem(`workersList_${payee_id}_${payroll_id}`, workers_list).then((res) => {
                    // setDeductionsTypes(res?.deductions_types)
                    setWorkers(res?.workers)
                    setHeaders(res?.payment_info)
                })
            } else {
                if (payroll_id.toString() === res.workers[0]?.payment_id?.toString() && `workersList_${payee_id}_${payroll_id}`.split("_")[1] === payee_id?.toString() && `workersList_${payee_id}_${payroll_id}`.split("_")[2] === payroll_id?.toString()) {
                    // setDeductionsTypes(res?.deductions_types)
                    setWorkers(res?.workers)
                    setHeaders(res?.payment_info)

                    localforage.getItem(`workerSelected_${payee_id}_${payroll_id}`).then((res) => {
                        if (res) {
                            setWorkersSelected(res)
                        }
                    })

                } else {
                    clearLocalForage(payee_id, payroll_id)
                    localforage.setItem(`workersList_${payee_id}_${payroll_id}`, workers_list).then((res) => {
                        // setDeductionsTypes(res?.deductions_types)
                        setWorkers(res?.workers)
                        setHeaders(res?.payment_info)
                    })
                }

            }
        })
    }

    const addWorker = (worker_id) => {
        let worker = workers?.filter((item) => item?.worker_id?.toString() === worker_id?.toString());
        let checkWorker = workersSelected.filter((item) => item?.worker_id?.toString() === worker_id?.toString());
        if (worker.length > 0 && checkWorker.length === 0) {
            // TODO: review this
            worker[0].deductions_external = [];
            worker[0].total_external_deductions = 0;
            setWorkersSelected(result => [...result, worker[0]]);
            let worker_to_add_to_forage = [...workersSelected, worker[0]]
            localforage.setItem(`workerSelected_${payeeId}_${paymentId}`, worker_to_add_to_forage)
        }
    }

    const removeWorker = (index) => {
        workersSelected.splice(index, 1);
        setWorkersSelected(result => [...workersSelected]);
        localforage.setItem(`workerSelected_${payeeId}_${paymentId}`, workersSelected)
    }
    // Number confirmation content
    const ConfirmPhoneNumber = () => {
        const [restaurantPhoneNumber, setRestaurantPhoneNumber] = useState('');

        // func to verify phone before sending OTP
        const verifyPhoneNumber = () => {
            /**
             * Verify phone number length && number if Phone Number is for a given restaurant 
             * && currentPayee?.phone_number.toString() === restaurantPhoneNumber.toString()
             * @param {string} restaurantPhoneNumber
             * @return
             */
            if (restaurantPhoneNumber.length === 10) {
                createOTP(restaurantPhoneNumber, otpId).then(response => {
                    setNext(true)
                    setVerifyNumber(false)
                })
                notification.success({
                    message: 'Excellent',
                    description: `Pin Sent successfully , check  your phone number starts with ${restaurantPhoneNumber.toString().substring(0, 5)}xxxxxxxx`,

                })

            } else {
                notification.warning({
                    message: 'Warning',
                    description: 'Please enter a valid phone number',

                })
            }
        }

        return (
            <>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '20px',
                }}>
                    <span style={{
                        width: "100%",
                        color: "var(--character-title-85, rgba(0, 0, 0, 0.85))",
                        fontSize: "14px",
                        fontStyle: "normal",
                        fontWeight: "600",
                        lineHeight: "22px",
                    }}>Phone Number</span>

                    <Select
                        allowClear={true}
                        showSearch={true}
                        size="large"
                        placeholder='Select your phone number'
                        onSelect={(item_selected) => {
                            setRestaurantPhoneNumber(item_selected);
                        }}
                        style={{
                            borderRadius: "5px", color: "#A8BEC5",
                            background: "#F7FBFE",
                            width: "100%",
                        }}
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                            option.label.includes(
                                input.slice(1).toLowerCase()
                            )
                        }
                        options={payee_info.filter(item => item.id.toString() === payeeId.toString()).map((item, index) => ({
                            label: capitalizeAll(item.phone_number),
                            value: item.phone_number,
                            key: index,
                        }))}
                        showArrow={false}
                    />
                    <Button type="primary" className="primaryBtn"
                        onClick={verifyPhoneNumber}>Next</Button>
                </div>
            </>
        );
    }

    const handleOtpInput = (otp) => {
        setOtp(otp);
        setOtpVerification({
            ...otpVerification,
            otp_pin: parseInt(otp),
            email: "userEmail",
        });
    }

    const handleOtpSubmit = async () => {
        // setBtnLoading(true);
        //check the otp is of length of 5

        const body = {
            "otp_type_id": otpId,
            "otp_pin": otp,
            "email": payee_info[0].email,
            "phone_number": payee_info[0].phone_number,
            "all_deductions": deductions,
            "payment_id": paymentId,
            "payee_name_id": payeeId

        }
        if (otp.length === 5) {
            try {
                const res = await verifyDeductionOTP(body)

                if (res.status_code === 400) {
                    setBtnLoading(false);

                    notification.error({
                        message: 'Failed',
                        description: `${res.error || res.error_message}`,

                    })
                    return
                }

                setBtnLoading(false);
                setNext(false)

                notification.success({
                    message: 'Success',
                    description: `Deductions added successfully`,

                })
                localforage.setItem("total_deductions_" + payeeId + "_" + paymentId, res.data)

                router.push({
                    pathname: '/finance/payments/deductions/success', query: {
                        payment_id: paymentId,
                        payee_id: payeeId,
                        success: true
                    }
                });

            } catch (error) {
                setBtnLoading(false);
                // console.log("error", error)
                notification.error({
                    message: 'Error',
                    description: `Failed ${error}`,
                })
            }
        }
        else {
            setBtnLoading(false);
            notification.warning({
                message: 'Warning',
                description: 'Please enter a valid OTP',
            })
        }
    }

    const onSelect = (values) => {
        if (values === "Other") {
            setOther(true);
        } else {
            setOther(false);
        }
    };

    if (loading) {
        return <RenderLoader />
    }
    else if (error) {
        return <ErrorComponent status={errorCode} message={errorMessage} backHome={false} />
    }

    return (
        <>
            <Confirm
                openConfirmModal={openConfirmModal}
                closeConfirm={closeConfirm}
                message={`Are you sure you want to remove this deduction?`}
                buttonText={`Yes`}
                cancelText={`No`}
                handleOk={() => {
                    removeWorker(deleteId)
                    closeConfirm();
                }}
            />
            <ConfirmDeductions
                open={verifyNumber}
                closeConfirmNumberModal={closeConfirmNumberModal}
                content={<ConfirmPhoneNumber />}
                title={<h3>Submit Deductions</h3>}
            />
            <OtpDeductions
                open={next}
                closeOtpDeductionsModal={closeOtpDeductionsModal}
                content={
                    <InputOtp payment_info={headers} otp={otp} setOtp={setOtp} payee={payee_info.length > 0 ? payee_info[0]?.names : ''} resendOTP={resendOTP}
                        handleOtpInput={handleOtpInput} handleOtpSubmit={handleOtpSubmit} btnLoading={btnLoading} />
                }
                title={<h3>Confirm</h3>}
            />
            <EditDeductionsModal
                modalOpen={modalOpen}
                handleDeductionWorker={handleDeductionWorker}
                onFinishFailed={onFinishFailed}
                workersSelectedDeductions={workersSelectedDeductions}
                deductionsTypes={workerDeductionsTypes}
                handleClose={handleClose}
                onSelect={onSelect}
                other={other}
                form={form}
                workerSelected={workerSelected}
            />
            <div className="flex flex-col gap-5">
                <div className="flex flex-row gap-3 items-center justify-start">
                    <span
                        className='font-bold text-xl capitalize'
                    >payroll deductions #{paymentId}</span>
                    <Image src={InfoIconSvg} priority color='#000' alt='' />
                    <span
                        className='deductions-header'
                    >{headers?.project_name}</span>
                    <span
                        className='deductions-header'
                    >{headers?.start_date} - {headers?.end_date}</span>
                    <span
                        className='deductions-header'
                    >{payee_info.length > 0 ? payee_info[0]?.names : ''}</span>

                </div>
                <div className='h-fit flex flex-col gap-2.5 bg-white px-2.5 py-5 rounded-md'>
                    <span className='heading-3'>Add Workers to the list</span>
                    <div className='bg-[#DFF3FB] flex items-center justify-between  gap-2.5 py-1 px-2 w-full h-10 rounded-md'>
                        <span className='deductions-column'>Name</span>
                        <span className='deductions-column'>MoMo Number</span>
                        <span className='deductions-column'>Shifts</span>
                        <span className='deductions-column'>Amount</span>
                    </div>
                    <Form name="dynamic_form_nest_item" autoComplete="off" form={form}>
                        <Form.List name="workers">
                            {(fields, { add, remove }) => (
                                <>
                                    {workersSelected.map((item, index) => (
                                        <div key={index} className='flex items-start justify-between gap-2.5 px-0.5 py-1 w-full h-16 !important'>
                                            <span className='deductions-input bg-[##F7FBFE]'>
                                                {capitalizeAll(item.worker_name)}
                                            </span>
                                            <span className='deductions-input'>
                                                {item.phone_number}
                                            </span>
                                            <span className='deductions-input'>
                                                {parseInt(item.total_shifts)}
                                            </span>
                                            <span className='flex gap-3 items-center justify-between px-3 py-6 w-full h-10 rounded-md border border-[#d4d7d9]'>
                                                {item.total_external_deductions}
                                                <div
                                                    onClick={() => handleShowDeductionsModal(item.id)}
                                                    style={{
                                                        cursor: "pointer",
                                                        color: "#00A1DE",
                                                        fontStyle: "normal",
                                                        fontWeight: "500",
                                                        fontSize: "16px",
                                                    }}
                                                >
                                                    Edit Deductions
                                                </div>
                                            </span>
                                            <Image src={deleteSvg} alt='' priority style={{ cursor: "pointer" }} width={200} height={200} onClick={() =>
                                                showConfirm(index)
                                            } />
                                        </div>
                                    ))}

                                    <div style={{
                                        display: "flex",
                                        flexDirection: "row",
                                        alignItems: "flex-start",
                                        justifyContent: "space-between",
                                        gap: "10px",
                                        padding: "2px 4px",
                                        width: "100%",
                                        height: "64px"
                                    }}>
                                        <Form.Item>
                                            <Select
                                                allowClear={true}
                                                showSearch={true}
                                                size="large"
                                                onSelect={(item_selected) => {
                                                    addWorker(item_selected);
                                                    add();
                                                    setIsSelected(true);
                                                    form.resetFields()
                                                }}
                                                style={{
                                                    width: "332px",
                                                }}
                                                placeholder="Search Worker by Name or Phone"
                                                optionFilterProp="children"
                                                filterOption={(input, option) =>
                                                    option.query.includes(
                                                        input.slice(1).toLowerCase()
                                                    )
                                                }
                                                options={workers.filter((itemI) => !workersSelected.find((item) => item.worker_id === itemI.worker_id)).map((item, index) => ({
                                                    label: `${capitalizeAll(item.worker_name)}`,
                                                    query: `${capitalizeAll(item.worker_name)} ${item.phone_number}`,
                                                    value: item.worker_id,
                                                    key: index,
                                                }))}
                                                showArrow={false}
                                            />
                                        </Form.Item>
                                        {[...Array(3)].map((_, i) => (
                                            <span
                                                key={i}
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    padding: "12px 24px",
                                                    gap: "12px",
                                                    width: "100%",
                                                    height: "40px",
                                                    borderRadius: "5px",
                                                    border: "1px solid #d4d7d9",
                                                }}>
                                                {"-"}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </Form.List>
                        <Form.Item>
                            <div className="w-full flex justify-end">
                                <Button type="primary" className={"primaryBtn"} onClick={onFinish}>
                                    Submit
                                </Button>
                            </div>
                        </Form.Item>
                    </Form>
                </div>
            </div>

        </ >
    )
}

Deductions.getLayout = function getLayout(page) {
    return <DeductionsLayout isDeductions={true}>{page}</DeductionsLayout>;
};
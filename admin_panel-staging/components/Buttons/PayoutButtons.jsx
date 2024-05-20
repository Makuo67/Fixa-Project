import React, { useState } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Icon } from "@iconify/react";

import { StyledPaymentButton } from './NewPaymentButton.styled';
import ExportButtons from './ExportButtons';
import PayoutModals from './../Modals/PayoutModals'

const PayoutButtons = ({ exportEnabled, showExport, payoutInfo, payment_id, setTableActions, payoutData, payout, payoutStatus }) => {
    const [modalType, setModalType] = useState('');
    const [showModal, setShowModal] = useState(false);

    const handleButtonClick = (modal_name) => {
        setShowModal(true);
        setModalType(modal_name);
    };

    const handleCancel = () => {
        setShowModal(false);
        console.log("Clicked")
    };

    return (
        <StyledPaymentButton>
            <div
                className='flex items-start gap-[5px] p-0'
            >
                {payoutStatus === 'unpaid' && (
                    <>
                        <Button
                            className='primaryBtn text-white'
                            type='primary'
                            icon={<PlusOutlined className='text-white' />}
                            onClick={(e) => handleButtonClick('payee')}
                        >
                            Add Payee
                        </Button>
                        {
                            payoutInfo.meta_data
                                && payoutInfo?.meta_data?.payment?.parent_claim && payoutInfo?.meta_data?.payment?.parent_claim.toLowerCase() === 'payroll' ?
                                "" : (
                                    <Button
                                        type="primary"
                                        className='primaryBtn text-white'
                                        // className='addPayee'
                                        icon={
                                            <Icon
                                                icon="ph:upload-bold"
                                                className='text-white'
                                                height={18}
                                            />
                                        }
                                        onClick={(e) => handleButtonClick('choosePayment')}
                                    >
                                        Bulk Add
                                    </Button>)}
                    </>
                )}
                {showExport && (

                    <ExportButtons disabled={exportEnabled} key={4} payoutData={payoutData} payment_id={payment_id} payout={payout} />
                )}

            </div>
            <PayoutModals
                show={showModal}
                setShowModal={setShowModal}
                type={modalType}
                setModalType={setModalType}
                handleCancel={handleCancel}
                payoutInfo={payoutInfo}
                handleReupload={handleButtonClick}
                payment_id={payment_id}
                setTableActions={setTableActions}
            />
        </StyledPaymentButton >
    )
}

export default PayoutButtons;
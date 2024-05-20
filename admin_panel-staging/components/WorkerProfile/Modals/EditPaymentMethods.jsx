import React from 'react'
import { Modal } from 'antd'
import { PaymentMethods } from '@/components/shared/PaymentMethods';
import { updateWorkerPaymentMethods } from '@/helpers/payment-methods/payment-methods';
import { useRouter } from 'next/router';
import { extractDefaultWorkerPaymentValues } from '@/utils/transformObject';

export const EditPaymentMethods = ({ isModalOpen, setIsModalOpen, paymentMethods, setPaymentMethodUpdated }) => {

    const router = useRouter()
    const { worker_id } = router.query

    const handleOk = async (payment_methods) => {
        const data = {
            "payment_methods": payment_methods
        }
        setPaymentMethodUpdated(true)
        await updateWorkerPaymentMethods(worker_id, data)
            .then((response) => {
                setIsModalOpen(false);
            }).finally(() => {
                setPaymentMethodUpdated(false)
            })
            .catch((error) => {
                console.log("errors", error);
            });

    };
    const handleCancel = () => {
        setIsModalOpen(false);
    };
    return (
        <>
            <Modal
                title={false}
                open={isModalOpen}
                onOk={handleOk}
                onCancel={handleCancel}
                footer={null}
            >
                <PaymentMethods showTitle={true} titleText={"Edit Payment Methods"} cancelText={"Cancel"} handleCancel={handleCancel} handleSave={handleOk} paymentMethods={extractDefaultWorkerPaymentValues(paymentMethods)} />
            </Modal>
        </>
    )
}

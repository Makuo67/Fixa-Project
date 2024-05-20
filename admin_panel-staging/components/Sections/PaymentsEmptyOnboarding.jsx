import { Icon } from '@iconify/react';
import { PaymentModals } from '..';
import { getPaymentTypes } from '@/helpers/payments/payments_home';
import { useEffect, useState } from 'react';

export const PaymentsEmptyOnboarding = ({ createPayroll, createPayout }) => {
    const [modalType, setModalType] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [paymentTypes, setPaymentTypes] = useState([]);
    const [modalTitle, setModalTitle] = useState("");

    useEffect(() => {
        getPaymentTypes().then((response) => {
            if (response){
                let items = [];
                response.map((item) => {
                    let innerItem = {
                        label: item.type_name,
                        key: item.id,
                    };
                    items.push(innerItem);
                });
                setPaymentTypes(items);
            }
        });
    }, [])

    const handleCreatePayroll = () => {
        setShowModal(true);
        setModalType('Payroll');
        setModalTitle('New Payroll');
    }
    const handleCreatePayout = () => {
        setShowModal(true);
        setModalType('Payout');
        setModalTitle('New Payout');
    }

    const handleCancel = () => {
        setShowModal(false);
    };
    return (
        <>
            <div className='h-full flex flex-col items-center justify-center  gap-10'>
                <div className="header text-center">
                    <h1 className="heading-1 capitalize">Create a New Payment</h1>
                    <p className="sub-heading-1">
                        Create a new Payroll or Payout to carry bulk payments.
                    </p>
                </div>
                <div className='flex gap-8'>
                    <div className='flex flex-col gap-4 items-center justify-center bg-white h-60 w-60 rounded-md border hover:border-2 border-primary cursor-pointer' onClick={handleCreatePayroll}>
                        <Icon icon="ic:baseline-plus" className='text-primary' height={24} />
                        <span className='text-primary text-xl font-normal'>New Payroll</span>
                    </div>
                    <div className='flex flex-col gap-4 items-center justify-center bg-white h-60 w-60 rounded-md border hover:border-2 border-primary cursor-pointer' onClick={handleCreatePayout}>
                        <Icon icon="ic:baseline-plus" className='text-primary' height={24} />
                        <span className='text-primary text-xl font-normal'>New Payout</span>
                    </div>
                </div>
            </div>
            <PaymentModals
                show={showModal}
                type={modalType}
                handleCancel={handleCancel}
                paymentTypes={paymentTypes}
                title={modalTitle}
            />
        </>
    )
}
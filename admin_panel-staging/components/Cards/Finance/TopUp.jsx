import React from 'react';
import { Button, Modal } from 'antd';
import { Icon } from "@iconify/react";
import UploadImage from '@/components/shared/UploadImage';


export const WalletCard = ({ title, Content, width, height, border, borderColor }) => {
    return (
        <div className={`
        ${width ? width : 'w-full'}  
        ${border && 'border'} 
        ${borderColor ? borderColor : 'border-primary'} 
        bg-white rounded-xl 
        ${height ? height : 'h-60'} flex flex-col p-3`}
        >
            <div className="flex gap-2 items-center">
                <Icon icon="ic:outline-account-balance-wallet" className="text-primary h-7 w-7" />
                <h1 className="text-primary text-lg font-normal">{title}</h1>
            </div>
            <div className="h-full">
                <Content />
            </div>
        </div>
    )
}

const CardItem = ({ title, icon, information }) => (
    <div className='flex w-full justify-between items-center'>
        <div className='flex gap-2'>
            <span>
                {icon}
            </span>
            <p>{title}</p>
        </div>
        <p>{information ? information : 'XXXXXXXXXXXXX'}</p>
    </div >
)

export const ContactUsContent = () => {
    const manager = process.env.NEXT_PUBLIC_MANAGER_NAME;
    const email = process.env.NEXT_PUBLIC_MANAGER_EMAIL;
    const phoneNumber = process.env.NEXT_PUBLIC_MANAGER_PHONE;

    return (
        <div className='flex flex-col p-4'>
            <CardItem title={'Finance Manager'} information={manager} icon={<Icon icon="ant-design:bank-filled" className="text-primary" width="20" height="20" />} />
            <CardItem title={'Email'} information={email} icon={<Icon icon="ant-design:user-outlined" className="text-primary" width="20" height="20" />} />
            <CardItem title={'Phone Number'} information={phoneNumber} icon={<Icon icon="ant-design:number-outlined" className="text-primary" width="20" height="20" />} />
        </div>

    )
}

export const TopUpModal = ({ isModalVisible, handleOk, handleCancel, handleReceipt, submitLoading, topUpRequirements }) => {
    const TopUpContent = () => {
        const bank_name = process.env.NEXT_PUBLIC_BANK_NAME;
        const account_name = process.env.NEXT_PUBLIC_ACCOUNT_NAME;
        const account_number = process.env.NEXT_PUBLIC_ACCOUNT_NUMBER;

        return (
            <div className='h-full'>
                <div className='flex flex-col p-4'>
                    <CardItem title={'Bank Name'} information={bank_name} icon={<Icon icon="ant-design:bank-filled" className="text-primary" width="20" height="20" />} />
                    <CardItem title={'Account Name'} information={account_name} icon={<Icon icon="ant-design:user-outlined" className="text-primary" width="20" height="20" />} />
                    <CardItem title={'Account Number'} information={account_number} icon={<Icon icon="ant-design:number-outlined" className="text-primary" width="20" height="20" />} />
                </div>

                <div className='p-5 flex flex-col gap-5 items-center'>
                    <p className='text-center text-[#212121] font-normal'>
                        To top up your wallet, use the above account details to send your payments then upload the receipt below.
                    </p>
                    <div>
                        <p className='text-center text-[#212121] font-normal'>
                            <span className='text-bder-red'>*</span> (The receipt file is required.)
                        </p>
                        <UploadImage uploadText={'Click or drag file your receipt to this area'} hint={'Upload receipt (PDF/JPG)'} setImageUrl={handleReceipt} isDoc={true} />
                    </div>
                    <Button
                        className='primaryBtnCustom w-32 mt-5'
                        type='primary'
                        loading={submitLoading}
                        onClick={handleOk}
                        disabled={topUpRequirements?.balance_receipt_link === ''}
                    >
                        Submit
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <>
            <Modal
                open={isModalVisible} onCancel={handleCancel}
                footer={null}
                width={900}
                styles={
                    {
                        body: {
                            background: 'transparent',
                        },
                        // content: {
                        //     background: 'transparent',
                        // }
                    }
                }
            >
                <div className='flex gap-5 pt-8'>

                    <WalletCard title={'Top up account details'} key={'top_details'} Content={TopUpContent} width={'w-[600px]'} height={'h-[520px]'} border={true} />
                    <WalletCard title={'Contact Us'} key={'contact_us'} Content={ContactUsContent} width={'w-[400px]'} height={'h-[150px]'} border={true} />
                </div>
            </Modal>
        </>
    );
}

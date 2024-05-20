import { useEffect, useState } from 'react';
import React from 'react';
import { Icon } from '@iconify/react';
import { Button, notification } from 'antd';
import ContinueSkipBtn from '@/components/Buttons/ContinueSkipBtn';
import { getCurrentToken } from '@/helpers/getCurrentToken';
import { useRouter } from 'next/router';

const ShiftTypes = ({ handleNextStep }) => {
    const [dayShift, setDayShift] = useState(false);
    const [nightShift, setNightShift] = useState(false);
    const [token, setToken] = useState("");
    const [btnLoading, setBtnLoading] = useState(false);

    const router = useRouter()
    const { pathname } = router

    useEffect(() => {
        getCurrentToken().then(data => {
            setToken(data)
        })
    }, [])
    const handleDayShiftChange = () => {
        setDayShift(!dayShift);
    };

    const handleNightShiftChange = (value) => {
        setNightShift(!nightShift);
    };

    const handleAddShifts = async () => {
        setBtnLoading(true)
        const response = await fetch('/api/shiftsType', {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ "shifts": [dayShift ? 1 : 0, nightShift ? 2 : 0], "jwtToken": token }),
        })

        const data = await response.json()
        if (data?.status === "success") {
            handleNextStep()
            setBtnLoading(false)
            notification.success({
                message: "Success",
                description: "Shifts added successfully",
                placement: "bottomRight",
            })
        } else {
            notification.error({
                message: "Failed",
                description: data.message,
                placement: "bottomRight",
            })
        }
    };

    return (
        <div className='flex flex-col gap-2'>

            <div>
                <p className='formDescription'>Select the shift types that would be available for this site.</p>
            </div>

            <div className='flex flex-col gap-2'>
                <div
                    className='flex justify-start items-center gap-2 p-2 rounded-md bg-formBg cursor-pointer'
                    onClick={handleDayShiftChange}
                >
                    {dayShift ? (
                        <Icon icon="solar:check-circle-outline" width={36} height={36} className='text-primary' />
                    ) : (
                        <Icon icon="bi:circle" width={36} height={36} className='text-primary border-primary' />
                    )}
                    <h2 className='font-normal text-base text-sub-title'>Day shift</h2>
                </div>

                {/* ==== Night shift ==== */}
                <div
                    className='flex justify-start items-center gap-2 p-2 rounded-md bg-formBg cursor-pointer'
                    onClick={handleNightShiftChange}
                >
                    {nightShift ? (
                        <Icon icon="solar:check-circle-outline" width={36} height={36} className='text-primary' />
                    ) : (
                        <Icon icon="bi:circle" width={36} height={36} className='text-primary border-primary' />
                    )}
                    <h2 className='font-normal  text-base text-sub-title'>Night shift</h2>
                </div>

                <ContinueSkipBtn
                    skip={pathname === "/onboarding" ? true : false}
                    onClick={handleAddShifts}
                    onSkip={handleNextStep}
                    btnText={"Continue"}
                    loading={btnLoading}
                />
            </div>
        </div>
    )
}

export default ShiftTypes;
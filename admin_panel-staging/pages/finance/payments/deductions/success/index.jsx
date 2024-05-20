import { useRouter } from 'next/router'
import localforage from 'localforage'
import React, { useState } from 'react'
import DeductionsLayout from '../../../../../components/Layouts/DeductionsLayout/DeductionsLayout'
import { useEffect } from 'react'
import { clearLocalForage } from '../../../../../helpers/deduction/deduction'
import { object } from 'underscore'
import { useUserAccess } from '@/components/Layouts/DashboardLayout/AuthProvider'
import ErrorComponent from '../../../../../components/Error/Error'
import { toMoney } from '@/helpers/excelRegister'

export default function DeductionSuccess(props) {
    const [amount, setAmount] = useState(0)
    const [totalWorkers, setTotalWorkers] = useState(0)
    const [error, setError] = useState(false)
    const router = useRouter()
    const { userAccess, userProfile } = useUserAccess();

    const { payment_id, payee_id, success } = router.query
    /**
     * Avoid direct access to this page
     */

    const getTotalWorkers = async () => {
        const total = await localforage.getItem(`deductions_${payee_id}_${payment_id}`)
        if (total) {
            setTotalWorkers(total.length)
            return total?.length
        } else {
            setError(true)
            setTotalWorkers(0)
        }
    }

    const getSumAmount = async () => {
        await localforage.getItem(`total_deductions_${payee_id}_${payment_id}`).then((res) => {
            if (typeof res === "object" || typeof res === object) {
                let sum_deductions = res?.amount
                setAmount(sum_deductions)
                return sum_deductions
            }
            else {
                setError(true)
                setAmount(0)
            }
        })
    }

    useEffect(() => {
        try {

            getTotalWorkers()
            getSumAmount()

        } catch (error) {
            console.log("error", error)
        }
    }, [success])

    // if (!userProfile?.workforce_view) {
    //     return <ErrorComponent status={403} backHome={true} />
    // }
    return (
        <>
            {error ? <ErrorComponent status={404} message="Submit deductions first" />
                : !success ? <ErrorComponent status={403} message="Submit deductions first" />
                    : <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '10px',
                        height: '60vh',
                    }}>
                        <span style={{
                            fontStyle: 'normal',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            color: '#171832',
                        }}
                        >Deductions submitted successfully
                        </span>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                gap: '30px',
                                fontSize: '25px',
                                fontStyle: 'normal',
                                fontWeight: '500',
                                color: '#389E0D',
                            }}>
                            <span>
                                {totalWorkers} workers
                            </span>
                            <span>
                                {toMoney(amount)} RWF
                            </span>
                        </div>
                        <span
                            className='cursor-pointer underline text-primary'
                            onClick={() => {
                                router.push({
                                    pathname: '/finance/payments/deductions/success/list', query: {
                                        payee_id: payee_id, payment_id: payment_id, list: true
                                    }
                                })
                                clearLocalForage(payee_id, payment_id)
                            }
                            }
                        >
                            View List
                        </span>
                    </div>
            }
        </>
    )
}

DeductionSuccess.getLayout = function getLayout(page) {
    return <DeductionsLayout>{page}</DeductionsLayout>;
};

import React from 'react';
import Stats from '../Stats/Stats';
import { toMoney } from '@/helpers/excelRegister';

const PayrollStats = ({ paymentRun, payrollAggregates, payrollDataHeader, loading, setShowDeductionsModal, setShowNetAmountModal }) => {
    const { successful = 0, failed = 0 } = payrollAggregates || {};
    const { total_deductions = 0, total_amount = 0, total_workers = 0, total_day_shifts = 0, total_night_shifts = 0, total_earnings = 0 } = payrollDataHeader || {};

    return (
        <>
            {total_workers !== 0 && (<Stats
                isPayroll={true}
                title="TOTAL WORKERS"
                value={total_workers}
                loading={loading}
            />)}
            {total_day_shifts !== 0 && total_night_shifts !== 0 && (<Stats
                isPayroll={true}
                title="DAY SHIFTS / NIGHT SHIFTS"
                value={`${total_day_shifts} / ${total_night_shifts} `}
                loading={loading}
            />)}
            {total_deductions !== 0 && (
                <Stats
                    isPayroll={true}
                    title="DEDUCTIONS (RWF)"
                    info={true}
                    infoText={"Total deductions ( External and Internal Deductions)"}
                    value={`${toMoney(total_deductions)}`}
                    loading={loading}
                    onClick={() => setShowDeductionsModal(true)}
                />
            )}
            {paymentRun && (
                <>
                    {successful !== 0 && (
                        <Stats
                            isPayroll={true}
                            title="SUCCESSFUL"
                            info={false}
                            value={successful}
                            loading={loading}
                        />
                    )}
                    {failed !== 0 && (
                        <Stats
                            isPayroll={true}
                            title="FAILED"
                            info={false}
                            value={failed}
                            loading={loading}
                        />
                    )}
                    {(
                        <Stats
                            isPayroll={true}
                            title="GROSS AMOUNT (RWF)"
                            info={false}
                            value={`${toMoney(total_amount)}`}
                            loading={loading}
                        />
                    )}
                </>
            )}
            {total_earnings !== 0 && (<Stats
                isPayroll={true}
                info={true}
                infoText="Total net amount to be disbursed"
                title="NET AMOUNT TO BE DISBURSED (RWF)"
                value={`${toMoney(total_earnings)}`}
                loading={loading}
                onClick={() => setShowNetAmountModal(true)}
            />
            )}
        </>
    );
};

export default PayrollStats;
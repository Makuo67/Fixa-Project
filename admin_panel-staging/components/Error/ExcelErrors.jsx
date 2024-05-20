import { useState, useEffect } from 'react';
import Notification from './Notification';
import { getCutomTemporaryTable } from '../../helpers/excelRegister';
import ErrorWrapper from './ExcelErrors.styled';
import { payoutGetBulkTemp } from '@/helpers/payments/payout/payout';

const ExcelErrors = ({ tableActions, type, paymentId }) => {
    const [excelErrors, setExcelErrors] = useState({});
    const [loadingError, setLoadingError] = useState(true);

    let totalErrors = '---';
    const fetchErrors = () => {
        if (type === "payout_momo") {
            const payload = {
                start: 0,
                limit: -1,
                payment_id: paymentId
            }
            payoutGetBulkTemp(payload).then((res) => {
                if (res?.data?.data?.payees?.length > 0) {
                    setExcelErrors(res?.data?.data?.errors)
                    setLoadingError(false);
                }
            }).catch(() => {
                setLoadingError(true);
            })
        } else {
            getCutomTemporaryTable(0)
                .then((res) => {
                    setExcelErrors(res?.data?.errors);
                    setLoadingError(false);
                }).catch(() => {
                    setLoadingError(true);
                });
        }
    }

    useEffect(() => {
        setLoadingError(true);
        fetchErrors();
    }, []);

    /* FEtch after saving */
    if (tableActions) {
        fetchErrors();
    }

    const getTotalErrors = (errors) => {
        if (errors) {
            let total = 0;
            for (let index = 0; index < errors.length; index++) {
                if (errors[index].count) {
                    total = errors[index].count + total;
                }
            }
            return total;
        }
    }

    if (!loadingError) {
        totalErrors = getTotalErrors(excelErrors)
    }

    /* Skletton for Errors */
    if (loadingError) return <h2>Loading...</h2>
    return (
        <>
            {totalErrors > 0 && <ErrorWrapper>
                <div className='wrapper'>
                    <div className='errorNumber w-1/6'>
                        <h3 className='errorCount'>Total {totalErrors} errors found:</h3>
                    </div>

                    {loadingError ? (<h3>Loading...</h3>) : (
                        <div className='w-full flex gap-4'>
                            {excelErrors?.filter(error => error.count > 0).map((error, index) => (
                                <Notification key={index} message={`${error.count} ${error.message}`} type={error.status} />
                            ))}
                        </div>
                    )}
                </div>
            </ErrorWrapper>}
        </>
    )
}

export default ExcelErrors;
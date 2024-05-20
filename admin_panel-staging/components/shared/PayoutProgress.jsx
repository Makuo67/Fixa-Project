import { useEffect, useState } from 'react';
import { Progress, Skeleton } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import Pusher from "pusher-js";

import { PayoutPageStyles } from '../Payments/PayoutPage.styled';
// import { getAllPayoutList } from '../../helpers/payments/payout/payout';

const PayoutProgress = ({ payoutStatus, payment_id, payoutAggregates, loading }) => {
    const [payoutInfo, setPayoutInfo] = useState([]);
    // const [loading, setLoading] = useState(true);
    // console.log('payoutinfo:', payoutInfo);

    const router = useRouter();

    const handleProgresChanges = (id) => {
        getAllPayoutList(id)
            .then((res) => {
                setPayoutInfo({
                    ...payoutInfo,
                    payout: res?.data,
                    project: res.meta?.payment?.project_name,
                    payout_status: res?.meta?.payment?.status,
                    payout_name: `${res?.meta?.payment?.title} #${id}`,
                });
                setLoading(false);
            })
    };
    /* useEffect(() => {
        if (payment_id && router.isReady) {
            setLoading(true);
            handleProgresChanges(payment_id)
        }

        return () => {
            setLoading(false);
        }
    }, [router.isReady]);
 */
    /*  Use effect of listening pusher */

    /* useEffect(() => {
        if (payment_id || router.isReady) {
            const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
                cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
            });

            const channel = pusher.subscribe(`transaction-status-${payment_id}`);

            channel.bind(`transaction-status-${payment_id}-event`, function (data) {
                console.log(
                    ` data from event : transaction-status-${payment_id}-event ===>`,
                    data
                );
                //handleProgresChanges(payment_id);
            });

            return () => {
                pusher.unsubscribe(`transaction-status-${payment_id}`);
            };
        }
    }, [router.isReady]); */


    return (
        /*   */
        <PayoutPageStyles>
            {payoutStatus !== 'unpaid' && (
                <div className='progressSection'>
                    <div className='progressSectionInfo'>

                        {payoutStatus === 'processing' ? (
                            <h3>Paying {payoutAggregates?.total_transactions} Payees.</h3>

                        ) : (
                            <>
                                <div className='progressSectionMessage'>
                                    {loading ? (
                                        <Skeleton.Input active={true} size='small' style={{ bottom: 5, borderRadius: 5 }} />
                                    ) : (

                                        <p className='progressSuccess'
                                        >
                                            {payoutAggregates?.successful} Successful
                                        </p>
                                    )}

                                    {loading ? (
                                        <Skeleton.Input active={true} size='small' style={{ bottom: 5, borderRadius: 5 }} />
                                    ) : (

                                        <p className='progressFailed'
                                        >
                                            {payoutAggregates?.failed} Failed
                                        </p>
                                    )}
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifySelf: 'flex-end'
                                }}>
                                    {loading ? (
                                        <SyncOutlined spin />
                                    ) : (

                                        <h3>{isFinite((Number(payoutAggregates?.successful) / Number(payoutAggregates?.total_transactions))) ?
                                            (Number(payoutAggregates?.successful) / Number(payoutAggregates?.total_transactions)).toLocaleString(undefined, { style: 'percent' }) : 0
                                        }</h3>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <Progress
                        percent={(parseInt(payoutAggregates?.successful) / parseInt(payoutAggregates?.total_transactions)) * 100}
                        status={payoutStatus === 'open' ? 'success' : 'active'}
                        strokeColor={payoutStatus === 'success' ? '#389e0d' : '#389e0d'}
                        showInfo={false}
                    />
                </div>
            )
            }

        </PayoutPageStyles >
    )

}

export default PayoutProgress;

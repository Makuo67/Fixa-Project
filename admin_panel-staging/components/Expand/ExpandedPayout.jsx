import { Icon } from "@iconify/react";
import { Skeleton } from 'antd';
import moment from "moment";
import { StyledExpandedPayout } from "../Tables/PayrollTable.styled";
import { getTransactionDetails } from "../../helpers/payments/payout/payout";
import React, { useEffect, useState } from 'react';

const ExpandedPayout = ({ status, data }) => {
    const [expanded, setExpanded] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (data.id) {
            getTransactionDetails(data.id).then((res) => {
                setExpanded(res);
                setLoading(false);
            });
        }
    }, []);

    return (
        <StyledExpandedPayout>
            <div className="container">
                <div className="innerContainer">
                    <div className="reference">
                        <span className="title">Refereence No.</span>
                        {loading ? (
                            <Skeleton.Input active={true} size='small' style={{ borderRadius: 5, width: '250px' }} />
                        ) : (
                            <span className="referenceValue">{expanded?.reference_id}</span>
                        )}
                    </div>
                    <div className="reference">
                        <span className="title">Time</span>
                        {loading ? (
                            <Skeleton.Input active={true} size='small' style={{ borderRadius: 5, width: '250px' }} />
                        ) : (

                            <h1 className="timeValuepart">{moment(expanded?.payed_time).format("DD/MM/YYYY h:mm A")}</h1>
                        )}
                    </div>
                    <div className="message">
                        <span className="title">Message</span>
                        {loading ? (
                            <Skeleton.Input active={true} size='small' style={{ borderRadius: 5, width: '250px' }} />
                        ) : (

                            <span className="messageValue">
                                {expanded?.momo_msg}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </StyledExpandedPayout >
    );
}

export default ExpandedPayout;

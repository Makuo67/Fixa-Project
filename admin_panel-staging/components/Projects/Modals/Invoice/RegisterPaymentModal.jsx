import { useState, useContext } from "react";
import { Button, InputNumber, Modal, notification } from "antd";
import moment from 'moment';

import { Icon } from "@iconify/react";
import Content from "../../../Uploads/WorkerExcel.styled";
import { ModalTitle } from "../../../Modals/PaymentModals";
import { toMoney } from "../../../../helpers/excelRegister";
import { registerPayment } from "../../../../helpers/projects/invoices";
import { PusherContext } from "../../../../context/PusherContext";


const RegisterPaymentModal = ({ title, width, height, footer, modalVisible, setModalVisible, data }) => {
    const [paidAmount, setPaidAmount] = useState('');
    const [loadingBtn, setLoadingBtn] = useState(false);
    const { setEnvoiceLoading } = useContext(PusherContext);

    const onFinish = async () => {
        // validate paidAmount here
        if (paidAmount <= 0) {
            notification.warning({
                message: 'Warning',
                description: 'Please enter valid amount.'
            });
        }
        else if (paidAmount > data.outstanding_amount) {
            notification.error({
                message: 'Payment Registration Failed!',
                description: 'Please enter an amount equal or less than the outstanding invoice amount.'
            });
        }
        else {
            let payload = {
                invoice_id: data.id,
                amount: String(paidAmount),
            }
            setLoadingBtn(true);
            setEnvoiceLoading(true)
            const result = await registerPayment(payload);
            if (result?.data) {
                setLoadingBtn(false);
                setEnvoiceLoading(false)
            } else {
                setEnvoiceLoading(false)
                setLoadingBtn(false);
                setModalVisible(false);
            }
        }
    };

    // Handling input changes of payment
    const onChangePayment = (value) => {
        setPaidAmount(value);
    };

    return (
        <Modal
            title={<ModalTitle title={title} style={'registerTitle'} />}
            okText="Next"
            open={modalVisible}
            // onOk={handleDeletingPayee}
            // onCancel={handleCancelDelete}
            onCancel={() => setModalVisible(false)}
            width={width}
            bodyStyle={{
                height,
            }}
            footer={footer}
        >
            <Content>
                <div className="registerPayment">
                    <div className="registerPaymentDetails">
                        <div className="registerInputSection">
                            <h3>
                                Paid Amount
                            </h3>
                            <InputNumber
                                // defaultValue={0}
                                placeholder="Enter Paid amount"
                                style={{
                                    borderRadius: '10px',
                                    border: '1px solid #CCDBE1',
                                    height: '40px',
                                    width: '100%'
                                }}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                                onChange={onChangePayment}
                            />

                        </div>
                        <div className="registerInputSection">
                            <p className="invoiceInfoTitle">Invoice Info</p>
                            <div className="invoiceInfoSection">
                                {/* === Left side ==== */}
                                <div className="invoiceInfoItems">
                                    <div>
                                        <p>Outstanding Amount</p>
                                    </div>
                                    <div>
                                        <p>Expected Amount</p>
                                    </div>
                                    <div>
                                        <p>Invoice Month</p>
                                    </div>
                                </div>
                                {/* === Right side ==== */}
                                <div className="invoiceInfoItems numbers">
                                    <div>
                                        <p>{data?.outstanding_amount ? `${toMoney(data?.outstanding_amount)} RWF` : "-"}</p>
                                    </div>
                                    <div>
                                        <p>{data?.expected_amount ? `${toMoney(data?.expected_amount)} RWF` : "-"}  </p>
                                    </div>
                                    <div>
                                        <p>{moment(data?.date).format('MMMM YYYY')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>

                    {/* === action buttons === */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '24px',
                        gap: '48px',
                        marginTop: '40px'

                    }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            padding: '0px',
                            gap: '34px',
                            width: '284px',
                            height: '46px',
                        }}>
                            <Button
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    padding: '12px 16px',
                                    width: '140px',
                                    height: '46px',
                                    border: '1px solid var(--tertiary)',
                                    borderRadius: '5px',
                                    color: '#000',
                                    fontSize: '20px',
                                    fontStyle: 'normal',
                                    fontWeight: '500',
                                    lineHeight: '24px',
                                    fontFamily: 'Circular Std',
                                }}
                                onClick={() => setModalVisible(false)}
                            >
                                Cancel
                            </Button>

                            <Button
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    padding: '12px 16px',
                                    width: '140px',
                                    height: '46px',
                                    fontSize: '20px',
                                    fontStyle: 'normal',
                                    fontWeight: '500',
                                    border: '1px solid #00A1DE',
                                    borderRadius: '5px',
                                    background: '#00A1DE',
                                    color: '#FFFFFF',
                                }}
                                htmlType="submit"
                                onClick={onFinish}
                                loading={loadingBtn}
                            >
                                Save
                            </Button>

                        </div>
                    </div>
                </div>
            </Content>
        </Modal >
    );
}

export default RegisterPaymentModal;
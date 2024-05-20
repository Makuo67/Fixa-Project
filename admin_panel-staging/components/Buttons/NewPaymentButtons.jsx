import React, { useEffect, useState } from "react";
import { Button, Dropdown } from "antd";
import { DownOutlined, UserOutlined, PlusOutlined } from "@ant-design/icons";
import { Icon } from "@iconify/react";

import { StyledPaymentButton } from "./NewPaymentButton.styled";
import PaymentModals from "../Modals/PaymentModals";
import { getPaymentTypes } from "../../helpers/payments/payments_home";
import { capitalize } from "../../helpers/excelRegister";

const NewPaymentButtons = (props) => {
    const [modalType, setModalType] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [dropOpen, setDropOpen] = useState(false);
    const [paymentTypes, setPaymentTypes] = useState([]);
    const [modalTitle, setModalTitle] = useState("");

    useEffect(() => {
        getPaymentTypes().then((response) => {
            if (response) {
                let items = [];
                response.map((item) => {
                    let innerItem = {
                        label: item.type_name,
                        key: item.id,
                        icon:
                            item.type_name == "payroll" ? (
                                <Icon icon="fa6-solid:person-digging" />
                            ) : (
                                <Icon
                                    icon="material-symbols:receipt-outline"
                                    width={18}
                                    height={16}
                                />
                            ),
                    };
                    items.push(innerItem);
                });
                setPaymentTypes(items);
            }
        });
    }, [dropOpen]);


    const handleChange = (e) => {
        e.preventDefault();
        setShowModal(true);
        setDropOpen(false);
        setModalType(e.target.innerText);
        if (e.target.innerText === 'Payroll') {
            setModalTitle('New Payroll')
        } else {
            setModalTitle('New Payout')
        }
    };

    const handleCancel = () => {
        setShowModal(false);
    };

    // changing the open state of dropdown
    const handleDropdown = (open) => {
        setDropOpen(open);
    };

    return (
        <StyledPaymentButton>
            <Dropdown
                className="newPayment"
                trigger={"click"}
                open={dropOpen}
                onOpenChange={handleDropdown}
                dropdownRender={() => (
                    <ul className="flex flex-col items-end p-0 gap-2 h-fit w-44 rounded-md bg-primary text-white">
                        {paymentTypes.map((item) => (
                            <li className="flex flex-row items-start gap-2 px-3 py-2 rounded-md cursor-pointer w-full h-9 hover:opacity-50"
                                key={item.label}
                                onClick={(e) => handleChange(e)}
                            >
                                <span>{item.icon}</span>
                                {capitalize(item.label)}
                            </li>
                        ))}
                    </ul>
                )}
            >
                <Button className="primaryBtn" 
                icon={<PlusOutlined className="text-white" />}
                >
                    New Payment
                    <DownOutlined />
                </Button>
            </Dropdown>
            <PaymentModals
                show={showModal}
                type={modalType}
                handleCancel={handleCancel}
                paymentTypes={paymentTypes}
                title={modalTitle}
            />
        </StyledPaymentButton>
    );
};

export default NewPaymentButtons;

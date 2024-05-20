
import { Button, Empty, Modal } from "antd"
import _ from "underscore"
import { useRouter } from "next/router";
import { toMoney } from "../../../helpers/excelRegister";
import React from "react";
import { RenderSpinner } from "@/components/Loaders/renderSpinner";
import closeIcon from "../../../assets/svgs/times-circle.svg"
import Image from "next/image";

const DeductionsDetailsModal = ({ showSummaryModalloading, deductionsDetails, data, title, showModal, handleCancel, payrollType, payrollId }) => {
    const router = useRouter()
    const closeResetModal = () => {
        handleCancel()
    }

    return (
        <Modal
            title={title}
            open={showModal}
            onCancel={closeResetModal}
            // closable={false}
            width={600}
            centered={true}
            bodyStyle={{
                height: "fit-content",
            }}
            footer={null}
        >
            {/* <header className="flex justify-center sub-heading-1 my-2">
                Deductions details for {data?.payment_type_name ?? payrollType} #{data?.id ?? payrollId}
            </header> */}
            <>
                {showSummaryModalloading ? <RenderSpinner /> : (
                    <>
                        <div className="bg-secondary flex flex-col gap-4 p-4">
                            <header className="flex justify-between sub-heading-1 border-b">
                                <span>Internal Deductions</span>
                                <span>{toMoney(deductionsDetails?.total_internal_deduction ?? 0)} RWF</span>
                            </header>
                            {deductionsDetails?.internal_deductions?.length ? (
                                <div className="flex flex-col rounded-md bg-white">
                                    {deductionsDetails.internal_deductions.map(({ name, total_amount }, index) => (
                                        <div key={index} className="flex justify-between gap-4 p-4 ">
                                            <span>{name}</span>
                                            <span>{toMoney(total_amount??0)} RWF</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4">
                                    <Empty description="No Internal Deductions." />
                                </div>
                            )}

                        </div>
                        <div className="bg-secondary flex flex-col gap-4 p-4">
                            <header className="flex justify-between sub-heading-1 border-b"
                            >
                                <span>External Deductions</span>
                                <span>{toMoney(deductionsDetails?.total_external_deduction ?? 0)} RWF</span>
                            </header>
                            {deductionsDetails?.external_deductions?.length ? (
                                <div className="bg-white grid grid-cols-2 gap-4 rounded-md p-4">
                                    {deductionsDetails.external_deductions.map(({ link, name, status, total_amount }, index) => (
                                        <a key={index} href={link} target="_blank" rel="noreferrer" className="col-span-2">
                                            <div className="flex justify-between">
                                                <span>{name}</span>
                                                <div
                                                    className="flex w-1/2 justify-between"
                                                >
                                                    <Button style={{
                                                        display: "flex",
                                                        justifyContent: "start",
                                                        alignItems: "center",
                                                        width: "fit-content",
                                                        height: "20px",
                                                        borderRadius: "50px",
                                                        background: "#FFF1F0",
                                                        color: "var(--primary-6, #F5222D)",
                                                        gap: "5px",
                                                    }}
                                                        type="secondary"
                                                        onClick={closeResetModal}
                                                    >
                                                        <Image
                                                            src={closeIcon}
                                                            alt={"Close Icon"}
                                                            priority
                                                        />
                                                        <span>{status === "email_sent" ? "Not submitted" : status}</span>
                                                    </Button>
                                                    <span>{toMoney(total_amount)} RWF</span>
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex justify-center">
                                    <Empty description="External Deductions Links have not been sent yet." />
                                </div>
                            )}

                        </div>

                        <div className="bg-secondary flex justify-between p-4 rounded-md">
                            <span className="heading-1">Total:</span>
                            <span className="heading-1">{toMoney(parseInt(deductionsDetails?.total_external_deduction ?? 0) + parseInt(deductionsDetails?.total_internal_deduction ?? 0))} RWF</span>
                        </div>
                        <div className="flex justify-center">
                            <Button className="secondaryBtn mt-4" type="secondary"
                                onClick={closeResetModal}
                            >
                                Close
                            </Button>
                        </div>
                    </>
                )}
            </>
        </Modal >
    )
}

export default DeductionsDetailsModal
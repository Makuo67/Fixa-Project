
import { Button, Empty, Modal } from "antd"
import _ from "underscore"
import { useRouter } from "next/router";
import { toMoney } from "../../../helpers/excelRegister";
import { RenderSpinner } from "@/components/Loaders/renderSpinner";


const NetAmount = ({ showNetAmountModalloading, data, title, showModal, handleCancel, isPayout }) => {
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
            <>
                {showNetAmountModalloading ? <RenderSpinner /> : (
                    <>
                        <div
                            className="bg-secondary flex flex-col gap-4 p-4"
                        >
                            <section className="w-full space-y-2">
                                <header className="sub-heading-1 border-b flex justify-between">
                                    <span>Payees</span>
                                    <span>{data?.payees?.total ? toMoney(data?.payees?.total) : 0} RWF</span>
                                </header>
                                {data?.payees?.statuses?.length > 0
                                    ? data?.payees?.statuses?.map((item, index) =>
                                        <div
                                            key={index}
                                            className="bg-white w-full flex justify-between p-4 rounded-md">
                                            <span className="capitalize">{item?.status}</span>
                                            <span>{item?.count}</span>
                                            <span>{toMoney(item?.amount)} RWF</span>
                                        </div>) :
                                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
                                        <Empty description="No Disbursment Amount Available." />
                                    </div>
                                }
                            </section>
                            {!isPayout && <section className="w-full space-y-2">
                                <header className="sub-heading-1 border-b flex justify-between">
                                    <span>Suppliers</span>
                                    <span>{data?.suppliers?.total ? toMoney(data?.suppliers?.total) : 0} RWF</span>
                                </header>
                                {data?.suppliers?.statuses?.length > 0
                                    ? data?.suppliers?.statuses?.map((item, index) =>
                                        <div
                                            key={index}
                                            className="bg-white w-full flex justify-between p-4 rounded-md">
                                            <span className="capitalize">{item?.status}</span>
                                            {/* <span>{item?.count}</span> */}
                                            <span>{toMoney(item?.amount)} RWF</span>
                                        </div>) :
                                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
                                        <Empty description="No Disbursment Amount Available." />
                                    </div>
                                }
                            </section>}
                        </div>

                        <div
                            className="bg-secondary flex justify-between p-4 rounded-md"
                        >
                            <span className="heading-1">Total:</span>
                            <span className="heading-1">{data.total ? toMoney(parseInt(data.total)) : 0} RWF</span>
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

export default NetAmount
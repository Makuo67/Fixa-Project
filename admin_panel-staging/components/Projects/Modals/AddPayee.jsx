import { Form, Input, Modal, Select, Button, notification, Switch } from "antd";
import StyledEditor from "../../Settings/Modals/StyleEditor";
import { Icon } from "@iconify/react";
import { PlusOutlined } from "@ant-design/icons";
import { StyledProjectSupervisors } from "../ProjectSupervisors/StyledProjectSupervisors.styled";
import { useState } from "react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { activateDeactivateSupplier, addPayees, getAllProjectDeductions, getSuppliersNotOnProject } from "../../../helpers/projects/supervisors";
import { capitalizeAll } from "../../../helpers/capitalize";
import { useContext } from "react";
import { PusherContext } from "../../../context/PusherContext";
import OnboardSteps from "@/components/Onboarding/OnboardSteps";
import { getPaymentMethods } from "@/helpers/workforce/workforce";
import { extractDefaultWorkerPaymentValues, transformPaymentsInfoObject } from "@/utils/transformObject";
import { itemStyles } from "@/components/Forms/WorkerRegistrationForm";
import { PaymentMethods } from "@/components/shared/PaymentMethods";
import _ from "underscore";

const { Option } = Select;

// supplier details form
const SupplierDetailsForm = ({ setLoading, handleNextStep, supplierPayload, setSupplierPayload }) => {
    const [form] = Form.useForm();
    const { setLoadPayee } = useContext(PusherContext);
    const router = useRouter();
    const { id } = router.query;
    const [allDeductions, setAllDeductions] = useState([]);

    useEffect(() => {
        // if (id) {
        getAllProjectDeductions(id).then((res) => {
            setAllDeductions(res);
            setLoadPayee(false);
        });

        // }
    }, [id]);

    const handleAddPayee = (values) => {
        handleNextStep()
    };

    return (
        <Form
            layout="vertical"
            form={form}
            onFinish={handleAddPayee}
            onFinishFailed={() => {
                console.log("failed");
            }}
            requiredMark={false}
        // initialValues={[]}
        >
            <Form.Item
                label={<h3>Supplier Names</h3>}
                name="names"
                rules={[
                    {
                        required: true,
                        message: 'Please input the payee names!',
                    },
                ]}
                initialValue={supplierPayload.names}
            >

                <Input className="formInput"
                    maxLength={32}
                    placeholder='Supplier Name'
                    value={supplierPayload.names}
                    onChange={(e) => setSupplierPayload({ ...supplierPayload, names: e.target.value })}
                />
            </Form.Item>
            <Form.Item
                label={<h3>Email</h3>}
                name="email"
                rules={[
                    {
                        required: true,
                        message: 'Please input the email!',
                    },
                    {
                        pattern: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                        message: 'Please input a valid email.'
                    }
                ]}
                initialValue={supplierPayload.email}
            >

                <Input className="formInput"
                    placeholder='johndoe@example.com'
                    value={supplierPayload.email}
                    onChange={(e) => setSupplierPayload({ ...supplierPayload, email: e.target.value })}
                />
            </Form.Item>

            <Form.Item
                label={<h3>Phone Number</h3>}
                name="phone"
                rules={[
                    {
                        required: true,
                        message: 'Please input the phone number!',
                    },
                    {
                        pattern: /^07\d{8}$/,
                        message: 'Please input a valid 10-digit phone number.',
                    },
                ]}
                initialValue={supplierPayload.phone}
            >

                <Input
                    className="formInput"
                    maxLength={10}
                    placeholder='07XX XXX XXX'
                    value={supplierPayload.phone}
                    onChange={(e) => setSupplierPayload({ ...supplierPayload, phone: e.target.value })}
                />
            </Form.Item>

            <Form.Item
                label={<h3>Deduction Types</h3>}
                name="deduction_type"
                rules={[
                    {
                        required: true,
                        message: 'Please select a Supplier.',
                    },
                ]}
                initialValue={_.map(supplierPayload.deduction_type, "id")}
            >
                <Select className="formInput"
                    mode="multiple"
                    size="large"
                    defaultValue={_.map(supplierPayload.deduction_type, "id")}
                    placeholder='Enter deductions'
                    onChange={(e) => setSupplierPayload({ ...supplierPayload, deduction_type: e })}
                >
                    {allDeductions?.map((item) => {
                        return (
                            <Option
                                value={item?.id}
                                key={item.id}
                                title={item.title}
                                label={item.title}
                            >
                                {capitalizeAll(item.title)}
                            </Option>
                        );
                    })}
                </Select>
            </Form.Item>
            <div className="submit-buttons-container flex justify-center items-center gap-5 mt-5 pt-5">
                <Button
                    type="primary"
                    className="primaryBtnCustom w-40"
                    htmlType="submit"
                >
                    Next
                </Button>
            </div>
        </Form>
    )
}

const supplierSteps = [
    {
        title: <span className='stepTitle text-primary'>Supplier Details</span>,
    },
    {
        title: <span className='stepTitle text-primary'>Payment Methods</span>,
    },
];

export default function AddPayee({ addPayee, closePayeeModal, setLoading, isEditing, data }) {
    const router = useRouter();
    // const { id } = router.query; // Project id not available on settings
    const [currentStep, setCurrentStep] = useState(0);
    const [btnLoading, setBtnLoading] = useState(false);
    const [supplierPayload, setSupplierPayload] = useState({
        // "project_id": id ,
        "names": data?.names || "",
        "phone": data?.phone_number || "",
        "email": data?.email || "",
        "deduction_type": data?.deduction_types || [],
        "payment_methods": data?.payment_methods || []
    });

    const close = () => {
        closePayeeModal();
    };

    const handleNextStep = () => {
        setCurrentStep(currentStep + 1)
    }

    const handleBackStep = () => {
        setCurrentStep(currentStep - 1)
    }

    const handleSave = (payment_methods) => {
        setBtnLoading(true);
        let payload = supplierPayload;
        payload.payment_methods = payment_methods
        // setLoading(true)
        if (isEditing) {
            activateDeactivateSupplier(data?.id, payload).then(() => {
                setCurrentStep(0)
                setBtnLoading(false)
                closePayeeModal()
                setLoading(true)
            })
        } else {
            addPayees(payload).finally(() => {
                setCurrentStep(0)
                setBtnLoading(false)
                closePayeeModal()
                setLoading(true)
            })
        }
    }


    const ModalTitle = () => (
        <StyledEditor>
            <h1 className="import modalTitle supervisor">Add Supplier</h1>
        </StyledEditor>
    );

    return (
        <Modal
            centered
            title={<ModalTitle />}
            okText="Yes"
            cancelText="No"
            open={addPayee}
            onOk={close}
            onCancel={closePayeeModal}
            styles={{
                body: {
                    height: currentStep === 0 ? '100%' : '100%'
                }
            }}
            footer={null}
        >
            <OnboardSteps steps={supplierSteps} currentStep={currentStep} />
            {currentStep === 0 && (
                <SupplierDetailsForm
                    setLoading={setLoading}
                    handleNextStep={handleNextStep}
                    supplierPayload={supplierPayload}
                    setSupplierPayload={setSupplierPayload}
                />

            )}
            {/* Payment form  */}
            {currentStep === 1 && (
                <div>
                    <PaymentMethods handleCancel={handleBackStep} handleSave={handleSave} cancelText={'Back'} saveLoading={btnLoading} paymentMethods={extractDefaultWorkerPaymentValues(supplierPayload.payment_methods)} />
                </div>

            )}

        </Modal>
    )
}
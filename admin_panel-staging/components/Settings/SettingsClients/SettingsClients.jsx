import { Icon } from "@iconify/react";
import { Button, Form, Input, Select } from "antd";
import DynamicTable from "../../Tables/DynamicTable";
import { useState, useEffect, useContext, useCallback } from "react";
import { useRouter } from "next/router";

import { SettingsClientsColumns, SettingsSupervisorsColumns } from "../../Columns/SettingsSupervisorsColumns";
import { PusherContext } from "../../../context/PusherContext";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import { SettingsCustomModal } from "../Modals/SettingsCustomModal";
import { createClient, editClient, getClients, getCountries, getProvinces } from "@/helpers/projects/projects";
// import { validateEmail, validatePhoneInput, validateTinInput } from "@/utils/regexes";
import UploadImage from "@/components/shared/UploadImage";
import { accessSubEntityRetrieval } from "@/utils/accessLevels";

export const ClientsForm = ({ onCancel, setLoadingClients, record, isEditing }) => {
    const [btnLoading, setBtnLoading] = useState(false);
    const [provinces, setProvinces] = useState([]);

    // console.log("RECORD ====>", record)

    const [form] = Form.useForm()
    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());


    useEffect(() => {
        getCountries().then((res) => {
            let defaultCountry = res.find((country) => country.alpha_2_code === 'RW')?.id
            if (defaultCountry) {
                getProvinces(defaultCountry).then((res) => {
                    setProvinces(res)
                })
            }
        })
        // if editing let's populate the form data
        if (isEditing && record) {
            form.setFieldsValue({
                ...record,
                province: record.province?.id,
            })
        }
    }, [])


    const submitClient = async (data) => {
        setBtnLoading(true)
        
        if (isEditing) {
            // console.log("Form Data  ====", data)
            editClient(record.id, data).then(() => {
                form.resetFields();
                onCancel();
                if (setLoadingClients) {
                    setLoadingClients(true)
                }

            }).finally(() => {
                setBtnLoading(false)
            })
        } else {
            createClient(data).then(() => {
                form.resetFields();
                onCancel();
                if (setLoadingClients) {

                    setLoadingClients(true)
                }

            }).finally(() => {
                setBtnLoading(false)
            })
        }


    }

    const updateImageFormInputValue = (imgLink) => {
        form.setFieldValue('logo_url', imgLink);
    }

    return (
        <Form
            name="clients_form"
            layout="vertical"
            onFinish={submitClient}
            requiredMark={false}
            form={form}
        >
            <div className="flex flex-col gap-2">
                <Form.Item
                    label={<span> Client Logo </span>}
                    name="logo_url"
                >
                    <UploadImage picture={true} setImageUrl={updateImageFormInputValue} existingImage={record?.logo_url} />
                </Form.Item>
            </div>
            <div className="flex gap-2">

                <div className="flex flex-col gap-2 flex-1">
                    <Form.Item
                        label={
                            <span>
                                Name <span className="text-bder-red">*</span>
                            </span>
                        }
                        name="name"
                        rules={[
                            { required: true, message: 'Name is required' },
                            { min: 2, message: 'Name must be at least 2 characters' },
                            { max: 50, message: 'Name must not exceed 50 characters' },
                            { pattern: /^[a-zA-Z\s]*$/, message: 'Name can only contain letters and spaces' },
                        ]}
                    >
                        <Input
                            className="formInput capitalize"
                            type="text"
                            autoComplete="off"
                        />
                    </Form.Item>

                    <Form.Item
                        label={
                            <span>
                                Company Email
                                {/* <span className="text-bder-red">*</span> */}
                            </span>
                        }
                        name="email"
                    // initialValue={props.companyInfo?.email}
                    // rules={[
                    //     { validator: validateEmail },
                    // ]}
                    >
                        <Input
                            className="formInput"
                            placeholder="example@domain.com"
                            type="text"
                            autoComplete="off"
                        />
                    </Form.Item>

                    <Form.Item
                        label={
                            <span>
                                TIN Number
                                {/* <span className="text-bder-red">*</span> */}
                            </span>
                        }
                        name="tin_number"
                        // initialValue={props.companyInfo?.tin_number}
                        rules={[
                            { pattern: /^\d{9}$/, message: 'TIN Number must be 9 numbers' },
                        ]}
                    >
                        <Input
                            className="formInput"
                            type="text"
                            autoComplete="off"
                            maxLength={9}
                        />
                    </Form.Item>
                </div>

                {/* LEFT side */}
                <div className="flex flex-col gap-2 flex-1">
                    <Form.Item
                        label={
                            <span>
                                Company Phone Number{" "}
                                {/* <span className="text-bder-red">*</span> */}
                            </span>
                        }
                        name="phone_number"
                    // initialValue={props.companyInfo?.phone}
                    >
                        <Input
                            // defaultValue={props.companyInfo?.phone}
                            className="formInput"
                            placeholder="07XXXXXXXX"
                            type="text"
                            autoComplete="off"
                            maxLength={10}
                        />
                    </Form.Item>

                    <Form.Item
                        label={
                            <span>
                                Address
                            </span>
                        }
                        name="address"
                    >
                        <Input
                            className="formInput capitalize"
                            type="text"
                            autoComplete="off"
                        />
                    </Form.Item>

                    <Form.Item
                        label={
                            <span>
                                Province
                            </span>
                        }
                        name="province"
                    >
                        <Select
                            className='formInput'
                            // style={{ border: '1px solid #8692A6', borderRadius: '6px', }}
                            showSearch
                            placeholder="Select a province"
                            optionFilterProp="children"
                            filterOption={filterOption}
                            options={provinces?.map((item) => ({
                                value: item.id,
                                label: item.name,
                            }))}
                        />
                    </Form.Item>
                </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                    type="primary"
                    className="secondaryCustomBtn w-28"
                    onClick={onCancel}
                >
                    Cancel
                </Button>
                <Button
                    type="primary"
                    className="primaryBtnCustom w-28"
                    htmlType="submit"
                    loading={btnLoading}
                >
                    Save
                </Button>
            </div>
        </Form >

    );
}

export const SettingsClients = () => {
    const [allClients, setAllClients] = useState([]);
    const [loadingClients, setLoadingClients] = useState(true);
    const [addClient, setAddClient] = useState(false);
    const [tableClients, setTableClients] = useState([]);

    // const { loadSupervisor, setLoadSupervisor } = useContext(PusherContext);

    const router = useRouter();
    const { userAccess, userProfile } = useUserAccess();

    const fetchClients = useCallback(() => {
        if (loadingClients === true) {
            setLoadingClients(true)
            getClients().then((res) => {
                setAllClients(res);
                setTableClients(res)
                setLoadingClients(false);
            });
        }
    }, [loadingClients]);

    useEffect(() => {
        if (router.isReady) {
            fetchClients();
        }
    }, [router.isReady, loadingClients]);

    const openClientModal = () => {
        setAddClient(true);
    };
    const closeClientModal = () => {
        setAddClient(false);
    };

    const handleTableChange = (pagination) => {
        // console.log("pagination", pagination);
    };

    // search 
    const onSearch = (input) => {
        if (String(input).length > 0) {
            const filteredData = allClients.filter((item) => {
                return item.name?.toLowerCase().includes(input.toLowerCase()) || item.phone_number?.includes(input) || item.email?.includes(input)
            })
            setTableClients(filteredData)
        } else {
            setTableClients(allClients)
        }
    }

    return (
        <div>
            <SettingsCustomModal
                width={700}
                open={addClient}
                title={"Add a client"}
                onCancel={closeClientModal}
                content={<ClientsForm onCancel={closeClientModal} setLoadingClients={setLoadingClients} />}
            />
            <DynamicTable
                rowKey={`id`}
                columns={SettingsClientsColumns(setLoadingClients, userProfile)}
                data={tableClients}
                extra_left={[
                    <div className="users" key={0}>
                        <span>{tableClients?.length}</span>
                        <span>Clients</span>
                    </div>,
                ]}
                extra_middle={[
                    <Input
                        key={0}
                        size="large"
                        placeholder="Search by Name, Phone, or Email"
                        className="search"
                        // defaultValue={router.query?.search}
                        onChange={(e) => onSearch(e.target.value)}
                        prefix={
                            <Icon
                                icon="material-symbols:search"
                                color="#A8BEC5"
                                height="20px"
                            />
                        }
                        allowClear
                    />,
                ]}
                extra_right={userProfile && accessSubEntityRetrieval(userProfile?.user_access, 'settings', 'clients', 'add client') && [
                    <Button key={0} className="primaryBtn" onClick={openClientModal}>
                        <Icon icon="material-symbols:add" color="" width="20px" />
                        <span>Add Client</span>
                    </Button>,
                ]}
                isSettings={true}
                loading={loadingClients}
                pagination={{
                    total: allClients.length
                }}
                onChange={(value) => handleTableChange(value)}
            />
        </div>
    );
};

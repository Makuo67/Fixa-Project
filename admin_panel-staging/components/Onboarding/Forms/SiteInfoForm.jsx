import { DatePicker, Button, Form, Input, Select, notification, message } from 'antd';
import ContinueSkipBtn from '@/components/Buttons/ContinueSkipBtn';
import { useEffect, useState } from 'react';
import { getCurrentToken } from '@/helpers/getCurrentToken';
import { useRouter } from 'next/router';
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import { getActiveClients } from '@/helpers/projects/projects';

const dateFormatList = ['DD/MM/YYYY', 'DD/MM/YY', 'DD-MM-YYYY', 'DD-MM-YY'];

const SiteInfoForm = ({ handleNextStep, handleSkipAll }) => {
    const [form] = Form.useForm();
    const [clients, setClients] = useState([])
    const [countries, setCountries] = useState([])
    const [provinces, setProvinces] = useState([])
    const [site, setSite] = useState({
        client_id: "",
        name: "",
        country: "",
        province: "",
        start_date: "",
        end_date: "",
        jwtToken: "",
    })
    const [btnLoading, setBtnLoading] = useState(false)
    const router = useRouter()
    const { pathname } = router

    const { setCompanyStatusLoading, userProfile, companyStatus } = useUserAccess();
    const { is_staffing } = companyStatus

    useEffect(() => {
        if (router.pathname.split("/")[1] !== "onboarding") {
            getCurrentToken().then(data => {
                setSite({
                    ...site,
                    jwtToken: data
                })
            })
        }
        // else {
        //     message.error("You are not allowed to access this page")
        // }
        async function getCountries() {
            const res = await fetch('/api/global/countries', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            if (!res.ok) {
                // throw new Error('Failed to fetch data')
                notification.error({
                    message: "Failed",
                    description: data.message ?? "Failed to create site",
                    placement: "bottomRight",
                })
            }
            const data = await res.json()
            setCountries(data?.data)
        }
        getCountries();
        getActiveClients().then(response => {
            setClients(response)
        })
    }, [])

    useEffect(() => {
        if (site.country) {
            async function getProvinces() {
                const res = await fetch(`/api/global/provinces?country=${site.country}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                })
                if (!res.ok) {
                    // throw new Error('Failed to fetch data')
                    notification.error({
                        message: "Failed",
                        description: data.message,
                        placement: "bottomRight",
                    })
                }
                const data = await res.json();
                setProvinces(data?.data)
            }
            getProvinces();
        }
    }, [site.country])

    const handleCreatesite = async () => {
        try {
            const values = await form.validateFields();
            // console.log('Values ',values);
            setBtnLoading(true)
            const response = await fetch('/api/createSite', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${site?.jwtToken}`
                },
                body: JSON.stringify(site),
            })

            const data = await response.json()
            if (data?.status === "success") {
                setBtnLoading(false)
                // setCompanyStatusLoading(true);
                handleNextStep()
                notification.success({
                    message: "Success",
                    description: "Site created successfully",
                    placement: "bottomRight",
                })
            } else {
                setBtnLoading(false)
                notification.error({
                    message: "Failed",
                    description: data.data.message,
                    placement: "bottomRight",
                })
            }
        } catch (errorInfo) {
            console.error('Form validation failed:', errorInfo);
            message.error('Please fill in all required fields.');
        }
    };
    const onSearch = (value) => {
        // console.log('search:', value);
    };

    // Filter `option.label` match the user type `input`
    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

    return (
        <Form
            layout='vertical'
            form={form}
            requiredMark={false}
            className='flex flex-col gap-10 h-screen'>
            {is_staffing === true &&
                router.pathname.split("/")[1] !== "onboarding" && <Form.Item
                    label={
                        <span className="text-sub-title cursor-pointer">
                            Client <span className="text-bder-red">*</span>
                        </span>}
                    name="client_id" className='formItem' style={{
                        display: "inline-block",
                        // width: "calc(50% - 8px)",
                    }}
                >
                    <Select
                        showSearch
                        placeholder="Select a client"
                        optionFilterProp="children"
                        onChange={(e) => setSite({ ...site, client_id: e?.toString() })}
                        onSearch={onSearch}
                        filterOption={filterOption}
                        className='formInput !h-[40px]'
                        // Change accordin to the API
                        options={clients.map((item) => ({
                            value: item.id,
                            label: item.name,
                        }))}
                    />
                </Form.Item>}
            <Form.Item
                label={
                    <span className="text-sub-title cursor-pointer">
                        Project name <span className="text-bder-red">*</span>
                    </span>}
                name="name" className='formItem' rules={[
                    { required: true, message: "Missing Project name" },
                ]}>
                <Input placeholder="Enter project name" className='formInput' onChange={(e) => setSite({ ...site, name: e.target.value })} />
            </Form.Item>

            <div className='flex w-full justify-between'>
                {/* ===== country and start date ===== */}
                <Form.Item
                    label={
                        <span className="text-sub-title cursor-pointer">
                            Country <span className="text-bder-red">*</span>
                        </span>}
                    className='formItem' style={{
                        display: "inline-block",
                        width: "calc(50% - 8px)",
                    }}
                    name="country"
                    rules={[
                        { required: true, message: "Missing Country" },
                    ]}
                >
                    <Select
                        showSearch
                        placeholder="Select a country"
                        optionFilterProp="children"
                        onChange={(e) => setSite({ ...site, country: e?.toString() })}
                        onSearch={onSearch}
                        filterOption={filterOption}
                        className='formInput'
                        options={countries.map((item) => ({
                            value: item.id,
                            label: item.country_name,
                        }))}
                    />
                </Form.Item>
                <Form.Item
                    label={
                        <span className="text-sub-title cursor-pointer">
                            City <span className="text-bder-red">*</span>
                        </span>}
                    className='formItem' style={{
                        display: "inline-block",
                        width: "calc(50% - 8px)",
                    }}
                    name="province"
                    rules={[
                        { required: true, message: "Missing Province" },
                    ]}
                >
                    <Select
                        showSearch
                        placeholder="Select a city"
                        optionFilterProp="children"
                        onChange={(e) => setSite({ ...site, province: e?.toString() })}
                        onSearch={onSearch}
                        filterOption={filterOption}
                        className='formInput'
                        options={provinces?.map((item) => ({
                            value: item.id,
                            label: item.name,
                        }))}
                    />
                </Form.Item>
            </div>

            {/*===== city and end date ===== */}
            <div className='w-full flex justify-between'>
                <Form.Item
                    label={
                        <span className="text-sub-title cursor-pointer">
                            Estimated start date <span className="text-bder-red">*</span>
                        </span>}
                    className='formItem' style={{
                        display: "inline-block",
                        width: "calc(50% - 8px)",
                    }}
                    name="start_date"
                    rules={[
                        { required: true, message: "Missing Starting Date" },
                    ]}>
                    <DatePicker format={dateFormatList} className='formInput' onChange={(e) => setSite({ ...site, start_date: e.format("YYYY-MM-DD") })} />
                </Form.Item>
                <Form.Item
                    label={
                        <span className="text-sub-title cursor-pointer">
                            Estimated end date <span className="text-bder-red">*</span>
                        </span>}
                    className='formItem' style={{
                        display: "inline-block",
                        width: "calc(50% - 8px)",
                    }}
                    name="end_date"
                    rules={[
                        { required: true, message: "Missing Ending Date" },
                    ]}
                >
                    <DatePicker format={dateFormatList} className='formInput' onChange={(e) => setSite({ ...site, end_date: e.format("YYYY-MM-DD") })} />
                </Form.Item>
            </div>
            <Form.Item className='formItem py-8'>
                <ContinueSkipBtn
                    loading={btnLoading}
                    skip={pathname === "/onboarding" ? true : false}
                    onClick={handleCreatesite}
                    btnText={"Continue"}
                    onSkip={handleSkipAll}
                />
            </Form.Item>

        </Form>
    );
};

export default SiteInfoForm;
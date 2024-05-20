import { useEffect, useRef, useState } from "react";
import { Button, Form, Input, Select, notification } from "antd"
import { useRouter } from "next/router";
import { Icon } from "@iconify/react";
import UploadImage from "../shared/UploadImage";

export const CompanyProfileContent = ({ handleNextStep }) => {
    const [form] = Form.useForm();
    const [countries, setCountries] = useState([])
    const [provinces, setProvinces] = useState([])
    const [company, setCompany] = useState({
        img_url: "",
        company_name: "",
        tin_number: "",
        country: "",
        province: "",
    })
    const [defaultCountry, setDefaultCountry] = useState('')

    const router = useRouter();

    useEffect(() => {
        async function getCountries() {
            const res = await fetch('/api/global/countries', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            if (!res.ok) {
                // throw new Error('Failed to fetch data')
                notification.info({
                    message: 'Failed to fetch countries data.'
                })
            }
            // console.log("get getCountries === ", res)
            const data = await res?.json()
            setCountries(data?.data)
            setDefaultCountry(data?.data?.find((country) => country.alpha_2_code === 'RW'))
        }

        if (router.isReady) {
            getCountries();
        }
    }, [router.isReady])

    useEffect(() => {
        if (company.country) {
            async function getProvinces() {
                const res = await fetch(`/api/global/provinces?country=${company.country || defaultCountry?.id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                })
                if (!res.ok) {
                    // throw new Error('Failed to fetch data')
                    notification.info({
                        message: 'Failed to fetchgetCountries provinces data.'
                    })
                }
                // console.log("get provinces === ", res)
                const data = await res?.json()
                setProvinces(data?.data);
            }
            getProvinces()
        }
    }, [company.country])

    const handleUploadImage = (imageUrl) => {
        setCompany({ ...company, img_url: imageUrl })
    }

    const onFinish = async () => {
        const response = await fetch('/api/companyProfile', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(company),
        })
        const data = await response.json()
        if (data.status === "success") {
            handleNextStep()
            notification.success({
                message: "Success",
                description: "Company created successfully",
                placement: "bottomRight",
            })
        } else {
            notification.error({
                message: "Failed",
                description: data.message,
                placement: "bottomRight",
            })
        }
    };

    const onSearch = (value) => {
        console.log('search:', value);
    };

    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

    return (
        <>
            <div className="flex flex-col gap-1">
                <div className="header">
                    <h1 className="heading-1">Company profile</h1>
                    <h1 className="sub-heading-1">
                        Complete the details below to create your company profile
                    </h1>
                </div>
                <Form
                    // onFinish={onFinish}
                    // onFinishFailed={onFinishFailed}
                    autoComplete="off"
                    layout="vertical"
                    className="w-[500px]"
                    requiredMark={false}
                >
                    <div className="w-full flex flex-col gap-8">
                        <div className="h-40">
                            <UploadImage setImageUrl={handleUploadImage} />
                        </div>
                        <Form.Item
                            name="companyName"
                            label={<h1 className="text-sub-title">Company Name <span className="text-bder-red">*</span></h1>}
                            rules={[
                                {
                                    required: true,
                                    message: 'Please input your company name!',
                                },
                            ]}
                            className="formItem"
                        >
                            <Input placeholder="Company name" size="large" className="formInput text-base" onChange={(e) => setCompany({ ...company, company_name: e.target.value })} />
                        </Form.Item>
                        <Form.Item
                            name="companyTin"
                            label={<h1 className="text-sub-title">Company Tin <span className="text-bder-red">*</span></h1>}
                            rules={[
                                {
                                    required: true,
                                    message: 'Please input your TIN number!',
                                },
                                {
                                    pattern: /^\d{9}$/,
                                    message: 'The TIN number must be exactly 9 digits.',
                                },
                            ]}
                            
                            className="formItem"
                        >
                            <Input placeholder="TIN" size="large" className="formInput text-base" onChange={(e) => setCompany({ ...company, tin_number: e.target.value })} maxLength={9} />
                        </Form.Item>
                        <div className="w-full flex justify-between">
                            <Form.Item
                                label={<h1 className="text-sub-title">Country <span className="text-bder-red">*</span></h1>}
                                name="country"
                                style={{
                                    display: 'inline-block',
                                    width: 'calc(50% - 8px)',
                                }}
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please select your country!',
                                    },
                                ]}
                                className="formItem"
                            >
                                <Select
                                    showSearch
                                    placeholder="Select Country "
                                    size="large"
                                    className="formInput text-base"
                                    onSearch={onSearch}
                                    value={defaultCountry.id}
                                    defaultValue={defaultCountry.id}
                                    onChange={(e) => setCompany({ ...company, country: e?.toString() })}
                                    filterOption={filterOption}
                                    options={countries.map((item) => ({
                                        value: item.id,
                                        label: item.country_name,
                                    }))}
                                />
                            </Form.Item>
                            <Form.Item
                                label={<h1 className="text-sub-title">City <span className="text-bder-red">*</span></h1>}
                                name="city"
                                style={{
                                    display: 'inline-block',
                                    width: 'calc(50% - 8px)',
                                }}
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please select your city!',
                                    },
                                ]}
                                className="formItem"
                            >
                                <Select
                                    showSearch
                                    placeholder="Select City"
                                    size="large"
                                    className="formInput text-base"
                                    onChange={(e) => setCompany({ ...company, province: e?.toString() })}
                                    onSearch={onSearch}
                                    filterOption={filterOption}
                                    options={provinces?.map((item) => ({
                                        value: item.id,
                                        label: item.name,
                                    }))}
                                />
                            </Form.Item>
                        </div>
                        <Form.Item
                            className="formItem">
                            <Button
                                onClick={onFinish}
                                className="primaryBtnBlock" 
                                // type="primary"
                                htmlType="submit"
                                block >
                                <span className="">Continue</span>
                                <Icon icon="iconamoon:arrow-right-2-light" width="25" height="25" className='text-secondary justify-self-end' />
                            </Button>
                        </Form.Item>
                    </div>
                </Form>
            </div>
        </>
    )
}
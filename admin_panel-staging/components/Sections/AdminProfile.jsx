import { useEffect, useState } from "react";
import { Button, Col, Form, Input, notification } from "antd"
import { useRouter } from "next/router";
import { Icon } from "@iconify/react";

import { TermsConditionsModal } from "../Modals/TermsConditions";
import UploadImage from "../shared/UploadImage";
import { storeAuthTokenInLocalStorage } from "@/helpers/auth";
import OnboardingSkeleton from "../Skeletons/OnboardingSkeleton";
import useSession from '@/utils/sessionLib';

export const AdminProfile = ({ invitationData, loading }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loadingBtn, setLoadingbtn] = useState(false);
    const [userPayload, setUserPayload] = useState({
        firstname: "",
        lastname: "",
        email: '',
        password: "",
        user_profile_image: ""
    });
    const [isAdmin, setIsAdmin] = useState(false);

    const [form] = Form.useForm();
    const router = useRouter();
    const { userLogin } = useSession();

    useEffect(() => {
        if (router.isReady && invitationData && invitationData.length > 0) {
            form.setFieldsValue({
                email: JSON.parse(invitationData)?.email
            })
            setUserPayload({ ...userPayload, email: JSON.parse(invitationData)?.email })

            if (invitationData && JSON.parse(invitationData)?.is_admin) {
                setIsAdmin(JSON.parse(invitationData)?.is_admin);
            }
        }

    }, [router.isReady, invitationData])



    const showModal = () => {
        setIsModalOpen(true);
    };

    const clearCookiesRequest = () => {
        fetch('/api/adminProfile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    const handleOk = () => {
        // store token and access levels
        if (JSON.parse(invitationData)?.is_admin === true) {
            router.push('/onboarding');
        } else {
            // clear cookies as well
            clearCookiesRequest();
            router.replace("/");
        }
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const onFinishFailed = (errorInfo) => {
        // console.log("Failed");
    }

    const onFinish = (values) => {
        // console.log("Validation Success");
        // showModal();
        handleSubmitUser()
    };

    const handleUploadImage = (imageUrl) => {
        // console.log("Image url === ", imageUrl);
        setUserPayload({ ...userPayload, user_profile_image: imageUrl })
    }

    // Submitting after accepting terms and conditions
    const handleSubmitUser = async () => {
        setLoadingbtn(true);
        try {
            const response = await fetch('/api/adminProfile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    baseUrl: JSON.parse(invitationData)?.link_api,
                    user: userPayload,
                    is_admin: isAdmin
                })
            });

            const results = await response.json();

            if (response.ok) {
                if (results.data.status === 'success') {
                    notification.success({ message: 'Success', description: 'Profile created successfully' });
                    // store session
                    userLogin(results?.data?.data)
                    storeAuthTokenInLocalStorage(`Bearer ${results?.data?.data?.jwt}`);
                    handleOk();
                } else if (results.data.status === 'failed') {
                    notification.error({ message: 'Bad Request', description: results.data?.error });
                    handleCancel();
                } else {
                    notification.error({ message: 'Error', description: 'Error happened, Try again.' });
                    handleCancel();
                }
            } else {
                // console.log("results === ", results)
                if (results.data) {
                    notification.error({ message: 'Error', description: results.data?.error });
                } else {
                    notification.error({ message: 'Error', description: 'Server Error.' });
                }
                handleCancel();
            }
        } catch (error) {
            // console.error("Error occurred:", error);
            notification.error({ message: 'Error', description: 'Error happened' });
            handleCancel();
        } finally {
            setLoadingbtn(false);
        }
    }

    return (
        <>
            <div className="h-full w-full flex flex-col gap-10 items-center justify-center scrollbar-hide">
                {loading ? (
                    <Col span={20} className="w-full">
                        <OnboardingSkeleton form={true} />
                    </Col>
                ) : (
                    <>

                        <div className="header">
                            <h1 className="heading-1">Complete your profile</h1>
                            <h1 className="sub-heading-1">
                                Upload a profile picture and complete the details below
                            </h1>
                        </div>
                        <Form
                            onFinish={onFinish}
                            onFinishFailed={onFinishFailed}
                            autoComplete="off"
                            layout="vertical"
                            requiredMark={false}
                            form={form}
                            className="lg:w-[500px] sm:w-full"
                        >
                            <div className="w-full flex flex-col gap-8">

                                <div className="h-40 flex flex-col items-center justify-center">
                                    <div className="pt-1">
                                        <UploadImage setImageUrl={handleUploadImage} picture={true} existingImage={userPayload.user_profile_image} />
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <Form.Item
                                        name="firstame"
                                        label={<h1>First Name <span className='text-bder-red'>*</span></h1>}
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Please input your firstname!',
                                            },
                                        ]}
                                        style={{
                                            display: 'inline-block',
                                            width: 'calc(50% - 8px)',
                                        }}
                                        className="formItem"
                                    >
                                        <Input
                                            placeholder="First name" size="large"
                                            className="formInput text-base"
                                            onChange={(value) => setUserPayload({ ...userPayload, firstname: value.target.value })}
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        name="lastName"
                                        label={<h1>Last Name <span className='text-bder-red'>*</span></h1>}
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Please input your lastname!',
                                            },
                                        ]}
                                        style={{
                                            display: 'inline-block',
                                            width: 'calc(50% - 8px)',
                                            // margin: '0 8px',
                                        }}
                                        className="formItem"
                                    >
                                        <Input
                                            placeholder="Last name" size="large"
                                            className="formInput text-base"
                                            value={userPayload.lastname}
                                            onChange={(value) => setUserPayload({ ...userPayload, lastname: value.target.value })}
                                        />
                                    </Form.Item>
                                </div>
                                <div className="w-full formItem ">
                                    <label>
                                        <h1>Email <span className='text-bder-red'>*</span></h1>
                                    </label>
                                    <Input
                                        value={userPayload?.email}
                                        disabled={true}
                                        className="formInput text-base"
                                    />
                                </div>
                                <div className="w-full">
                                    <Form.Item
                                        className="formItem"
                                        label={<h1>Create Password <span className='text-bder-red'>*</span></h1>}
                                        name="password"
                                        rules={[
                                            {
                                                required: true,
                                                message: "Please enter your Password!",
                                            }
                                        ]}
                                    >
                                        <Input.Password placeholder="Enter password" size="large" autoComplete="nope"
                                            className="formInput text-base"
                                            onChange={(value) => setUserPayload({ ...userPayload, password: value.target.value })}
                                        />
                                    </Form.Item>
                                </div>
                                <div className="w-full">
                                    <Form.Item
                                        className="formItem"
                                    >
                                        <Button
                                            // onClick={showModal}
                                            className="primaryBtnBlock"
                                            // type="primary"
                                            block
                                            htmlType="submit"
                                        >
                                            <span className="text-white">Continue</span>
                                            <Icon icon="iconamoon:arrow-right-2-light" width="25" height="25" className='text-secondary justify-self-end' />
                                        </Button>
                                    </Form.Item>
                                </div>
                            </div>
                        </Form>
                    </>
                )}
            </div>
            <TermsConditionsModal isModalOpen={isModalOpen} handleOk={handleSubmitUser} handleCancel={handleCancel} loadingBtn={loadingBtn} />
        </>
    )
}
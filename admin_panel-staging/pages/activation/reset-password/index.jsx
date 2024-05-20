import { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import { Button, Form, Input, notification } from 'antd';
import { ArrowLeftOutlined, EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";

import { StyledLayout } from "../../../components/Layouts/DashboardLayout/Layout.styled";
import { resetPassword } from "../../../helpers/activation/activation";
import logo from '../../../public/images/logo.png';
import Image from "next/image";
import Logo from "../../../components/shared/Logo";
import { SetPasswordIcon } from "../../../components/Icons/ActivationIcon";

const ResetPassword = () => {
    const router = useRouter()
    const { id, code, email } = router.query;

    const [passwordError, setPasswordError] = useState(true);
    const [passwordSet, setPasswordSet] = useState(false);
    const [payload, setPayload] = useState({
        email: '',
        password: '',
        passwordConfirmation: '',
        resetPasswordToken: '',
    });

    const validatePassword = async (password, confirmPassword) => {
        if (!password || !confirmPassword || password.length < 6 || confirmPassword.length < 6 || password !== confirmPassword) {
            setPasswordError(true);
            return false;
        }
        setPasswordError(false);
        return true;
    };

    useEffect(() => {
        validatePassword(payload.password, payload.passwordConfirmation);
    }, [payload]);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        const isValidPassword = await validatePassword(payload.password, payload.passwordConfirmation);

        if (!isValidPassword) return;

        try {
            const response = await resetPassword(payload);
            setPasswordSet(true);
            notification.success({
                message: "Success",
                description: response.data.data,
            });
            router.push({ pathname: `/activation/reset-password/success` });
        } catch (error) {
            const errorMessage = error?.code === 'ERR_NETWORK' ? 'Network Error, Please connect to Internet' : error?.response?.data?.error;
            notification.warning({
                message: "Failed",
                description: errorMessage,
            });
        }
    };

    return (
        <StyledLayout>
            <div className="row main-content" style={{
                minHeight: "100vh",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#ffffff"
            }}>
                <Logo />

                <div className="set-password-lock-container"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        marginTop: "2rem"
                    }}>
                    <SetPasswordIcon fill="var(--secondary)" stroke="var(--primary)" />

                    <h5 style={{
                        margin: 0,
                        padding: "0.5rem 0",
                        fontWeight: 500,
                        color: "#000",
                        fontSize: "2.5rem",
                        lineHeight: "3.2rem",
                        // wordSpacing: "-0.8rem",
                    }}>Set New Password</h5>
                    <p style={{
                        width: '333px',
                        height: '58px',
                        margin: 0,
                        color: '#757C8A',
                        fontStyle: 'normal',
                        fontWeight: 450,
                        fontSize: '16px',
                        lineHeight: '150%',
                        textAlign: 'center',
                    }}>Your password must be at least 6 characters,
                        and must differ from your previous one.
                    </p>
                </div>

                <div className="form-container">
                    <Form
                        layout="vertical"
                        autoComplete="off"
                    >
                        <Form.Item label="Password" style={{
                            marginBottom: "0.5rem"
                        }}
                            rules={[{
                                required: true,
                                message: 'The password is required.'
                            }]}
                        >
                            <Input.Password
                                placeholder="Password"
                                style={{ width: '420px', height: "40px", borderRadius: "5px" }}
                                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                                onChange={e => setPayload({ ...payload, password: e.target.value })}
                            />
                        </Form.Item>
                        <Form.Item
                            label="Confirm Password"
                            rules={[{
                                required: true,
                                message: 'Please confirm your password to proceed.'
                            }]}
                        >
                            <Input.Password
                                placeholder="Confirm Password"
                                style={{ width: '420px', height: "40px", borderRadius: "5px" }}
                                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                                onChange={e => setPayload({ ...payload, email: email, passwordConfirmation: e.target.value, resetPasswordToken: `${code}` })}
                            />
                        </Form.Item>
                        <Form.Item>
                            <Button
                                type="primary"
                                className={`primaryBtnBlock ${passwordError && '!cursor-not-allowed'}`}
                                htmlType="submit" block
                                onClick={handleChangePassword}
                                disabled={passwordError}
                            >
                                Reset password
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
                <div>
                    <p
                        style={{
                            margin: 0,
                            padding: "1rem 0 1rem 0",
                            color: "#757C8A",
                            fontSize: "1rem",
                            maxWidth: "24rem",
                            textAlign: "center"
                        }}
                    >Did not receive the email? <a style={{
                        color: "#0063CF"
                    }}
                        onClick={() => router.push({ pathname: `/activation/forgot-password` })}
                    >click to resend</a></p>

                    <Button type="link" block
                        style={{
                            height: "40px",
                            fontSize: "16px",
                            lineHeight: "20px",
                            // wordSpacing: "-0.3rem",
                            fontWeight: 450,
                            color: '#757C8A'
                        }}
                        onClick={() => router.push({ pathname: `/login` })}
                        icon={<ArrowLeftOutlined />}
                    >
                        Back to login
                    </Button>

                </div>
            </div>
        </StyledLayout>
    );
}

export default ResetPassword;

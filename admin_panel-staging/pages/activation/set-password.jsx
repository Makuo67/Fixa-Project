import { useState } from "react";
import { StyledLayout } from "../../components/Layouts/DashboardLayout/Layout.styled";
import { Alert, Button, Form, Input } from "antd";
import { useRouter } from "next/router";
import { getRemoteData } from "../../helpers/remote";
import { API_URL } from "../../config";
// import shelter_logo from "../../public/images/shelter-logo.jpeg"
import Image from "next/image";
import Logo from "../../components/shared/Logo";

const SetPassword = () => {
    const [password, setPassword] = useState('')
    const [passwordConfirmed, setPasswordConfirmed] = useState('')
    const [buttonText, setButtonText] = useState('Set password')
    const [buttonDisabled, setButtonDisabled] = useState(false)
    const [messageAlert, setMessageAlert] = useState({
        title: 'Set Password Failed',
        show: false,
        type: 'success',
        message: ''
    })
    const router = useRouter()

    const onFinish = async () => {
        try {
            setButtonText('...')
            setButtonDisabled(true)

            const passwordSetData = await getRemoteData(
                `${API_URL}/user-admin-accesses/reset_password`,
                "POST",
                "onFinish",
                false,
                {
                    email: router?.query?.email,
                    token: router?.query?.code,
                    new_password: password,
                    confirm_password: passwordConfirmed
                }
            );

            if (!passwordSetData.has_error) {
                setButtonText('Set password')
                setButtonDisabled(false)

                const loginAuth = passwordSetData.data.jwt;

                router.push(`/activation/password-set?token=${router?.query?.code}`);
            } else if (passwordSetData.has_error && passwordSetData.errors[0] === 'Incorrect code provided.') {
                router.push(`/activation/account-activated`);
            } else {
                /**
                 * Display errors
                 */
                setButtonText('Set password')
                setButtonDisabled(false)
                setMessageAlert({
                    title: 'Set Password Failed',
                    show: true,
                    type: 'error',
                    message: passwordSetData.errors[0]
                })
            }
        } catch (error) {
            console.log("Error happened in pages/activation/set-password()", error);
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
                {messageAlert.show ? (
                    <Alert
                        message={messageAlert.title}
                        description={messageAlert.message}
                        type={messageAlert.type}
                        closable
                    />
                ) : null}
                <div className="logo-container"
                    style={{
                        width: "9rem",
                        height: "5.5rem",
                        position: "relative",
                        left: '10px'
                    }}>
                    <Logo />
                </div>
                <div className="set-password-lock-container"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        marginTop: "2rem"
                    }}>

                    <img src="https://datadumpfixa.s3.eu-central-1.amazonaws.com/set-password.svg"
                        style={{
                            maxWidth: "8rem"
                        }} />

                    <h5 style={{
                        margin: 0,
                        padding: "0.4rem 0",
                        fontWeight: 500,
                        color: "#000",
                        fontSize: "2.5rem",
                        lineHeight: "3.2rem",
                        // wordSpacing: "-0.8rem",
                    }}>Set Password</h5>
                </div>
                <div className="form-container">
                    {router && router?.query && router?.query?.email ? (
                        <h5
                            style={{
                                margin: 0,
                                padding: "1rem 0",
                                color: "#757C8A",
                                fontSize: "1.14rem",
                            }}
                        >Your new password for {router?.query?.email}</h5>
                    ) : null}

                    <Form
                        layout="vertical"
                        onFinish={onFinish}
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
                            <Input.Password style={{ width: "400px", height: "40px" }}
                                onChange={(e) => setPassword(e.target.value)}
                                required />
                        </Form.Item>
                        <Form.Item
                            label="Confirm Password"
                            rules={[{
                                required: true,
                                message: 'Please confirm your password to proceed.'
                            }]}
                        >
                            <Input.Password style={{ width: "400px", height: "40px" }}
                                onChange={(e) => setPasswordConfirmed(e.target.value)} />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" block
                                style={{
                                    background: "var(--primary)",
                                    height: "40px",
                                    boxShadow: "none",
                                    borderRadius: "5px",
                                    border: "1px solid #00A1DE",
                                    fontSize: "1rem",
                                    lineHeight: "1.4rem",
                                    // wordSpacing: "-0.3rem",
                                    fontWeight: 700,
                                    textShadow: "none"
                                }}
                                disabled={buttonDisabled}
                            >
                                {buttonText}
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </div>
        </StyledLayout>
    )
}
export default SetPassword;

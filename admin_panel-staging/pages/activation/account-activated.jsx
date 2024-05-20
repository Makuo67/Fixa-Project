import React from 'react'
import { useRouter } from 'next/router';
import { Button, Form } from 'antd';

import { StyledLayout } from "../../components/Layouts/DashboardLayout/Layout.styled";
import Logo from '../../components/shared/Logo';
import { AccountActivatedIcon } from '../../components/Icons/ActivationIcon';

const AccountActivated = () => {

    const router = useRouter();

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
                    <AccountActivatedIcon fill="var(--secondary)" stroke="var(--primary)" />

                    <h5 style={{
                        margin: 0,
                        padding: "0.5rem 0",
                        fontWeight: 500,
                        color: "#000",
                        fontSize: "2.5rem",
                        lineHeight: "3.2rem",
                        // wordSpacing: "-0.8rem",
                    }}>Account already activated</h5>
                </div>

                <div className="form-container">
                    <p
                        style={{
                            margin: 0,
                            padding: "1rem 0 1rem 0",
                            color: "#757C8A",
                            fontSize: "1rem",
                            maxWidth: "24rem",
                            textAlign: "center"
                        }}
                    >The activation link you are trying to access is from an account that is already activated. Click the button below to login</p>
                    <Form
                        layout="vertical"
                    >
                        <Form.Item>
                            <Button type="primary" htmlType="submit" block
                                style={{
                                    background: "var(--primary)",
                                    height: "40px",
                                    boxShadow: "none",
                                    borderRadius: "5px",
                                    border: "1px solid var(--primary)",
                                    fontSize: "1rem",
                                    lineHeight: "1.4rem",
                                    // wordSpacing: "-0.3rem",
                                    fontWeight: 700,
                                    textShadow: "none"
                                }}
                                onClick={() => router.push({ pathname: `/login` })}
                            >
                                Login
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </div>
        </StyledLayout>
    );
}

export default AccountActivated;

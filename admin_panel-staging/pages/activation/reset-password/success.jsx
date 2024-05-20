
import { useRouter } from "next/router";
import { StyledLayout } from "../../../components/Layouts/DashboardLayout/Layout.styled";
import { Button, Form } from 'antd';

import Logo from "../../../components/shared/Logo";
import { SuccessPasswordSetIcon } from "../../../components/Icons/ActivationIcon";

const Success = () => {
    const router = useRouter()
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

                    <SuccessPasswordSetIcon fill="var(--secondary)" stroke="var(--primary)" />

                    <h5 style={{
                        margin: 0,
                        padding: "0.5rem 0",
                        fontWeight: 500,
                        color: "#000",
                        fontSize: "2.5rem",
                        lineHeight: "3.2rem",
                        // wordSpacing: "-0.8rem",
                    }}>Password Has Been Set </h5>
                </div>

                <div className="form-container">
                    <h5
                        style={{
                            fontWeight: 400,
                            color: "#757C8A",
                            fontSize: "16px",
                            width: '333px',
                            height: '72px',
                            textAlign: 'center',
                        }}
                    >Your new password has been successfully reset. click the link below to login.</h5>

                </div>
                <div>
                    <Button type="primary" htmlType="submit"
                            style={{
                                width: '400px',
                                background: "var(--primary)",
                                borderRadius: "5px",
                                border: "1px solid var(--primary)",
                                height: "40px",
                                fontSize: "16px",
                                lineHeight: "20px",
                                // wordSpacing: "-0.3rem",
                                fontWeight: 750,
                                color: '#FFFFFF',
                                textAlign: 'center'
                            }}
                            onClick={() => router.push({ pathname: `/login` })}
                    >
                        Continue
                    </Button>
                </div>
            </div>
        </StyledLayout >
    );
}

export default Success;

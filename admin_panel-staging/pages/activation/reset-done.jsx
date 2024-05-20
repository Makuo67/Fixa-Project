import {ArrowLeftOutlined} from '@ant-design/icons';
import {Button} from 'antd';
import {useRouter} from 'next/router';

import {StyledLayout} from "../../components/Layouts/DashboardLayout/Layout.styled";

const ResetDone = () => {
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
                <div className="logo-container"
                     style={{
                         width: "9rem",
                         height: "5rem",
                         position: "relative"
                     }}>
                    <img
                        src="https://datadumpfixa.s3.eu-central-1.amazonaws.com/set-password-logo.png"
                        style={{
                            position: "absolute",
                            top: 0,
                            width: "100%"
                        }}
                    />
                </div>

                <div className="set-password-lock-container"
                     style={{
                         display: "flex",
                         flexDirection: "column",
                         alignItems: "center",
                         marginTop: "2rem"
                     }}>

                    <img src="https://datadumpfixa.s3.eu-central-1.amazonaws.com/check-your-email.svg"
                         style={{
                             maxWidth: "8rem"
                         }}/>

                    <h5 style={{
                        margin: 0,
                        padding: "0.5rem 0",
                        fontWeight: 500,
                        color: "#000",
                        fontSize: "2.5rem",
                        lineHeight: "3.2rem",
                        // wordSpacing: "-0.8rem",
                    }}>Check your email</h5>
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
                    >Thanks! We have shared the link to reset your password to {router?.query?.email}</p>
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
                    }} onClick={() => router.push({pathname: `/activation/forgot-password`})}
                    >click to resend</a></p>
                    <Button type="link" block
                            style={{
                                fontSize: "1rem",
                                lineHeight: "20px",
                                // wordSpacing: "-0.3rem",
                                fontWeight: 450,
                                color: '#757C8A'
                            }}
                            onClick={() => router.push({pathname: `/login`})}
                            icon={<ArrowLeftOutlined/>}
                    >
                        Back to login
                    </Button>
                </div>
            </div>
        </StyledLayout>
    );
}

export default ResetDone;

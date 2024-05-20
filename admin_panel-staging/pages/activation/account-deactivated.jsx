import React from "react";

import { StyledLayout } from "../../components/Layouts/DashboardLayout/Layout.styled";
import { AccountDeactivatedIcon } from "../../components/Icons/ActivationIcon";
import Logo from "../../components/shared/Logo";

const AccountDeactivated = () => {
    return (
        <StyledLayout>
            <div
                className="row main-content"
                style={{
                    minHeight: "100vh",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#ffffff",
                }}
            >
                {/* <div
                    className="logo-container"
                    style={{
                        width: "9rem",
                        height: "5rem",
                        position: "relative",
                    }}
                >
                </div> */}
                <Logo />
                <div
                    className="set-password-lock-container"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        // marginTop: "2rem",
                    }}
                >
                    <AccountDeactivatedIcon stroke="var(--primary)" />

                    <h5
                        style={{
                            margin: 0,
                            padding: "0.5rem 0",
                            fontWeight: 500,
                            color: "#000",
                            fontSize: "2.5rem",
                            lineHeight: "3.2rem",
                            // wordSpacing: "-0.8rem",
                        }}
                    >
                        Account Deactivated
                    </h5>
                </div>

                <div className="form-container">
                    <p
                        style={{
                            margin: 0,
                            padding: "1rem 0 1rem 0",
                            color: "#757C8A",
                            fontSize: "1rem",
                            maxWidth: "24rem",
                            textAlign: "center",
                        }}
                    >
                        Account authentication failed, Contact your admin for support{" "}
                    </p>
                </div>
            </div>
        </StyledLayout>
    );
};

export default AccountDeactivated;

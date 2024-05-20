import { Component } from "react";
import { withRouter } from "next/router";
import { StyledLayout } from "../../components/Layouts/DashboardLayout/Layout.styled";
import { Button, Form, Input, Radio } from 'antd';
import { storeAuthTokenInLocalStorage } from "../../helpers/auth";

class PasswordSet extends Component {
    constructor(props) {
        super(props);
        this.state = {
            buttonLoading: false
        }
        this.loginUser = this.loginUser.bind(this);
    }

    loginUser = async() => {
        try {
            this.setState({
                buttonLoading: true
            });
            const authToken = this.props.router.query.token;
            if(authToken) {
                await storeAuthTokenInLocalStorage(authToken);
                this.props.router.push('/login');
            } else {
                this.setState({
                    buttonLoading: false
                })
            }
        } catch(error) {
            console.log('Error happened in /page/activation/password-set/loginUser() ', error);
        }
    }

    render() {
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

                        <img src="https://datadumpfixa.s3.eu-central-1.amazonaws.com/success-password-set.svg"
                             style={{
                                 maxWidth: "8rem"
                             }} />
                    </div>

                    <div className="form-container"
                         style={{
                             display: "flex",
                             flexDirection: "column",
                             justifyContent: "center",
                             alignItems: "center"
                    }}>
                        <h5
                            style={{
                                margin: 0,
                                padding: "1rem 0 0 0",
                                color: "#757C8A",
                                fontSize: "1rem",
                            }}
                        >Your password has been successfully set.</h5>
                        <h5
                            style={{
                                margin: "0 0 1rem 0",
                                padding: 0,
                                color: "#757C8A",
                                fontSize: "1rem",
                            }}
                        >Click below to login.</h5>
                        <Form
                            layout="vertical"
                        >

                            <Form.Item>
                                <Button type="primary" htmlType="submit" block
                                        style={{
                                            background: "var (--primary)",
                                            height: "40px",
                                            width: "400px",
                                            boxShadow: "none",
                                            borderRadius: "5px",
                                            border: "1px solid var(--primary)",
                                            fontSize: "1rem",
                                            lineHeight: "1.4rem",
                                            // wordSpacing: "-0.3rem",
                                            fontWeight: 700,
                                            textShadow: "none",
                                            color: '#FFFFFF',
                                        }}
                                        loading={this.state.buttonLoading}
                                        onClick={() => this.loginUser()}
                                >
                                    Continue
                                </Button>
                            </Form.Item>
                        </Form>
                    </div>
                </div>
            </StyledLayout>
        );
    }
}

export default withRouter(PasswordSet);

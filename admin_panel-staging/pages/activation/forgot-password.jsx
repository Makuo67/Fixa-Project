import { useState, useEffect } from "react";
import { Button, Form, Input, notification } from 'antd';
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter } from 'next/router';
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

import { StyledLayout } from "../../components/Layouts/DashboardLayout/Layout.styled";
import { sendForgetEmail } from "../../helpers/activation/activation";
import Logo from "../../components/shared/Logo";
import { SetPasswordIcon } from "../../components/Icons/ActivationIcon";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setIsLoading(false);
  }, [emailSent]);

  const handleSubmitEmail = (e) => {
    e.preventDefault();

    //validating email
    var validRegex = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})*$/;

    if (email.match(validRegex)) {
      onSubmit(email);
      setEmail('');
    }
    else {
      notification.warning({
        message: 'Incorrect email',
        description: 'Please fill in the correct Email format!',
      })
    }
  }

  const onSubmit = (values) => {
    setIsLoading(true);
    sendForgetEmail(values)
      .then((resp) => {
        if (resp.status === 200) {
          setEmailSent(true);
          router.push({
            pathname: `/activation/reset-done`,
            query: {
              email: email
            }
          });
        }
        else {
          setEmailSent(false);
          setIsLoading(false);
        }
      })
      .catch(error => {
        setEmailSent(false);
        setIsLoading(false)
        notification.warning({
          message: 'Incorrect email',
          description: 'This email does not exist!',
        })
      })
  }

  return (
    <StyledLayout>
      <ToastContainer />
      <div className="row main-content" style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ffffff"
      }}>
        {/* <div className="logo-container"
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
        </div> */}
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
          }}>Forgot Password</h5>
        </div>

        <div className="form-container">
          <h5
            style={{
              margin: 0,
              padding: "1rem 0",
              color: "#757C8A",
              fontSize: "1.14rem",
            }}
          >No worries we will send you password reset instructions.</h5>
          <Form
            layout="vertical"
          >
            <Form.Item label="Email" style={{
              marginBottom: "1.2rem"
            }}>
              <Input
                type="email"
                style={{ width: '420px', height: "40px", borderRadius: "5px" }}
                placeholder="Enter your email"
                onChange={e => setEmail(e.target.value)}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block
                style={{
                  background: "var(--primary)",
                  height: "40px",
                  boxShadow: "none",
                  borderRadius: "5px",
                  border: "1px solid var(--primary)",
                  fontSize: "16px",
                  lineHeight: "20px",
                  // wordSpacing: "-0.3rem",
                  fontWeight: 700,
                  textShadow: "none",
                }}
                onClick={handleSubmitEmail}>
                Send me reset link
              </Button>
            </Form.Item>
          </Form>
        </div>
        <div>
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
    </StyledLayout >
  );
}

export default ForgotPassword;

import { useEffect, useRef, useState } from "react";
import { Alert, Button, Form, Input, notification } from "antd";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import Image from "next/image";

import { login } from "../redux/actions/user.actions";
import AccountLayout from "../components/Layouts/AccountLayout/AccountLayout";
import OtpInput from "react-otp-input";
import { StyledConfirmationModal } from "../components/Modals/PaymentsModals/ConfirmationModal.styled";
import { checkOnboarding, createLoginOTP, storeAuthTokenInLocalStorage, storeUser, userAccess } from "../helpers/auth";
import { USER_LOGIN_ERROR } from "../redux/constants/user.constants";
import Logo, { changeplatform } from "../components/shared/Logo";
import { itemStyles } from "@/components/Forms/WorkerRegistrationForm";

import useSession from "@/utils/sessionLib";

export const StyledContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f2fafd;
  .loader {
    text-align: center;
  }

  .ant-checkbox-checked .ant-checkbox-inner  {
    background-color: ${props => props.theme.primary};
    border-color: ${props => props.theme.primary};
  }
`;

const Login = () => {
  const user_loading = useSelector((state) => state.user.loading);
  var user_error = useSelector((state) => state.user.error);
  var otp_error = useSelector((state) => state.user.error);
  const [showOTPForm, setshowOTPForm] = useState(false);
  const [OTP, setOTP] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpVerification, setOtpVerification] = useState({
    otp_type_id: 3,
    otp_pin: "",
    email: "",
  });
  const [loginDisabled, setLoginDisabled] = useState(true);
  const [OTPDisabled, setOTPDisabled] = useState(true);
  const [login_loading, setLogin_loading] = useState(false);
  const [verifying_otp, setVerifying_otp] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const dispatch = useDispatch();
  const router = useRouter();

  const { userLogin } = useSession();

  const primaryTheme = {
    primary: "var(--primary)",
  };

  const backgroundImage = process.env.NEXT_PUBLIC_BACKGROUND_IMAGE;
  const companyLogo = process.env.NEXT_PUBLIC_LOGO;
  const platform = changeplatform()

  let credentials = {
    otp_type_id: 3,
    email: "",
    password: "",
  };

  useEffect(() => {
    inputRef?.current?.focus();
  }, [router.isReady]);

  const handleOTPChanged = (otp) => {
    setOTP(otp);
    if (otp.length === 5) {
      setOTPDisabled(false);
      setOtpVerification({
        ...otpVerification,
        otp_pin: parseInt(otp),
        email: userEmail,
      });
    }
  };

  const onFinish = async (values) => {
    setLogin_loading(true);
    setUserEmail(values.email);
    setPassword(values.password);

    credentials = {
      otp_type_id: 3,
      email: values.email,
      password: values.password,
    };

    const response = await createLoginOTP(credentials);

    if (response?.statusCode == 200 && !response?.error) {

      // OTP True ?? No OTP
      if (response?.data?.length === 0) {
        setshowOTPForm(true);
        notification.success({
          message: "Success",
          description: `${response?.message}`,
        });
        setLogin_loading(false);
      } else {
        setshowOTPForm(false);
        try {
          // store session
          userLogin(response?.data)
          storeAuthTokenInLocalStorage(`Bearer ${response?.data?.jwt}`);
          storeUser(
            `${response?.data?.user?.firstname} ${response?.data?.user?.lastname}`,
            response?.data?.user_access?.title?.title_name,
            response?.data?.user
          );
          userAccess(response?.data.user_access);

          // Store company status info
          checkOnboarding(response?.data?.company_status)
          setLogin_loading(false);
          router.push("/");

        }
        catch (e) {
          setshowOTPForm(false);
          setLogin_loading(false);
          dispatch({
            type: USER_LOGIN_ERROR,
            payload: "Failed to login",
          });
        }
      }
    } else {
      setshowOTPForm(false);
      setLogin_loading(false);
      dispatch({
        type: USER_LOGIN_ERROR,
        payload: response?.message,
      });
    }
  };

  const verifyOTP = async () => {
    setVerifying_otp(true);
    dispatch(login(otpVerification))
      .then(res => {
        console.log("res login", res);
        setTimeout(() => {
          setVerifying_otp(false);
        }, 1000);
        setOtpVerification({
          otp_type_id: 3,
          otp_pin: [],
          email: "",
        });
        credentials = {
          otp_type_id: 3,
          email: "",
          password: "",
        };
        setOTP([]);
        router.push("/");
      })
    setTimeout(() => {
      setVerifying_otp(false);
    }, 1000);
  };

  const resendOTP = async () => {
    credentials = {
      otp_type_id: 3,
      email: userEmail,
      password: password,
    };
    createLoginOTP(credentials).then((response) => {
      if (response?.statusCode == 200 && !response?.error) {
        notification.success({
          message: "Success",
          description: `${response?.message}`,
        });
      }
    });
  };

  return (
    <>
      <StyledContainer theme={primaryTheme}>
        {/*  ===== BACKGROUND ===== */}
        <div
          className="row main-content"
          style={{
            minHeight: "100vh",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            // backgroundColor: "#ffffff",
            // backgroundImage:
            //   'url("https://datadumpfixa.s3.eu-central-1.amazonaws.com/IMG_3640+1.png")',
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
        >
          <Image
            src={backgroundImage}
            alt="background"
            layout="fill"
            objectFit="cover"
            priority={true}
          />
          <div
            className="background-overlay"
            style={{
              height: "100vh",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              // backgroundColor: "var(--primary)"
            }}
          >
            <div
              className="!w-[500px] h-fit flex flex-col items-center justify-center gap-8 bg-[#0291c8]/50 backdrop-blur-md rounded-md py-10"
            >
              <div className="w-full flex justify-center">
                <Logo />
              </div>
              {(user_error || otp_error) && (
                <Alert
                  style={{ marginBottom: "20px", width: "316px" }}
                  message="Failed"
                  description={`${user_error}.`}
                  type="error"
                  showIcon
                  closable={false}
                />
              )}
              {showOTPForm ? (
                <Form
                  name="basic"
                  initialValues={{ remember: true }}
                  layout="vertical"
                  onFinish={verifyOTP}
                  autoComplete="on"
                  className="!w-[316px] login-form"
                >
                  <Form.Item>
                    <StyledConfirmationModal>
                      <div className="flex flex-col items-center gap-4">
                        <p className="text-lg text-center text-secondary">
                          We sent you a code through your email {userEmail}

                        </p>
                        <div>
                          <OtpInput
                            onChange={handleOTPChanged}
                            value={OTP}
                            inputStyle="inputStyle2"
                            numInputs={5}
                            separator={<span></span>}
                            shouldAutoFocus={true}
                          />
                        </div>
                      </div>
                    </StyledConfirmationModal>
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      loading={verifying_otp}
                      className="primaryBtnLogin"
                      disabled={OTPDisabled}
                    >
                      Verify
                    </Button>
                    <p
                      style={{
                        color: "white",
                        fontWeight: "500",
                        fontSize: "15px",
                        marginTop: "30px",
                      }}
                    >
                      Didn’t receive the Code?{" "}
                      <a
                        style={{
                          color: "orange",
                          fontWeight: "500",
                        }}
                        onClick={resendOTP}
                      >
                        click here to resend.
                      </a>
                    </p>
                  </Form.Item>
                </Form>
              ) : (
                <Form
                  name="basic"
                  initialValues={{ remember: true }}
                  layout="vertical"
                  onFinish={onFinish}
                  autoComplete="off"
                  className="!w-[316px]"
                >
                  <Form.Item
                    label={<span className="text-secondary">Email / Phone Number</span>}
                    name="email"
                    rules={[
                      { required: true, message: "Please input your email." },
                    ]}
                  >
                    <Input
                      placeholder="example@gmail.com"
                      // onChange={handleEmailChanged}
                      ref={inputRef}
                      className={`${itemStyles.loginInputStyles} !h-12 login-form-input`}
                    // value={credentials.email}
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span className="!text-secondary">Password</span>}
                    name="password"
                    rules={[
                      {
                        required: true,
                        message: "Please input your password.",
                      },
                    ]}
                  >
                    <Input.Password
                      required
                      type={"password"}
                      className={`${itemStyles.loginInputStyles} !h-12 login-form-password`}
                      style={{
                        background: "rgba(0, 0, 0, 0.25)",
                        borderRadius: "4px",
                        height: "40px",
                        width: "100%",
                        borderColor: "#ffffff",
                        color: "#ffffff"
                      }}

                    // onChange={handlePasswordChanged}
                    // value={credentials.password}
                    />
                  </Form.Item>
                  <Form.Item className="flex flex-col">
                    <a className="text-md mb-1 !text-secondary underline"
                      onClick={() => {
                        router.push({
                          pathname: `/activation/forgot-password`,
                        });
                      }}
                    >
                      Forgot password?
                    </a>
                    {/* <Checkbox
                      // checked
                      className="text-md mb-1 !text-secondary"
                    >
                      Remember me
                    </Checkbox> */}
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      loading={login_loading}
                      className="primaryBtnLogin"
                    // disabled={loginDisabled}
                    >
                      Login
                    </Button>
                  </Form.Item>
                </Form>
              )}
            </div>
          </div>
        </div>
      </StyledContainer>
    </>
  );
};
Login.getLayout = function getLayout(page) {
  return <AccountLayout>{page}</AccountLayout>;
};
export default Login;

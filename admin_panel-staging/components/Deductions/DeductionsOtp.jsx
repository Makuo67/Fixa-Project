import { Button } from "antd";
import { capitalizeAll } from "../../helpers/capitalize";
import moment from "moment";
import OtpInput from "react-otp-input";

export const InputOtp = ({ payment_info, otp, handleOtpInput, handleOtpSubmit, btnLoading, payee, resendOTP }) => {

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '30px',
            alignItems: 'center',
            justifyContent: 'start',
        }}>
            <span style={{
                width: "100%",
                color: "var(--character-title-85, rgba(0, 0, 0, 0.85))",
                fontSize: "16px",
                fontStyle: "normal",
                fontWeight: "600",
                lineHeight: "22px",
                textAlign: "center",
                // textTransform: "capitalize"
            }}>{`Confirm Deductions From ${capitalizeAll(payee)} for ${payment_info && capitalizeAll(payment_info?.project_name)} for ${payment_info && moment(payment_info?.start_date).format('DD-MM-YYYY')} and ${payment_info && moment(payment_info?.end_date).format('DD-MM-YYYY')}`}</span>
            <h1>Enter Code</h1>
            <span style={{
                color: "#757C8A",
                fontSize: "16px",
                fontStyle: "normal",
                fontWeight: "500",
                lineHeight: "150%",
                textAlign: "center",
            }}>
                We sent you a code through your phone number
            </span>
            <OtpInput
                value={otp}
                onChange={handleOtpInput}
                inputStyle={{
                    width: "35px",
                    height: "35px",
                    borderRadius: "5px",
                    border: "0.5px solid #d4d7d9",
                    background: "#FFF",
                    color: "#000",
                    fontSize: "16px",
                    margin: "10px",
                }}
                numInputs={5}
                separator={<span>-</span>}
                shouldAutoFocus={true}
                renderInput={(props) => <input {...props} />}
            />
            <Button
                loading={btnLoading}
                style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "5px 16px",
                    width: "317px",
                    height: "40px",
                    background: "var(--primary)",
                    color: "#fff",
                    borderRadius: "5px",
                    cursor: "pointer",
                    border: "none",
                }}
                onClick={handleOtpSubmit}
            >Submit</Button>
            <div style={{
                display: "flex",
                gap: "10px",
            }}>
                <span style={{
                    color: "#757C8A",
                    fontSize: "16px",
                    fontStyle: "normal",
                    fontWeight: "500",
                    lineHeight: "150%",
                    textAlign: "center",
                }}>
                    Didn&apos;t receive the Code?
                </span>
                <span style={{ color: "#00A1DE", cursor: "pointer" }} onClick={resendOTP}>
                    Click to resend
                </span>
            </div>
        </div>
    );
}
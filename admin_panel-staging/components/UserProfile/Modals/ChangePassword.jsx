import {
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  notification,
  EyeTwoTone,
} from "antd";
import React, { useState } from "react";
import { Icon } from "@iconify/react";
import StyledEditor from "../../Settings/Modals/StyleEditor";
import { USER_LOGOUT_REQUESTED } from "../../../redux/constants/user.constants";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { changePassword } from "../../../helpers/user-profile/user-profile";
import StyledPasswordModal from "./StyledPasswordModal.js";

export default function ChangePassword(props) {
  const dispatch = useDispatch();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const close = () => {
    props.setShowEditPasswordModal(false);
  };
  const editPassword = (values) => {
    if (values.new_password !== values.confirm_password) {
      notification.error({
        message: "Error!",
        description: "The Password and Confirmation password do not match.",
      });
    } else {
      const data = {
        email: props.email,
        old_password: values.old_password,
        new_password: values.new_password,
        confirm_password: values.confirm_password,
      };
      setLoading(true);
      changePassword(data).then((res) => {
        if (res.request?.status == 400) {
          setLoading(false);
          notification.error({
            message: "Error!",
            description: `${res.data?.error}`,
          });
        } else {
          setLoading(false);
          notification.success({
            message: "success!",
            description: "Password successfully changed",
          });
          close();

          dispatch({ type: USER_LOGOUT_REQUESTED });
          router.push("/login");
        }
      });
    }
  };
  const ModalTitle = () => (
    <StyledEditor>
      <h1 className="import modalTitle changepass">Change Password</h1>
    </StyledEditor>
  );

  return (
    <>
      <Modal
        centered
        title={<ModalTitle />}
        okText="Yes"
        cancelText="No"
        // closeIcon={<Icon icon="fe:close" className="close" />}
        open={props.showEditPasswordModal}
        onOk={close}
        onCancel={close}
        bodyStyle={{
          height: "fit-content",
        }}
        width={422}
        footer={null}
      >
        <StyledPasswordModal>
          <div style={{ marginTop: "5px" }}>
            <Form
              name="basic"
              initialValues={{ remember: true }}
              layout="vertical"
              onFinish={editPassword}
            >
              <Form.Item
                label={
                  <span>
                    Existing Password <span style={{ color: "red" }}>*</span>
                  </span>
                }
                name="old_password"
                rules={[
                  {
                    validator(rule, value) {
                      return new Promise((resolve, reject) => {
                        if (value !== "" && typeof value !== "undefined") {
                          if (value?.length >= 6) {
                            resolve();
                          } else {
                            reject("Password should be at least 6 characters");
                          }
                        } else {
                          reject("Enter Old Password");
                        }
                      });
                    },
                  },
                ]}
              >
                <Input.Password
                  placeholder="Enter your old password"
                  type="password"
                  autoComplete="off"
                />
              </Form.Item>
              <Form.Item
                label={
                  <span>
                    New Password <span style={{ color: "red" }}>*</span>
                  </span>
                }
                name="new_password"
                rules={[
                  {
                    validator(rule, value) {
                      return new Promise((resolve, reject) => {
                        if (value !== "" && typeof value !== "undefined") {
                          if (value?.length >= 6) {
                            resolve();
                          } else {
                            reject("Password should be at least 6 characters");
                          }
                        } else {
                          reject("Enter New Password");
                        }
                      });
                    },
                  },
                ]}
                className="input"
              >
                <Input.Password
                  placeholder="Enter a strong password e.g:strongPass@123"
                  type="password"
                  autoComplete="off"
                />
              </Form.Item>
              <Form.Item
                label={
                  <span>
                    Re-enter New Password{" "}
                    <span style={{ color: "red" }}>*</span>
                  </span>
                }
                name="confirm_password"
                rules={[
                  {
                    validator(rule, value) {
                      return new Promise((resolve, reject) => {
                        if (value !== "" && typeof value !== "undefined") {
                          if (value?.length >= 6) {
                            resolve();
                          } else {
                            reject("Password should be at least 6 characters");
                          }
                        } else {
                          reject("Confirm Password");
                        }
                      });
                    },
                  },
                ]}
                className="input"
              >
                <Input.Password
                  placeholder="Re-enter new password e.g:strongPass@123"
                  type="password"
                  autoComplete="off"
                  fullWidth={true}
                />
              </Form.Item>

          <Form.Item style={{ display: "flex", justifyContent: "center", margin: "40px 0px" }}>
                <Button
                  type="primary"
                  className="primaryBtn"
                  htmlType="submit"
                  loading={loading}
                >
                  Update Password
                </Button>
              </Form.Item>
            </Form>
          </div>
        </StyledPasswordModal>
      </Modal>
    </>
  );
}

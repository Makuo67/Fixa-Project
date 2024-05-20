import { Modal, Button, Checkbox, Form, Input, notification } from "antd";
import StyledEditor from "./StyleEditor";
import { Icon } from "@iconify/react";
import { removeSupervisor } from "../../../helpers/projects/supervisors";
import {
  createSupervisor,
  updateSettingsSupervisor,
} from "../../../helpers/settings/settings";
import { useContext, useState } from "react";
import { PusherContext } from "../../../context/PusherContext";

export const AddSettingsSupervisors = (props) => {
  const [form] = Form.useForm();
  const { loadSupervisor, setLoadSupervisor } = useContext(PusherContext);
  const [okBtnLoading, setOkBtnLoading] = useState(false);

  const phoneRegex = /^(078|079)\d{7}$/;
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  const nameRegex = /^([a-z]+(-| )?)+$/i;
  const ModalTitle = () => (
    <StyledEditor>
      <h1 className="import modalTitle">
        {props.edit ? "Edit Supervisor" : "New Supervisor"}
      </h1>
    </StyledEditor>
  );
  const onFinish = (values) => {
    setOkBtnLoading(true);
    if (values && props.edit === false) {
      const payload = {
        role: "supervisors",
        first_name: values.first_name,
        last_name: values.last_name,
        username: values.phone_number,
        password: "",
        email: values.email,
        blocked: false,
      };

      props.closeSupervisorModal();
      onReset();
      createSupervisor(payload)
        .then((res) => {
          setOkBtnLoading(false);
        }).finally(() => {
          props.setLoading(true)
          setLoadSupervisor(false);
        })
    } else {
      const filteredObj = Object.fromEntries(
        Object.entries(values).filter(([_, v]) => v !== undefined)
      );
      const { phone_number, ...newObj } = filteredObj;

      const updatePayload = {
        user_id: props.record.id,
        username: values.phone_number
          ? values.phone_number
          : props.record.phone_number,
        ...newObj,
      };

      setLoadSupervisor(true);
      onReset();
      updateSettingsSupervisor(updatePayload)
      .then((res) => {
        onReset();
        setOkBtnLoading(false);
      }).finally(() => {
          props.setLoading(true)
          setLoadSupervisor(false);
          props.closeSupervisorModal();
        })
    }
  };

  const onReset = () => {
    form.resetFields();
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  return (
    <Modal
      centered
      title={<ModalTitle />}
      okText="Yes"
      cancelText="No"
      open={props.addSupervisor}
      onOk={props.closeSupervisorModal}
      onCancel={props.closeSupervisorModal}
      // closeIcon={<Icon icon="fe:close" className="close" />}
      bodyStyle={{
        height: "fit-content",
      }}
      width={820}
      footer={null}
    >
      <div>
        <Form
          name="form_item_path"
          layout="vertical"
          form={form}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
        >
          <StyledEditor>
            <div className="form">
              <div>
                <Form.Item
                  label={
                    <span>
                      First Name <span style={{ color: "red" }}>*</span>
                    </span>
                  }
                  name="first_name"
                  rules={[
                    props.edit === false
                      ? [
                          {
                            required: true,
                            message: "Missing First Name",
                          },
                        ]
                      : "",
                    {
                      validator(rule, value) {
                        return new Promise((resolve, reject) => {
                          if (value !== "") {
                            // resolve();
                            if (nameRegex.test(value)) {
                              resolve();
                            } else {
                              reject("Invalid Name");
                            }
                          } else {
                            reject("Missing Name");
                          }
                        });
                      },
                    },
                  ]}
                >
                  <Input
                    defaultValue={props.edit ? props.record?.first_name : ""}
                    // onChange={handleNameChanged}
                    type="text"
                    autoComplete="off"
                  />
                </Form.Item>
                <Form.Item
                  label={
                    <span>
                      Email <span style={{ color: "red" }}>*</span>
                    </span>
                  }
                  name="email"
                  className="input"
                  rules={[
                    {
                      validator(rule, value) {
                        return new Promise((resolve, reject) => {
                          if (value !== "" && typeof value !== "undefined") {
                            if (emailRegex.test(value)) {
                              resolve();
                            } else {
                              reject("Invalid Email");
                            }
                          } else if (typeof value === "undefined") {
                            resolve();
                          } else {
                            reject("Missing Email");
                          }
                        });
                      },
                    },
                  ]}
                >
                  <Input
                    defaultValue={props.edit ? props.record?.email : ""}
                    placeholder="Email"
                    type="text"
                    autoComplete="off"
                    // onChange={handleEmailChanged}
                  />
                </Form.Item>
              </div>
              <div className="left-inputs">
                <Form.Item
                  label={
                    <span>
                      Last Name <span style={{ color: "red" }}>*</span>
                    </span>
                  }
                  name="last_name"
                  rules={[
                    {
                      validator(rule, value) {
                        return new Promise((resolve, reject) => {
                          if (value !== "") {
                            // resolve();
                            if (nameRegex.test(value)) {
                              resolve();
                            } else {
                              reject("Invalid Last Name");
                            }
                          } else {
                            reject("Missing Last Name");
                          }
                        });
                      },
                    },
                  ]}
                >
                  <Input
                    defaultValue={props.edit ? props.record?.last_name : ""}
                    // onChange={handleAddressChanged}
                    type="text"
                    autoComplete="off"
                  />
                </Form.Item>
                <Form.Item
                  label={
                    <span>
                      Work Phone Number <span style={{ color: "red" }}>*</span>
                    </span>
                  }
                  name="phone_number"
                  className="input"
                  rules={[
                    {
                      validator(rule, value) {
                        return new Promise((resolve, reject) => {
                          if (value !== "" && typeof value !== "undefined") {
                            if (phoneRegex.test(value)) {
                              resolve();
                            } else {
                              reject("Invalid Phone Number");
                            }
                          } else if (typeof value === "undefined") {
                            resolve();
                          } else {
                            reject("Missing Phone Number");
                          }
                        });
                      },
                    },
                  ]}
                >
                  <Input
                    defaultValue={props.edit ? props.record?.phone_number : ""}
                    placeholder="07XXXXXXXX"
                    maxLength={10}
                    type="text"
                    autoComplete="off"
                    // onChange={handlePhoneChanged}
                  />
                </Form.Item>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "40px",
                gap: "20px",
              }}
            >
              <Button
                className="secondaryBtn"
                disabled={false}
                loading={false}
                onClick={props.closeSupervisorModal}
              >
                Cancel
              </Button>
              <Button
                type="secondary"
                className="primaryBtn"
                htmlType="submit"
                disabled={false}
                loading={okBtnLoading}
              >
                {props.edit ? "Edit" : "Save"}
              </Button>
            </div>
          </StyledEditor>
        </Form>
      </div>
    </Modal>
  );
};

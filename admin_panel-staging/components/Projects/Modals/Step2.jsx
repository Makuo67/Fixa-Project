import { Button, Form, Input, Select, notification } from "antd";
import React, { useState } from "react";
import { saveClient } from "../../../helpers/projects/projects";
import { StyledAddClient } from "./StyledAddClient.styled";
import UploadImages from "./UploadImages";

const { Option } = Select;
export default function Step2(props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const onFinish = (values) => {
    setLoading(true);
    props.setPayload({ ...props.payload, ...values });
    saveClient({ ...props.payload, ...values }).then(() => {
      props.getModalData();
    })
    setLoading(false);
    props.close();
  };
  return (
    <div>
      <Form
        name="form_item_path"
        layout="vertical"
        form={form}
        onFinish={onFinish}
        requiredMark={false}
        autoComplete="off"
      >
        <StyledAddClient>
          <div className="client-info">
            <div>
              <Form.Item
                label={
                  <span>
                    First Name <span style={{ color: "red" }}>*</span>
                  </span>
                }
                name="user_first_name"
                className="input"
                rules={[
                  {
                    required: true,
                    message: "Missing Name",
                  },
                  {
                    pattern: /^[A-Za-z\s]+$/,
                    message: "Invalid Name",
                  },
                ]}
              >
                <Input placeholder="XXXX" type="text" autoComplete="off" />
              </Form.Item>

              <Form.Item
                label={
                  <span>
                    Work Email
                    <span style={{ color: "red", marginLeft: 5 }}>*</span>
                  </span>
                }
                name="user_email"
                className="input"
                rules={[
                  { required: true, message: "Missing Email" },
                  {
                    pattern: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                    message: "Invalid Email",
                  },
                ]}
              >
                <Input placeholder="example@fixarwanda.com" type="text" autoComplete="off" />
              </Form.Item>
              <Form.Item
                label={
                  <span>
                    Job Title <span style={{ color: "red" }}>*</span>
                  </span>
                }
                name="user_title"
                className="input"
              >
                <Input placeholder="HR manager" type="text" autoComplete="off" />
              </Form.Item>
            </div>
            <div className="left-inputs">
              <Form.Item
                label={
                  <span>
                    Last Name <span style={{ color: "red" }}>*</span>
                  </span>
                }
                name="user_last_name"
                className="input"
                rules={[
                  {
                    required: true,
                    message: "Missing Name",
                  },
                  {
                    pattern: /^[A-Za-z\s]+$/,
                    message: "Invalid Name",
                  },
                ]}
              >
                <Input placeholder="XXXX" type="text" autoComplete="off" />
              </Form.Item>
              <Form.Item
                label={
                  <span>
                    Phone Number <span style={{ color: "red" }}>*</span>
                  </span>
                }
                name="user_phone_number"
                className="input"
                rules={[
                  {
                    required: true,
                    message: "Missing Phone Number",
                  },
                  {
                    pattern: /^(07)\d{8}$/,
                    message: "Invalid Phone Number",
                  },
                ]}
              >
                <Input placeholder="07XXXXXXXX" type="text" autoComplete="off" />
              </Form.Item>
            </div>
          </div>
          <div className="buttons2">
            <Button className="cancelButton" htmlType="submit" onClick={props.close}>
              Cancel
            </Button>
            <Button loading={loading} className="nextButton" htmlType="submit">
              Save Client
            </Button>
          </div>
        </StyledAddClient>
      </Form>
    </div>
  );
}

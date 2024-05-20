import { Button, Form, Input, Select } from "antd";
import React, { useEffect, useState } from "react";
import { getCountries, getIndustryTypes, getProvinces } from "../../../helpers/projects/projects";
import { StyledAddClient } from "./StyledAddClient.styled";
import UploadImages from "./UploadImages";
import { capitalizeAll } from "../../../helpers/capitalize";

const { Option } = Select;
export default function Step1(props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [industryTypes, setIndustryTypes] = useState({ loading: true, data: [] });
  const [countries, setCountries] = useState({ loading: true, data: [] });
  const [provinces, setProvinces] = useState({ loading: true, data: [] });

  const onFinish = (values) => {
    setLoading(true);
    // console.log("my values", values);
    setLoading(false);
    props?.changeStep();
    if (values.company_logo_url == undefined) {
      values.company_logo_url = "no";
    }
    props.setPayload({ ...props.payload, ...values });
  };

  useEffect(() => {
    getIndustryTypes().then((data) => {
      setIndustryTypes({ loading: false, data: data });
    });
    getCountries().then((data) => {
      // console.log(data);
      setCountries({ loading: false, data: data });
    });
    getProvinces().then((data) => {
      // console.log(data);
      setProvinces({ loading: false, data: data });
    });
  }, []);

  // console.log(industryTypes?.data);
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
                    Company Name
                    <span style={{ color: "red", marginLeft: 5 }}>*</span>
                  </span>
                }
                name="company_name"
                rules={[
                  { required: true, message: "Missing Name" },
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
                    Industry <span style={{ color: "red" }}>*</span>
                  </span>
                }
                name="industry_type_id"
                className="input"
              >
                <Select placeholder="Select Industry">
                  {industryTypes?.data?.map((item) => {
                    return (
                      <Option value={item.id} key={item.id} title={item.type_name}>
                        {capitalizeAll(item.type_name)}
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>

              <Form.Item
                label={
                  <span>
                    Company Phone Number
                    <span style={{ color: "red", marginLeft: 5 }}>*</span>
                  </span>
                }
                name="company_phone_number"
                className="input"
                rules={[
                  { required: true, message: "Missing Phone Number" },
                  {
                    pattern: /^(07)\d{8}$/,
                    message: "Invalid Phone Number",
                  },
                ]}
              >
                <Input placeholder="07XXXXXXXX" type="text" autoComplete="off" maxLength={10} />
              </Form.Item>
              <Form.Item
                label={
                  <span>
                    Company Logo
                  </span>
                }
                name="company_logo_url"
                className="input"
              // rules={[
              //   { required: true, message: "Missing Company Logo" },

              // ]}
              >
                <div className="dragger">
                  <UploadImages
                  // setCompanyData={setCompanyData}
                  // infoUpdated={infoUpdated}
                  />
                </div>
              </Form.Item>
            </div>
            <div className="left-inputs">
              <Form.Item
                label={
                  <span>
                    Country <span style={{ color: "red" }}>*</span>
                  </span>
                }
                name="country_id"
                className="input"
              >
                <Select placeholder="Select Country">
                  {countries?.data?.map((item) => {
                    return (
                      <Option value={item.id} key={item.id} title={item.country_name}>
                        {item.country_name}
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>
              <Form.Item
                label={
                  <span>
                    Province <span style={{ color: "red" }}>*</span>
                  </span>
                }
                name="province_id"
                className="input"
              >
                <Select placeholder="Select Province">
                  {provinces?.data?.map((item) => {
                    return (
                      <Option value={item.id} key={item.id} title={item.name}>
                        {item.name}
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>
              <Form.Item
                label={
                  <span>
                    Company Email
                    <span style={{ color: "red", marginLeft: 5 }}>*</span>
                  </span>
                }
                name="company_email"
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
            </div>
          </div>
          <div className="buttons">
            <Button className="cancelButton" htmlType="submit" onClick={props?.close}>
              Cancel
            </Button>
            <Button loading={loading} className="nextButton" htmlType="submit">
              Next
            </Button>
          </div>
        </StyledAddClient>
      </Form>
    </div>
  );
}

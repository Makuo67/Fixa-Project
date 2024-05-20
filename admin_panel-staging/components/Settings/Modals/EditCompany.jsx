import { Button, Checkbox, Form, Input, Modal, notification } from "antd";
import React, { useState } from "react";
import { StyledEditor } from "./StyleEditor";
import UploadImage from "../../shared/UploadImage";
import { Icon } from "@iconify/react";
import Content from "../../Uploads/WorkerExcel.styled";
import { updateCompanyInfo } from "../../../helpers/user-profile/user-profile";
import { validateEmail, validatePhoneInput, validateTinInput } from "@/utils/regexes";

export default function EditCompanyInfo(props) {
  const [companyData, setCompanyData] = useState({
    company_name: "",
    address: "",
    tin_number: "",
    phone: "",
    email: "",
    img_url: "",
  });
  const [updateProfiledisabled, setupdateProfiledisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const regex = /^(078|079)\d{7}$/;
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  const tinRegex = /^\d{9}$/;
  const locationRegex = /^[a-zA-Z0-9\s,.'-]*$/;
  const nameRegex = /^([a-z,]+(-| )?)+$/i;

  const infoUpdated = () => {
    setupdateProfiledisabled(false);
  };
  const close = () => {
    props.setShowEdit(false);
  };

  const ModalTitle = () => (
    <StyledEditor>
      <h1 className="import modalTitle">Company Info</h1>
    </StyledEditor>
  );

  const handleNameChanged = (e) => {
    infoUpdated();
    setCompanyData((pre) => {
      return {
        ...pre,
        company_name: e.target.value,
      };
    });
  };
  const handleAddressChanged = (e) => {
    infoUpdated();
    setCompanyData((pre) => {
      return {
        ...pre,
        address: e.target.value,
      };
    });
  };

  const handleTinChanged = (e) => {
    infoUpdated();
    setCompanyData((pre) => {
      return {
        ...pre,
        tin_number: e.target.value,
      };
    });
  };
  const handlePhoneChanged = (e) => {
    infoUpdated();
    setCompanyData((pre) => {
      return {
        ...pre,
        phone: e.target.value,
      };
    });
  };
  const handleEmailChanged = (e) => {
    infoUpdated();
    setCompanyData((pre) => {
      return {
        ...pre,
        email: e.target.value,
      };
    });
  };

  const handleLogoImageChanged = (url) => {
    infoUpdated();
    setCompanyData((pre) => {
      return {
        ...pre,
        img_url: url,
      };
    });
  };

  const companyEdited = () => {
    setLoading(true);
    var data = {
      company_name: companyData.company_name,
      address: companyData.address,
      tin_number: companyData.tin_number,
      phone: companyData.phone,
      email: companyData.email,
      img_url: companyData.img_url,
    };
    if (!data.company_name) {
      data.company_name = props.companyInfo?.company_name;
    }
    if (!data.address) {
      data.address = props.companyInfo?.address;
    }
    if (!data.tin_number) {
      data.tin_number = props.companyInfo?.tin_number;
    }
    if (!data.phone) {
      data.phone = props.companyInfo?.phone;
    }
    if (!data.email) {
      data.email = props.companyInfo?.email;
    }
    if (!data.img_url) {
      data.img_url = props.companyInfo?.img_url;
    }

    updateCompanyInfo(data, props.companyInfo?.id).then((res) => {
      props?.setcompanyEdited(true);
      if (res) {
        setLoading(false);
        props.setShowEdit(false);
        notification.success({
          message: `Success!`,
          description: "Company Info updated!",
        });
      } else {
        setLoading(false);
        notification.error({
          message: "Error!",
          description: "Something went wrong",
        });
      }
    });
  };
  
  return (
    <StyledEditor>
      <Modal
        title={<ModalTitle />}
        centered
        okText="Yes"
        cancelText="No"
        open={props.showEdit}
        onOk={close}
        onCancel={close}
        // closeIcon={<Icon icon="fe:close" className="close" />}
        bodyStyle={{
          height: 520,
        }}
        width={820}
        footer={null}
      >
        <div>
          <Form
            name="form_item_path"
            layout="vertical"
            onFinish={companyEdited}
          >
            <StyledEditor>
              <div className="form flex flex-col gap-4">
                <div className="flex gap-8">
                  <Form.Item
                    label={
                      <span>
                        Company Name <span style={{ color: "red" }}>*</span>
                      </span>
                    }
                    name="last_name"
                    initialValue={props.companyInfo?.company_name}
                    rules={[
                      props.addUser
                        ? [
                          {
                            required: true,
                            message: "Missing Last Name",
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
                      defaultValue={props.companyInfo?.company_name}
                      onChange={handleNameChanged}
                      type="text"
                      autoComplete="off"
                    />
                  </Form.Item>
                  <Form.Item
                    label={
                      <span>
                        TIN <span style={{ color: "red" }}>*</span>
                      </span>
                    }
                    name="tin"
                    initialValue={props.companyInfo?.tin_number}
                    rules={[
                      { required: true, message: 'Missing TIN' },
                      { validator: validateTinInput },
                    ]}
                  >
                    <Input
                      defaultValue={props.companyInfo?.tin_number}
                      onChange={handleTinChanged}
                      type="text"
                      autoComplete="off"
                      maxLength={9}
                    />
                  </Form.Item>
                </div>
                <div className="flex gap-8">
                  <Form.Item
                    label={
                      <span>
                        Registered Address{" "}
                        <span style={{ color: "red" }}>*</span>
                      </span>
                    }
                    name="address"

                    initialValue={props.companyInfo?.address}

                    rules={[
                      { required: true, message: 'Address Required' },
                    ]}
                  >
                    <Input
                      defaultValue={props.companyInfo?.address}
                      onChange={handleAddressChanged}
                      type="text"
                      autoComplete="off"
                    />
                  </Form.Item>
                  <Form.Item
                    label={
                      <span>
                        Company Phone Number{" "}
                        <span style={{ color: "red" }}>*</span>
                      </span>
                    }
                    name="phone"
                    initialValue={props.companyInfo?.phone}
                    className=""
                    // className="input"
                    rules={[
                      { required: true, message: 'Phone number Required' },
                      { validator: validatePhoneInput },
                    ]}
                  >
                    <Input
                      defaultValue={props.companyInfo?.phone}
                      placeholder="0799999999"
                      type="text"
                      autoComplete="off"
                      onChange={handlePhoneChanged}
                      maxLength={10}
                    />
                  </Form.Item>
                </div>
                <div className="flex gap-8">
                  <Form.Item
                    label={
                      <span>
                        Company Email <span style={{ color: "red" }}>*</span>
                      </span>
                    }
                    name="email"
                    initialValue={props.companyInfo?.email}
                    rules={[
                      { required: true, message: 'Email is Required' },
                      { validator: validateEmail },
                    ]}
                  >
                    <Input
                      defaultValue={props.companyInfo?.email}
                      placeholder="johndoe@domain.com"
                      type="text"
                      autoComplete="off"
                      onChange={handleEmailChanged}
                    />
                  </Form.Item>
                  <Form.Item
                    label={
                      <span>
                        Company Logo <span style={{ color: "red" }}>*</span>
                      </span>
                    }
                    name="logo"
                  >
                    <div>
                      <UploadImage
                        setImageUrl={handleLogoImageChanged}
                        uploadText={"Click or drag image in this area to upload your company logo"}
                      />
                    </div>
                  </Form.Item>
                </div>
                <div className="flex justify-end px-16">
                  <Button
                    type="primary"
                    className="primaryBtn"
                    htmlType="submit"
                    disabled={updateProfiledisabled}
                    loading={loading}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </StyledEditor>
          </Form>
        </div>
      </Modal>
    </StyledEditor>
  );
}

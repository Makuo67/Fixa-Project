import { Button, Form, Input, Modal, Select } from "antd";
import React, { useEffect, useState } from "react";
import { StyledProfileModals } from "./profileModals.styled";
import { editWorkerProfile } from "../../../helpers/workforce/workerProfile";
import { useRouter } from "next/router";
import { isArray } from "underscore";

export default function EditContactInfo(props) {

  const router = useRouter();
  const close = () => {
    props?.setIsEditingPersonalContacts(false);
  };

  const [updateDisabled, setupdateDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const districtsList = props?.districts.map((item) => item);

  const [contactData, setContactData] = useState({
    phone_number: props?.worker?.worker_information?.worker?.phone_number,
    district: props?.worker?.worker_information?.worker?.district,
    next_of_kin: {
      first_name: '',
      last_name: '',
      phone_number: '',
      worker_id: ''
    }
  });
  const [submittedData, setSubmittedData] = useState(false);

  useEffect(() => {
    setContactData((pre) => {
      return {
        ...pre,
        next_of_kin: {
          first_name: props?.workerEdu?.next_of_kin?.map((item) => item.name?.split(' ')[0]) || '',
          last_name: props?.workerEdu?.next_of_kin?.map((item) => item.name?.split(' ')[1]) || '',
          phone_number: props?.workerEdu?.next_of_kin?.map((item) => item.phone_number)[0] || '',
          worker_id: props?.worker?.worker_information?.worker?.id || ''
        }
      };
    });
  }, [props?.workerEdu, props?.worker]);

  const phoneRegex = /^07\d{8}$/;
  const nameRegex = /^([a-z]+(-| )?)+$/i;

  const infoUpdated = () => {
    setupdateDisabled(false);
  };

  const handlePhoneChanged = (e) => {
    infoUpdated();
    setContactData((pre) => {
      return {
        ...pre,
        next_of_kin: {
          ...pre.next_of_kin,
          phone_number: e.target.value,
        },
      };
    });
  };

  const handleLastNameChanged = (e) => {
    infoUpdated();
    setContactData((pre) => {
      return {
        ...pre,
        next_of_kin: {
          ...pre.next_of_kin,
          last_name: e.target.value.toLowerCase(),
        },
      };
    });
  };

  const handleFirstNameChanged = (e) => {
    infoUpdated();
    setContactData((pre) => {
      return {
        ...pre,
        next_of_kin: {
          ...pre.next_of_kin,
          first_name: e.target.value.toLowerCase(),
        },
      };
    });
  };

  const handleWorkerPhoneChanged = (e) => {
    infoUpdated();
    setContactData((pre) => {
      return {
        ...pre,
        phone_number: e.target.value,
      };
    });
  };

  const handleDistrictNameChanged = (e) => {
    infoUpdated();
    setContactData((pre) => {
      return {
        ...pre,
        district: e,
      };
    });
  };

  const workerEdited = async () => {
    setLoading(true);

    if (contactData.next_of_kin.first_name === "") {
      setContactData((pre) => {
        return {
          ...pre,
          next_of_kin: {
            ...pre.next_of_kin,
            first_name: props?.workerEdu?.next_of_kin?.first_name.toLowerCase(),
          },
        }
      })
    }

    if (contactData.next_of_kin.worker_id === "") {
      setContactData((pre) => {
        return {
          ...pre,
          next_of_kin: {
            ...pre.next_of_kin,
            worker_id: props?.worker?.worker_information?.worker?.id
          },
        }
      })
    }


    if (contactData.next_of_kin.last_name === "") {
      setContactData((pre) => {
        return {
          ...pre,
          next_of_kin: {
            ...pre.next_of_kin,
            last_name: props?.workerEdu?.next_of_kin?.last_name.toLowerCase(),
          },
        }
      });
    }

    if (contactData.next_of_kin.phone_number === "") {
      setContactData((pre) => {
        return {
          ...pre,
          next_of_kin: {
            ...pre.next_of_kin,
            phone_number: props?.workerEdu?.next_of_kin?.phone_number,
          },
        }
      });
    }

    if (contactData.district === "") {
      setContactData((pre) => {
        return {
          ...pre,
          district: props?.worker?.worker_information?.worker?.district,
        };
      });
    }

    if (phone_number === "") {
      setContactData((pre) => {
        return {
          ...pre,
          phone_number: props?.worker?.worker_information?.worker?.phone_number,
        };
      });
    }

    editWorkerProfile(props?.worker_id, contactData).then(() => {
      setSubmittedData(true);
      setLoading(false);
    }).catch((err) => {
      console.log("ERROR In Editing contactInfo", err)
      setSubmittedData(false);
      props?.setLoader(false);
      setLoading(false);
    });
  };

  // useEffect for loading the outside props
  useEffect(() => {
    if (submittedData) {
      props?.setAssessmentSubmitted(true)
      props?.setPersonalDetailsLoader(true);
      props?.setLoader(true);
    }

    return () => {
      setSubmittedData(false);
      props?.setPersonalDetailsLoader(false);
      props?.setLoader(false);
    }

  }, [submittedData]);

  return (
    <StyledProfileModals>
      <Modal
        title="Edit Contact Details"
        open={props?.isEditingPersonalContacts}
        okText="Edit"
        onCancel={() => {
          props?.setIsEditingPersonalContacts(false);
        }}
        footer={null}
      >
        <Form
          labelCol={{
            span: 7,
            offset: 2,
          }}
          wrapperCol={{
            span: 15,
            offset: 1,
          }}
          layout="horizontal"
          size={"middle"}
          onFinish={workerEdited}
          autoComplete="off"
        >
          <StyledProfileModals>
            <Form.Item label="Address">
              <Select
                value={contactData.district}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.label.includes(
                    input.charAt(0).toUpperCase() + input.slice(1).toLowerCase()
                  )
                }
                filterSort={(optionA, optionB) =>
                  optionA.label
                    .toLowerCase()
                    .localeCompare(optionB.label.toLowerCase())
                }
                onSelect={(value) => {
                  handleDistrictNameChanged(value);
                }}
                options={(districtsList || []).map((d) => ({
                  value: d.name,
                  label: d.name,
                }))}
              />
            </Form.Item>
            <Form.Item
              label="Phone Number"
              name="phone"
              initialValue={props?.worker?.worker_information?.worker?.phone_number ?
                props?.worker?.worker_information?.worker?.phone_number :
                "-"
              }
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
                value={contactData.phone_number}
                onChange={(e) => {
                  handleWorkerPhoneChanged(e);
                }}
                type="text"
                autoComplete="off"
                disabled={props?.is_momo_verified_and_rssb === "green"}
              />
            </Form.Item>
            <p
              style={{
                marginLeft: "60px",
                fontWeight: "700",
                color: "#3498db",
              }}
            >
              Emergency contact Person
            </p>
            {/* {console.log("PROPS",props?.workerEdu, props?.workerEdu?.next_of_kin?.every(item => item.name === null ))} */}
            <Form.Item
              label="First Name"
              name="first_name"
              className="input"
              initialValue={isArray(props?.workerEdu?.next_of_kin) && props?.workerEdu?.next_of_kin?.every(item => item?.name === null ) ? props?.workerEdu?.next_of_kin?.map((item) => item?.name?.split(" ")[0])
                : ""
              }
              rules={[
                {
                  validator(rule, value) {
                    return new Promise((resolve, reject) => {
                      if (value !== "" && value?.length !== 0) {
                        if (nameRegex.test(value)) {
                          resolve();
                        } else {
                          reject("Invalid Name");
                        }
                      } else {
                        resolve();
                      }
                    });
                  },
                },
              ]}
            >
              <Input
                onChange={handleFirstNameChanged}
                type="text"
                autoComplete="off"
              />
            </Form.Item>
            <Form.Item
              label="Last Name"
              name="last_name"
              initialValue={isArray(props?.workerEdu?.next_of_kin) && props?.workerEdu?.next_of_kin?.every(item => item?.name === null ) ? props?.workerEdu?.next_of_kin?.map((item) => item?.name?.split(" ")[1])
                : ""
              }
              className="input"
              rules={[
                {
                  validator(rule, value) {
                    return new Promise((resolve, reject) => {
                      if (value !== "" && value?.length !== 0) {
                        if (nameRegex.test(value)) {
                          resolve();
                        } else {
                          reject("Invalid Name");
                        }
                      } else {
                        resolve();
                      }
                    });
                  },
                },
              ]}
            >
              <Input
                onChange={handleLastNameChanged}
                type="text"
                autoComplete="off"
              />
            </Form.Item>

            <Form.Item
              label="Phone Number"
              name="phone_number"
              initialValue={isArray(props?.workerEdu?.next_of_kin) ? props?.workerEdu?.next_of_kin?.map((item) => item?.phone_number)[0]
                : ""
              }
              className="input"
              rules={[
                {
                  validator(rule, value) {
                    return new Promise((resolve, reject) => {
                      if (value !== "") {
                        if (phoneRegex.test(value) || typeof value === "undefined") {
                          resolve();
                        } else {
                          reject("Invalid Phone Number");
                        }
                      } else {
                        resolve();
                      }
                    });
                  },
                },
              ]}
            >
              <Input
                value={contactData.next_of_kin.phone_number}
                onChange={handlePhoneChanged}
                type="text"
                autoComplete="off"
              />
            </Form.Item>

            <div
              className="flex gap-4 items-start justify-center py-2"
            >
              <Button type="secondary" className="secondaryBtn" onClick={close}>
                Cancel
              </Button>
              <Button
                className="primaryBtn"
                type="primary"
                htmlType="submit"
                disabled={updateDisabled}
                loading={loading}
              >
                Save
              </Button>
            </div>
          </StyledProfileModals>
        </Form>
      </Modal>
    </StyledProfileModals>
  );
}

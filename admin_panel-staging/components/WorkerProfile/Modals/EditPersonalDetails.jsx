import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  message,
  notification,
} from "antd";
import React, { useEffect, useRef, useState } from "react";
import moment from "moment";
import { PlusOutlined } from '@ant-design/icons';

import { StyledProfileModals } from "./profileModals.styled";
import { editWorkerProfile } from "../../../helpers/workforce/workerProfile";
import { useDispatch } from "react-redux";
import { addService } from "../../../redux/actions/services.actions";
import { getServices } from "../../../redux/actions/workforce.actions";
import { useRouter } from "next/router";
import { rssbCodeValidation } from "@/utils/regexes";

export default function EditPersonalDetails(props) {
  const dateFormat = "YYYY-MM-DD";
  const { Option } = Select;
  const disabledDate = (current) => {
    return current && current.valueOf() > Date.now();
  };

  const close = () => {
    props?.setIsEditingPersonalDetails(false);
  };

  const [updateDisabled, setupdateDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [workerData, setWorkerData] = useState({
    nid: "",
    firstname: "",
    lastname: "",
    dob: "",
    rssb_number: "",
    services: [
      {
        id: "",
        "assigned_worker_id": "",
        "daily_rate": ""
      }
    ]
  });
  const [submittedData, setSubmittedData] = useState(false);
  const [serviceName, setServiceName] = useState(null);
  const [serviceModal, setServiceModal] = useState(false);
  const serviceNameRef = useRef(null);

  const dispatch = useDispatch();
  const router = useRouter();

  //Fixing Props not being set at the start
  useEffect(() => {
    if (props.worker?.worker_information?.worker) {
      setWorkerData((pre) => {
        return {
          ...pre,
          dob: props.worker?.worker_information?.worker?.date_of_birth,
          nid: props.worker?.worker_information?.worker?.nid_number,
          firstname: props.worker?.worker_information?.worker?.first_name,
          lastname: props.worker?.worker_information?.worker?.last_name,
          rssb_number: props.worker?.worker_information?.worker?.rssb_number
        };
      });
      if (props.worker?.worker_information?.worker_rates?.current) {
        setWorkerData((pre) => {
          return {
            ...pre,
            services: [
              {
                ...pre.services[0],
                id: props.worker?.worker_information?.worker_rates?.current?.service_id,
                assigned_worker_id: props.worker?.worker_information?.worker_rates?.current?.assigned_worker_id,
                daily_rate: props.worker?.worker_information?.worker_rates?.current?.value
              },
            ],
          };
        });
      }
    }
  }, [props]);

  // console.log("worker data ===>", workerData);

  const nidRegex = /^\d{16}$/;
  // const nameRegex = /^([a-z]+(-|'|é|ï| )?)+$/i;
  const nameRegex = /^([a-zA-ZÀ-ÿ'-]+(-| |é|ï)?)+$/i;

  function getYearDiff(date1, date2) {
    return Math.abs(date2.getFullYear() - date1.getFullYear());
  }
  const todaysDate = () => {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, "0");
    var mm = String(today.getMonth() + 1).padStart(2, "0");
    var yyyy = today.getFullYear();

    today = yyyy + "-" + mm + "-" + dd;
    return today;
  };
  const infoUpdated = () => {
    setupdateDisabled(false);
  };

  const handleNidChanged = (e) => {
    infoUpdated();
    setWorkerData((pre) => {
      return {
        ...pre,
        nid: e.target.value,
      };
    });
  };
  const handleLastNameChanged = (e) => {
    infoUpdated();
    setWorkerData((pre) => {
      return {
        ...pre,
        lastname: e.target.value.toLowerCase(),
      };
    });
  };

  const handleFirstNameChanged = (e) => {
    infoUpdated();
    setWorkerData((pre) => {
      return {
        ...pre,
        firstname: e.target.value.toLowerCase(),
      };
    });
  };

  const handleServiceChanged = (e) => {
    const service = props?.trades.find((element) => element.name === e);

    infoUpdated();
    setWorkerData((pre) => {
      return {
        ...pre,
        services: [
          {
            ...pre.services[0],
            id: service.id,
          },
        ],
      };
    });
  };

  const handleServiceRateChanged = (e) => {
    infoUpdated();
    setWorkerData((pre) => {
      return {
        ...pre,
        services: [
          {
            ...pre.services[0],
            daily_rate: e,
          },
        ],
      };
    });
  };

  const handleRssbNumber = (e) => {
    infoUpdated();
    setWorkerData((pre) => {
      return {
        ...pre,
        rssb_number: e.target.value,
      };
    });
  };

  const dateChanged = (date, dateString) => {
    const bd = `${dateString}`;
    const dt = todaysDate();
    if (getYearDiff(new Date(dateString), new Date(dt)) < 18) {
      notification.error({
        message: "Error",
        description: `Employee can't be less than 18 years`,
      });
    } else {
      infoUpdated();
      setWorkerData((pre) => {
        return {
          ...pre,
          dob: dateString,
        };
      });
    }
  };

  const workerEdited = async () => {
    setLoading(true);
    let data = {};

    if (workerData.nid !== "") {
      data.nid_number = workerData.nid;
    }
    if (workerData.firstname !== "") {
      data.first_name = workerData.firstname;
    }

    if (workerData?.lastname !== "") {
      data.last_name = workerData?.lastname;
    }

    if (workerData.dob !== "") {
      data.date_of_birth = workerData?.dob;
    }
    if (workerData.rssb_number !== "") {
      data.rssb_code = workerData?.rssb_number;
    }

    if (workerData.services[0].id !== "" && workerData.services[0].daily_rate !== "") {
      data.services = [
        {
          id: workerData.services[0].id,
          assigned_worker_id: workerData.services[0].assigned_worker_id,
          daily_rate: workerData.services[0].daily_rate,
        },
      ];
    }

    editWorkerProfile(props?.worker_id, data).then((res) => {
      setSubmittedData(true);
      setLoading(false);
    }).catch((err) => {
      setSubmittedData(false);
      props.setLoader(false);
      setLoading(false);
    });
  };

  // useEffect for loading the outside props
  useEffect(() => {
    if (submittedData) {
      props.setAssessmentSubmitted(true)
      props.setPersonalDetailsLoader(true);
      props.setLoader(true);
    }


    return () => {
      setSubmittedData(false);
      props.setPersonalDetailsLoader(false);
      props.setLoader(false);
    }

  }, [submittedData]);

  // RSSB Validator
  const onSearchChange = (value) => {
    setServiceName(value);
  }
  const onSaveService = () => {
    serviceNameRef.current = serviceName;
    setServiceModal(true)
  }

  const handleAddService = () => {
    setLoading(true)
    const payload = {
      "name": serviceNameRef.current,
      "icon_class": null,
      "service_status": "on",
      "locale": "en",
      "published_at": moment(),
      "created_at": moment(),
      "updated_at": moment(),
      "localizations": []
    }
    dispatch(addService(payload)).then(() => {
      setLoading(false);
      dispatch(getServices());
      message.success(`Created service ${serviceNameRef.current} successfully`);
    })
    setServiceModal(false);
  };
  const handleCancel = () => {
    setServiceModal(false);
  };

  return (
    <div>
      {" "}
      <Modal
        title="Edit Personal Details"
        okText="Edit"
        open={props?.isEditingPersonalDetails}
        onCancel={close}
        footer={null}
      >
        <Form
          labelCol={{
            span: 5,
            offset: 2,
          }}
          wrapperCol={{
            span: 15,
            offset: 1,
          }}
          layout="horizontal"
          size={"middle"}
          onFinish={workerEdited}
        >
          <StyledProfileModals>
            <Form.Item
              label="NID"
              name="nid"
              initialValue={props.worker?.worker_information?.worker?.nid_number}
              className="input"
              rules={[
                {
                  validator(rule, value) {
                    return new Promise((resolve, reject) => {
                      if (value !== "") {
                        if (
                          nidRegex.test(value) || /^[A-Za-z]+\d+$/.test(value) ||
                          typeof value === "undefined"
                        ) {
                          resolve();
                        } else {
                          reject("Invalid NID");
                        }
                      } else {
                        reject("Missing NID");
                      }
                    });
                  },
                },
              ]}
            >
              <Input
                value={workerData.nid}
                onChange={handleNidChanged}
                type="text"
                autoComplete="off"
                disabled={props.is_rssb_verified === "green" && workerData.nid !== ""}
              />
            </Form.Item>

            <Form.Item
              label="First Name"
              name="first_name"
              initialValue={props.worker?.worker_information?.worker?.first_name}
              className="input"
              rules={[
                {
                  validator(rule, value) {
                    return new Promise((resolve, reject) => {
                      if (value !== "") {
                        // resolve();
                        if (nameRegex.test(value)) {
                          resolve();
                        } else {
                          console.log(": Regexed firstname", nameRegex.test(value));
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
                value={workerData.firstname}
                onChange={handleFirstNameChanged}
                type="text"
                autoComplete="off"
                disabled={props.is_rssb_verified === "green" && workerData.firstname !== ""}
              />
            </Form.Item>

            <Form.Item
              label="Last Name"
              name="last_name"
              initialValue={props.worker?.worker_information?.worker?.last_name}
              className="input"
              rules={[
                {
                  validator(rule, value) {
                    return new Promise((resolve, reject) => {
                      if (value !== "") {
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
                value={workerData.lastname}
                onChange={handleLastNameChanged}
                type="text"
                autoComplete="off"
                disabled={props.is_rssb_verified === "green" && workerData.lastname !== ""}
              />
            </Form.Item>

            <Form.Item
              label="Date of Birth"
              initialValue={props.worker?.worker_information?.worker?.date_of_birth}
            >
              <DatePicker
                format={dateFormat}
                value={workerData.dob ? moment(workerData.dob) : ""}
                disabledDate={disabledDate}
                onChange={dateChanged}
                disabled={props.is_rssb_verified === "green" && workerData.dob !== ""}
              />
            </Form.Item>

            {/* RSSB Number */}
            <Form.Item
              label="RSSB Code"
              name="rssbNumber"
              initialValue={props.worker?.worker_information?.worker?.rssb_number}
              rules={[
                { required: false },
                { validator: rssbCodeValidation },
              ]}
            >
              <Input
                value={workerData.rssb_number}
                onChange={handleRssbNumber}
                type="text"
                maxLength={9}
                autoComplete="off" />
            </Form.Item>

            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "5px",
                width: "100%",
                marginLeft: "50px",
              }}
            >
              <Form.Item
                label="Service"
                labelCol={{ span: 9 }} // Customize the width of the label column
                wrapperCol={{ span: 17 }} // Customize the width of the input/control column
                initialValue={props.worker?.worker_information?.worker_rates?.current?.service_id}
                style={{ display: "flex", flexDirection: "row", width: "280px" }}>
                <Select
                  style={{
                    width: "160px",
                    marginLeft: "18px",
                    textTransform: "capitalize",
                  }}
                  value={props.trades.find(item => item.id === workerData.services[0].id)?.name}
                  onSelect={(value) => {
                    handleServiceChanged(value);
                  }}
                  showSearch
                  placeholder="Search to Select"
                  optionFilterProp="children"
                  onSearch={onSearchChange}
                  filterOption={(input, option) => option.children.toLowerCase().includes(input?.toLowerCase())}
                  filterSort={(optionA, optionB) =>
                    optionA.children.toLowerCase().localeCompare(optionB.children.toLowerCase())
                  }
                  notFoundContent={
                    <Popconfirm
                      title={<p
                        style={{
                          fontSize: "16px",
                        }}
                      >
                        Are you sure you want to create new service:
                        <span style={{
                          fontSize: "18px",
                          fontWeight: "800",
                        }}>{serviceNameRef.current}</span>
                      </p>
                      }
                      onConfirm={() => handleAddService()}
                      onCancel={handleCancel}
                      okText="Yes"
                      cancelText="No"
                      open={serviceModal}
                      okButtonProps={{
                        loading: loading,
                        style: {
                          width: "fit-content",
                          height: "30px",
                          fontSize: "16px",
                          borderRadius: "4px",
                          border: "none",
                          fontWeight: "800",
                          color: "white",
                          backgroundColor: "var(--primary)",
                        },
                      }}
                      cancelButtonProps={{
                        style: {
                          width: "fit-content",
                          height: "30px",
                          fontSize: "16px",
                          borderRadius: "4px",
                          border: "1px solid var(--primary)",
                          // fontWeight: "800",
                          color: "var(--button-color)",
                          backgroundColor: "var(--white)",
                        }
                      }}
                    >
                      <Button onClick={onSaveService}
                        style={{
                          width: "fit-content",
                          height: "40px",
                          fontSize: "16px",
                          borderRadius: "4px",
                          border: "none",
                          fontWeight: "800",
                          color: "var(--black",
                          // backgroundColor: "var(--primary)",
                        }}>
                        <PlusOutlined style={{ marginRight: "5px" }} />
                        <span>
                          Add new
                        </span>
                      </Button>
                    </Popconfirm>
                  }
                >
                  {props?.trades?.map((item) => {
                    return (
                      <Option value={item.name} key={item.id} title={item.name} style={{ textTransform: "capitalize" }}>
                        {item.name}
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>
              <Form.Item>
                <InputNumber style={{ width: "100px" }}
                  disabled={false}
                  keyboard={false}
                  controls={false}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  min={0}
                  step={1}
                  defaultValue={
                    props.worker?.worker_information?.worker_rates?.current
                      ? props.worker?.worker_information?.worker_rates?.current.value
                      : 0
                  }
                  onChange={handleServiceRateChanged}
                />
              </Form.Item>
            </div>
            <div
              className="flex gap-4 items-start justify-center py-2"
            >
              <Button className="secondaryBtn" type="secondary" onClick={close}>
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
    </div>
  );
}

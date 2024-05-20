import {
  Button,
  Form,
  Input,
  Select,
  Checkbox,
  DatePicker,
  message,
} from "antd";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";

import Content from "../../Uploads/WorkerExcel.styled";
import { StyledProjectModals } from "./StyledProjectModals.styled";
import { getDistricts } from "../../../redux/actions/workforce.actions";
import { capitalize } from "../../../helpers/capitalize";
import {
  createProject,
  editProject,
  getClients,
  getActiveClients,
  getClientsUsers,
  getFixaManagers,
  extractShiftIds,
} from "../../../helpers/projects/projects";
import DynamicDragger from "../../FileUpload/DynamicDragger";
import { StyledModal } from "../Modal.styled";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";

const ModalTitle = ({ type }) => (
  <Content>
    {type === "New Project" ? (
      <h1 className="import" style={{ margin: 0 }}>
        New Project
      </h1>
    ) : (
      <h1 className="import" style={{ margin: 0 }}>
        Edit Project
      </h1>
    )}
  </Content>
);

const NewProjectContent = ({
  handleCancel,
  edit,
  handleOk,
  projectInfo,
  setProjectUpdate,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { districts } = useSelector((state) => state.workforce.filters);
  const [clients, setClients] = useState([]);
  const [clientUsers, setClientUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [newClientId, setNewClientId] = useState(null);
  const [newProject, setNewProject] = useState({
    name: "",
    status: "not_started",
    project_profile_url: "",
    client_id: "",
    company_project_manager: "",
    client_project_manager: "",
    address: "",
    start_date: "",
    end_date: "",
    shifts: [],
  });
  const [existingProject, setExistingProject] = useState({
    name: projectInfo?.name,
    progress_status: projectInfo?.status,
    project_profile_url: projectInfo?.project_profile_url,
    client: projectInfo?.client?.id,
    company_project_manager:
      projectInfo?.company_project_manager?.id,
    // client_project_manager: projectInfo?.client_project_manager.id,
    address: projectInfo?.location,
    start_date: dayjs(projectInfo?.start_date),
    end_date: dayjs(projectInfo?.end_date),
    shifts: extractShiftIds(projectInfo?.shifts),
  });
  const [open, setOpen] = useState(false);
  const [clientManagers, setClientManagers] = useState([]);
  const dispatch = useDispatch();
  const [openClientModal, setOpenClientModal] = useState(false);
  const [nextClientId, setNextClientId] = useState(-1);
  const { companyStatus } = useUserAccess();
  const { is_staffing } = companyStatus


  const getModalData = useCallback(() => {
    dispatch(getDistricts());
    getActiveClients().then((res) => {
      setClients(res);
      if (res.length > 0) {
        setNextClientId(res[res.length - 1].id + 1)
      }
    });
    getClientsUsers().then((res) => {
      setClientUsers(res.data);
    });
    getFixaManagers().then((res) => {
      setManagers(res.data);
    });
  }, []);

  useEffect(() => {
    getModalData();
  }, []);

  const [form] = Form.useForm();
  const { Option } = Select;

  const onFinish = (values) => {
    setLoading(true);
    const payloadData = {};
    Object.assign(payloadData, values);
    if (values.start_date && typeof values.start_date === "object") {
      payloadData.start_date = values.start_date.format("YYYY-MM-DD");
    }
    if (values.end_date && typeof values.end_date === "object") {
      payloadData.end_date = values.end_date.format("YYYY-MM-DD");
    }
    createProject(payloadData).then(() => {
      setLoading(false);
      setProjectUpdate(true);
      handleOk();
    });
  };

  // Handling the edit
  const onFinishEdit = (id, values) => {
    setLoading(true);
    const payloadData = {};
    Object.assign(payloadData, values);
    if (values.start_date && typeof values.start_date === "object") {
      payloadData.start_date = values.start_date.format("YYYY-MM-DD");
    }
    if (values.end_date && typeof values.end_date === "object") {
      payloadData.end_date = values.end_date.format("YYYY-MM-DD");
    }

    editProject(id, payloadData)
      .then(() => {
        router.replace({
          pathname: `/projects/${values.name}`,
          query: { id: id, tab: router.query.tab }
        })
        handleOk();
      })
      .catch((err) => {
        console.log("error happened in edit ==>", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // handle switching managers per project
  const handleSwitchManagers = (id, managers) => {
    return managers.filter(
      (manager) => manager.client_id && manager.client_id.id === id
    );
  };

  /*  Controlling the clients and their managers  */
  useEffect(() => {
    //setting the default managers depending on client name
    if (edit) {
      setClientManagers(
        handleSwitchManagers(existingProject.client, clientUsers)
      );
    }
  }, [clients, clientUsers, existingProject.client, edit]);

  const handleClientChange = (value) => {
    setExistingProject((pre) => {
      return { ...pre, client: value, client_project_manager: "" };
    });
    setClientManagers(handleSwitchManagers(value, clientUsers));
    form.setFieldsValue({
      client_project_manager: "",
    });
  };

  // custom checkbox validation
  const checkBoxValidation = () => {
    const checked = edit ? existingProject.shifts.length > 0 : newProject.shifts.length > 0;
    if (checked) {
      return Promise.resolve();
    } else {
      return Promise.reject(
        new Error("Shift is required.")
      )
    }
  };

  const SHIFT_OPTIONS = [
    {
      label: "Day",
      value: 1,
    },
    {
      label: "Night",
      value: 2,
    },
  ];

  return (
    <>
      <StyledProjectModals>
        <div className="projectModalContainer">
          <Form
            initialValues={edit ? existingProject : newProject}
            name="form_item_path"
            layout="vertical"
            form={form}
            onFinish={(vals) => {
              edit
                ? onFinishEdit(projectInfo.id, { ...existingProject })
                : onFinish(newProject);
            }}
            requiredMark={false}
            autoComplete="off"
            className="space-y-11"
          >
            <div className="formContainer">
              {/*  ==== LEFT SECTION ====  */}
              <div className="rightLeftSection">
                <Form.Item
                  label={
                    <h3>
                      Project Name
                      <span style={{ color: "red", marginLeft: 5 }}>{edit ? "" : "*"}</span>
                    </h3>
                  }
                  name="name"
                  rules={[
                    { required: true, message: "Project name is required" },
                    {
                      // pattern: /^[A-Za-z0-9-\s]+$/,
                      message: "Invalid Project Name",
                    },
                  ]}
                >
                  <Input
                    placeholder="Project Name"
                    type="text"
                    autoComplete="off"
                    className="modelInput"
                    defaultValue={edit ? existingProject.name : newProject.name}
                    value={edit ? existingProject.name : newProject.name}
                    onChange={(e) => {
                      edit
                        ? setExistingProject((pre) => {
                          return { ...pre, name: e.target.value.toLowerCase() };
                        })
                        : setNewProject((pre) => {
                          return { ...pre, name: e.target.value.toLowerCase() };
                        });
                    }}
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <h3>
                      Start Date <span style={{ color: "red" }}>{edit ? "" : "*"}</span>
                    </h3>
                  }
                  name="start_date"
                  rules={[
                    { required: true, message: "Start date is required" },
                  ]}
                >
                  <DatePicker
                    defaultValue={edit ? dayjs(projectInfo?.start_date) : ""}
                    format={"DD/MM/YYYY"}
                    className="modelInput"
                    value={
                      edit ? dayjs(existingProject.start_date).format('DD/MM/YYYY') : newProject.start_date
                    }
                    onChange={(date, _) => {
                      edit
                        ? setExistingProject((pre) => {
                          return {
                            ...pre,
                            start_date: `${dayjs(date).format(
                              "YYYY-MM-DD"
                            )}`,
                          };
                        })
                        : setNewProject((pre) => {
                          return {
                            ...pre,
                            start_date: `${dayjs(date).format(
                              "YYYY-MM-DD"
                            )}`,
                          };
                        });
                    }}
                  />
                </Form.Item>
                <div className="shiftsPart">
                  <h2>Shifts <span style={{ color: "red" }}>{edit ? "" : "*"}</span></h2>
                  <Form.Item name="shifts"
                    rules={[{ validator: checkBoxValidation }]}
                    validateTrigger={['onChange', 'onBlur']}
                  >
                    <div className="shifts">
                      <Checkbox.Group
                        value={edit ? existingProject.shifts : newProject.shifts}
                        options={SHIFT_OPTIONS}
                        onChange={(value) => {
                          edit
                            ? setExistingProject((pre) => {
                              return { ...pre, shifts: value };
                            })
                            :
                            setNewProject((pre) => {
                              return { ...pre, shifts: value };
                            });
                        }}
                      />
                    </div>
                  </Form.Item>
                </div>
              </div>

              {/*  ==== RIGHT SECTION ====  */}
              <div className="rightLeftSection">
                <Form.Item
                  label={<h3>Location - District</h3>}
                  name="address"
                  className="input"
                >
                  <Select
                    className="modelInput"
                    placeholder="Select District"
                    style={{ border: "none", borderRadius: "8px" }}
                    defaultValue={edit ? projectInfo?.location : ""}
                    onChange={(value) => {
                      edit
                        ? setExistingProject((pre) => {
                          return { ...pre, address: value };
                        })
                        : setNewProject((pre) => {
                          return { ...pre, address: value };
                        });
                    }}
                  >
                    {districts?.map((item, i) => (
                      <Option key={i} value={item.name}>
                        {item.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label={<h3>Estimated End Date</h3>} name="end_date">
                  <DatePicker
                    defaultValue={edit ? projectInfo?.end_date : ""}
                    format={"DD/MM/YYYY"}
                    className="modelInput"
                    value={
                      edit ? existingProject.end_date : newProject.end_date
                    }
                    onChange={(date, _) => {
                      edit
                        ? setExistingProject((pre) => {
                          return {
                            ...pre,
                            end_date: `${dayjs(date).format("YYYY-MM-DD")}`,
                          };
                        })
                        : setNewProject((pre) => {
                          return {
                            ...pre,
                            end_date: `${dayjs(date).format("YYYY-MM-DD")}`,
                          };
                        });
                    }}
                  />
                </Form.Item>
                {is_staffing && <Form.Item
                  label={
                    <h3>
                      Client
                      <span style={{ color: "red", marginLeft: 5 }}>{edit ? "" : "*"}</span>
                    </h3>
                  }
                  name="client"
                  rules={[
                    {
                      required: true,
                      message: "Client is required",
                    },
                  ]}
                  initialValue={edit ? existingProject.client : ""}
                >
                  <Select
                    placeholder="Select"
                    defaultValue={
                      edit ? existingProject.client : ""
                    }
                    className="modelInput"
                    onChange={(value) => {
                      edit
                        ? setExistingProject((pre) => {
                          return { ...pre, client_id: value };
                        })
                        : setNewProject((pre) => {
                          return { ...pre, client_id: value };
                        });
                    }}
                  >
                    {clients?.map((item, i) => (
                      <Option key={i} value={item.id}>
                        {capitalize(item?.name)}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>}

                {edit && <Form.Item
                  label={edit ? <h3>Status</h3> : " "}
                  name={edit ? "progress_status" : "status"}
                >
                  {edit && (
                    <Select
                      value={existingProject.progress_status}
                      className="modelInput"
                      options={[
                        {
                          value: "not_started",
                          label: "Not started",
                        },
                        {
                          value: "ongoing",
                          label: "On Going",
                        },
                        {
                          value: "onhold",
                          label: "On Hold",
                        },
                        {
                          value: "completed",
                          label: "Completed",
                        },
                      ]}
                      onChange={(value) => {
                        setExistingProject((pre) => {
                          return { ...pre, progress_status: value };
                        });
                      }}
                    ></Select>
                  )}
                </Form.Item>}
                <div className="lowerPartLeftSection"
                  style={{ top: edit ? '0px' : '0px' }}
                >
                  <Form.Item
                    label={<h2>Project Logo</h2>}
                    name="project_profile_url"
                    rule={[
                      { required: true, message: "Project logo is required" },
                    ]}
                  >
                    <div className="dragger">
                      <DynamicDragger
                        draggerProps={{
                          maxCount: 1,
                          beforeUpload: (file) => {
                            const isJpgOrPng =
                              file.type === "image/jpeg" ||
                              file.type === "image/png";
                            if (!isJpgOrPng) {
                              message.error(
                                "You can only upload JPG or PNG files!"
                              );
                            }
                            const isLt2M = file.size / 1024 ** 2 < 2;
                            if (!isLt2M) {
                              message.error("Image must smaller than 2MB!");
                            }
                            return isJpgOrPng && isLt2M;
                          },
                        }}
                        setFields={(res) =>
                          edit
                            ? setExistingProject((pre) => {
                              return {
                                ...pre,
                                project_profile_url: res.Location,
                              };
                            })
                            : setNewProject((pre) => {
                              return {
                                ...pre,
                                project_profile_url: res.Location,
                              };
                            })
                        }
                        text="Click or drag single file in this area to upload"
                        hint="Upload Logo (JPG/PNG)"
                        extraUploadParams={{ ACL: "public-read-write" }}
                      />
                    </div>
                  </Form.Item>
                </div>
              </div>
            </div>

            <div className="buttonsSection">
              <Button type="secondary" className="secondaryBtn" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                loading={loading}
                type="primary"
                className="primaryBtn"
                htmlType="submit"
              >
                Save Project
              </Button>
            </div>
          </Form>
        </div >
      </StyledProjectModals >
      {/* <AddClient
        getModalData={getModalData}
        addClient={openClientModal}
        setOpenClientModal={setOpenClientModal}
      /> */}
    </>
  );
};

const ProjectModals = ({
  show,
  type,
  handleCancel,
  handleOk,
  projectInfo,
  setProjectUpdate,
  newProject,
}) => {
  if (show) {
    return (
      <StyledModal
        title={<ModalTitle type={type} />}
        okText="Next"
        open={show}
        onOk={handleOk}
        onCancel={handleCancel}
        width={800}
        // height={850}
        styles={{
          body: {
            height: "fit-content"
          }
        }}
        footer={null}
      // closeIcon={<Icon icon="fe:close" className="close" />}
      >
        {type === "New Project" || newProject === true ? (
          <NewProjectContent
            handleCancel={handleCancel}
            edit={false}
            handleOk={handleOk}
            setProjectUpdate={setProjectUpdate}
          />
        ) : (
          <NewProjectContent
            handleCancel={handleCancel}
            edit={true}
            handleOk={handleOk}
            projectInfo={projectInfo}
          />
        )}
      </StyledModal>
    );
  }
};

export default ProjectModals;
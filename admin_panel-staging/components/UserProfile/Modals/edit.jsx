import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  message,
  notification,
} from "antd";
import React, { useContext, useEffect, useState } from "react";
import { StyledEditUserProfile } from "./StyledModals";
import { Icon } from "@iconify/react";
import StyledEditor from "../../Settings/Modals/StyleEditor";
import { capitalize } from "../../../helpers/excelRegister";
import {
  inviteUser,
  updateProfile,
} from "../../../helpers/user-profile/user-profile";
import { useRouter } from "next/router";
import { images } from "../../Avatars/Avatars";
import { PusherContext } from "../../../context/PusherContext";
import localforage from "localforage";
import { changePhoneNumber, setUserJobTitle } from "../../../helpers/auth";
import { getAccessLevels, submitJobTitle } from "../../../helpers/settings/settings";
import { capitalizeAll } from "../../../helpers/capitalize";
import AccessCard from "@/components/Cards/AccessCard";
import { ConfirmationModal, accessLevels } from "@/components/Modals/AddStaffModel";
import { extractAccessId, getDefaultLevelAccess } from "@/utils/accessLevels";
import { getActiveClients } from "@/helpers/projects/projects";
import _ from "underscore";
import OnboardSteps from "@/components/Onboarding/OnboardSteps";
import SettingsAccess from "@/components/Settings/SettingsAccess";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import { validateEmail, validatePhoneInput } from "@/utils/regexes";

const { Option } = Select;

export const userInviteSteps = [
  {
    title: <span className='stepTitle text-primary'>User Information</span>,
  },
  {
    title: <span className='stepTitle text-primary'>User Access</span>,
  },
];

export default function EditWorkerInfo(props) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [userData, setuserData] = useState({
    firstname: props?.userInfo?.firstname ? props?.userInfo?.firstname : '',
    job_title: props?.userInfo?.title_id ? props?.userInfo?.title_id : '',
    settings: false,
    avatar_url: props?.userInfo?.avatar_url ? props?.userInfo?.avatar_url : '',
    lastname: props?.userInfo?.lastname ? props?.userInfo?.lastname : '',
    username: props?.userInfo?.username ? props?.userInfo?.username : '',
    email: props?.userInfo?.email ? props?.userInfo?.email : '',
    isActive: true,
    // TODO: these access to be removed
    client: props?.userInfo?.client ? props?.userInfo?.client : "",
    // "payment_view": props?.userInfo?.payment_view ? props?.userInfo?.payment_view : false,
    // "payment_edit": props?.userInfo?.payment_edit ? props?.userInfo?.payment_edit : false,
    // "project_view": props?.userInfo?.project_view ? props?.userInfo?.project_view : false,
    // "project_edit": props?.userInfo?.project_edit ? props?.userInfo?.project_edit : false,
    // "workforce_view": props?.userInfo?.workforce_view ? props?.userInfo?.workforce_view : false,
    // "workforce_edit": props?.userInfo?.workforce_edit ? props?.userInfo?.workforce_edit : false,
    // "attendance_view": props?.userInfo?.attendance_view ? props?.userInfo?.attendance_view : false,
    // "attendance_edit": props?.userInfo?.attendance_edit ? props?.userInfo?.attendance_edit : false,
    // "attendance_approve": props?.userInfo?.attendance_approve ? props?.userInfo?.attendance_approve : false,
    // "settings_edit": props?.userInfo?.settings_edit ? props?.userInfo?.settings_edit : false,
    // "settings_view": props?.userInfo?.settings_view ? props?.userInfo?.settings_view : false,
    "company_name": '',
    "user_access": props?.userInfo?.user_access ? props?.userInfo?.user_access : [],
  });

  const [updateProfiledisabled, setupdateProfiledisabled] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  // const [editClicked, setEditClicked] = useState(false);
  // const [viewClicked, setViewClicked] = useState(false);
  // const [value, setValue] = useState(1);
  const regex = /^(078|079|072|073)\d{7}$/;
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  const nameRegex = /^([a-z]+(-| )?)+$/i;
  const [loggedInUserId, setLoggedInUserId] = useState(null);

  const [newJobTitle, setNewJobTitle] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  // access
  const [accessSelected, setAccessSelected] = useState(null);
  const [resetStateCount, setResetStateCount] = useState(0);
  const [clients, setClients] = useState([])
  const { profileData, setProfileData } = useContext(PusherContext);
  const [userInviteStep, setUserInviteStep] = useState(0);
  const [levels, setLevels] = useState([{ "id": 1, "name": "level_1" }, { "id": 2, "name": "level_2" }]);
  const [inviteLevel, setInviteLevel] = useState("");
  const [userLevel, setUserLevel] = useState({
    id: null,
    level: ''
  });

  // handle user levels
  useEffect(() => {
    if (props?.userInfo && props?.userInfo?.user_level) {
      setUserLevel({
        id: props?.userInfo?.user_level?.id,
        level: props?.userInfo?.user_level?.name
      })

    }
  }, [props?.userInfo])

  const { userProfile } = useUserAccess();
  const { user_level } = userProfile

  const handleNextStep = () => {
    setUserInviteStep(userInviteStep + 1)
  }

  const handleInviteLevel = (levelToInvite) => {

    if (levelToInvite === "level_1") {
      let data_user = userData;
      delete data_user.client;
      setuserData(data_user);
    }
    let level_to_set = getDefaultLevelAccess(levelToInvite, props?.initialAccess);
    setInviteLevel(levelToInvite);
    if (props?.initialAccess) {
      setuserData((pre) => {
        return {
          ...pre,
          user_access: level_to_set
        }
      })
    }
  }

  //  console.log('user data ---->',userData.user_access);

  const handleBackStep = () => {
    setUserInviteStep(userInviteStep - 1)
  }

  localforage.getItem("user").then((response) => {
    setLoggedInUserId(response?.id)
  })

  useEffect(() => {
    getActiveClients().then(response => {
      setClients(response)
    })
  }, [])

  useEffect(() => {
    if (props?.companyName) {
      setuserData((pre) => {
        return {
          ...pre,
          company_name: props?.companyName
        }
      })
    }
  }, [props?.companyName, props?.initialAccess]);

  const infoUpdated = () => {
    setupdateProfiledisabled(false);
  };

  // Handle Selecting access levels
  const handleAccessLevels = (accessId) => {
    const selectedAccess = accessLevels.flatMap(level => level.accesses).find(access => access.id === accessId);
    if (!selectedAccess) {
      return;
    }
    const { parent, title } = selectedAccess;
    const updatedState = { ...userData };

    if (title === "Full Access" && parent === 'attendance') {
      updatedState[`${parent}_view`] = true;
      updatedState[`${parent}_edit`] = true;
      updatedState[`${parent}_approve`] = true;
    }
    else if (title === "Full Access") {
      updatedState[`${parent}_view`] = true;
      updatedState[`${parent}_edit`] = true;
    }
    else if (title === "View Only" && parent === 'attendance') {
      updatedState[`${parent}_view`] = true;
      updatedState[`${parent}_edit`] = false;
      updatedState[`${parent}_approve`] = false;
    }
    else if (title === "View Only") {
      updatedState[`${parent}_view`] = true;
      updatedState[`${parent}_edit`] = false;
    }
    else if (title === "No Access" && parent === 'attendance') {
      updatedState[`${parent}_approve`] = false;
      updatedState[`${parent}_view`] = false;
      updatedState[`${parent}_edit`] = false;
    } else if (title === "No Access") {
      updatedState[`${parent}_view`] = false;
      updatedState[`${parent}_edit`] = false;
    }

    setuserData(updatedState);
    if (props?.editProfile) {
      infoUpdated();
    }
  }

  useEffect(() => {
    if (accessSelected) {
      handleAccessLevels(accessSelected);
    }
  }, [accessSelected])

  const closeModal = () => {
    // console.log("close modal");
    form.setFieldValue({
      job_title: ''
    })
    setResetStateCount(resetStateCount + 1);
    form.resetFields();
    props.setEditProfile(false);

  };

  const profileEdited = () => {
    if (props.addUser) {
      setLoading(true);
      inviteUser(userData).then((res) => {
        if (res?.response?.request?.status !== 400) {
          setLoading(false);
          // close();
          closeModal()
          setUserInviteStep(0);
          props?.setuserInvited(true);
        } else {
          setLoading(false);
        }
      });
    } else {
      setLoading(true);

      console.log("userData edit", userData);
      updateProfile(userData, props.userInfo?.id).then((res) => {
        if (res) {
          setLoading(false);
          if (props.setProfile_update) {
            props.setProfile_update(true);
          }

          if (props.avatarUpdated) {
            props.avatarUpdated(true);
          }

          // Update job title in header for a logged in user
          if (props?.userInfo?.id === loggedInUserId) {
            if (props?.job_titles) {
              const title = props.job_titles.find(element => element.id.toString() === userData?.job_title)?.title_name
              localforage.removeItem("title").then(() => {
                setUserJobTitle(title);
              });
              setProfileData((pre) => {
                return {
                  ...pre,
                  loading: true,
                  profileUpdated: true,
                  profileUrl: "",
                  profileJobTitle: title,
                };
              });
            }

            // changing the username
            if (userData?.username !== props?.userInfo?.username) {
              changePhoneNumber(userData?.username);
            }
          }
          if (router.pathname.startsWith('/settings')) {
            router.replace({
              pathname: `/settings/[${userData?.firstname} ${userData.lastname}]`,
              query: {
                user_id: props.userInfo?.id,
                isAdmin: true,
              },
            });
          } else {
            router.replace({
              pathname: `/[${userData?.firstname} ${userData.lastname}]`,
              query: {
                user_id: props.userInfo?.id,
                isAdmin: true,
              },
            });
          }
        }
      }).finally(() => {
        setLoading(false);
        closeModal()
      })
    }
  };

  const handleFirstNameChanged = (e) => {
    infoUpdated();
    setuserData((pre) => {
      return {
        ...pre,
        firstname: e.target.value,
      };
    });
  };

  const handleLastNameChanged = (e) => {
    infoUpdated();
    setuserData((pre) => {
      return {
        ...pre,
        lastname: e.target.value,
      };
    });
  };

  const handleEmailChanged = (e) => {
    infoUpdated();
    setuserData((pre) => {
      return {
        ...pre,
        email: e.target.value,
      };
    });
  };

  const handlePhoneChanged = (e) => {
    infoUpdated();
    setuserData((pre) => {
      return {
        ...pre,
        username: e.target.value,
      };
    });
  };

  const titleChanged = (e) => {
    infoUpdated();
    setuserData((pre) => {
      return {
        ...pre,
        job_title: e,
      };
    });
  };

  // handle Access Changes
  const handleUserAccessChanges = (access) => {
    // setuserData((pre) => {
    //   return {
    //     ...pre,
    //     user_access: access,
    //   };
    // })
  }

  const onSearch = (e) => {
    setNewJobTitle(e);
  };

  const showPopconfirm = (value) => {
    setOpenConfirm(true);
    setNewTitle(value);
  };

  const confirmCreateTitle = async () => {
    setConfirmLoading(true);
    setNewJobTitle('');
    await submitJobTitle(newTitle).then((res) => {
      setConfirmLoading(false);
      setOpenConfirm(false);
      setuserData({
        ...userData,
        job_title: res?.id.toString(),
      });
      form.setFieldValue("job_title", capitalizeAll(res?.title_name))
      props?.setJobTitleChanged(true);
    }
    ).catch((error) => {
      message.error('Job title creation failed, try again.')
      setConfirmLoading(false);
      setOpenConfirm(false);
      message.error(error.message)
    })
  };

  const cancelCreateTitle = (e) => {
    setOpenConfirm(false);
  };

  const avatarChanged = (avatar) => {
    infoUpdated();
    setSelectedAvatar(avatar);
    setuserData((pre) => {
      return {
        ...pre,
        avatar_url: avatar,
      };
    });
  };

  const ModalTitle = () => (
    <StyledEditor>
      <h1 className="import modalTitle">
        {props.addUser ? "New User" : "Edit Profile"}
      </h1>
    </StyledEditor>
  );

  // // user form component
  // const UserInfoForm = () => (

  // );

  return (
    <StyledEditUserProfile>
      <Modal
        centered
        title={<ModalTitle />}
        okText="Yes"
        cancelText="No"
        open={props.editProfile}
        // onOk={close}
        onCancel={closeModal}
        // closeIcon={<Icon icon="fe:close" className="close" />}
        styles={{
          body: 550
        }}
        width={820}
        footer={null}
      >

        {/* steps */}
        {props?.addUser && (
          <OnboardSteps steps={userInviteSteps} currentStep={userInviteStep} />
        )}
        {userInviteStep === 0 && (
          <StyledEditUserProfile>
            <div className="flex flex-col h-full pl-6">
              <div className="flex flex-col gap-1">
                <p className="stepTitle">Choose an avatar</p>
                <div className="avatar-container">
                  {images.map((image) => {
                    const isSelected = image.url === selectedAvatar;
                    return (
                      <img
                        className={`avatar ${isSelected ? "selected" : ""}`}
                        key={`${image.id}-${image.url}`}
                        src={image.url}
                        onClick={() => avatarChanged(image.url)}
                      />
                    );
                  })}
                </div>
              </div>
              <div>
                {/* =========== NEW USER ================= */}
                {props?.addUser ? (
                  <Form
                    name="form_item_path"
                    layout="vertical"
                    form={form}
                    onFinish={handleNextStep}
                    requiredMark={false}
                  >
                    <StyledEditUserProfile>
                      <div className="flex flex-col">
                        <div className="flex mt-1">
                          <div>
                            <Form.Item
                              label={
                                <span>
                                  First Name <span style={{ color: "red" }}>*</span>
                                </span>
                              }
                              name="first_name"
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
                              <Input
                                placeholder="XXXX"
                                onChange={handleFirstNameChanged}
                                type="text"
                                autoComplete="off"
                              />
                            </Form.Item>
                            <Form.Item
                              label={
                                <span>
                                  Job title <span style={{ color: "red" }}>*</span>
                                </span>
                              }
                              name="job_title"
                              className="mt-[30px]"
                              initialValue={userData?.job_title}
                              rules={[
                                {
                                  required: true,
                                  message: "Missing Job title",
                                }
                              ]}
                            >
                              <Select
                                className="w-full h-[40px] rounded-md  border-bder-color capitalize"
                                defaultValue={userData?.job_title}
                                value={userData?.job_title}
                                showSearch
                                placeholder="Select Job Title"
                                onChange={titleChanged}
                                onSearch={onSearch}
                                loading={props?.job_titles?.length === 0}
                                optionFilterProp="children"
                                filterOption={(input, option) => option.children.toLowerCase().includes(input?.toLowerCase())}
                                filterSort={(optionA, optionB) =>
                                  optionA.children.toLowerCase().localeCompare(optionB.children.toLowerCase())
                                }

                                notFoundContent={newJobTitle.length > 0 &&
                                  <Button
                                    style={{
                                      background: 'var (--primary)',
                                      color: 'var (--primary)',
                                      display: 'flex',
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '2px',
                                      color: 'var(--primary)',
                                    }}
                                    onClick={() => showPopconfirm(newJobTitle)}
                                  >
                                    <Icon icon="fe:plus" width={15} height={15} />
                                    Create job title : {capitalizeAll(newJobTitle)}
                                  </Button>
                                }
                              >
                                {props?.job_titles?.map((item) => {
                                  return (
                                    <Option
                                      value={item.id.toString()}
                                      key={item.id}
                                      title={item.title_name}
                                    >
                                      {capitalizeAll(item.title_name)}
                                    </Option>
                                  );
                                })}
                              </Select>
                            </Form.Item>

                            {/* === create new job title modal ===  */}
                            <ConfirmationModal
                              value={newTitle}
                              handleOk={confirmCreateTitle}
                              handleCancel={cancelCreateTitle}
                              openConfirm={openConfirm}
                              confirmLoading={confirmLoading}
                              title="Confirm creating a position."
                              content="Are you sure you want to create this position?"
                            />
                            <Form.Item
                              label={
                                <span>
                                  Phone Number{" "}
                                  <span style={{ color: "red" }}>*</span>
                                </span>
                              }
                              name="Phone Number"
                              className="input"
                              rules={[
                                {
                                  required: true,
                                  message: "Missing Phone Number",
                                },
                                {
                                  pattern: /^(078|079|072)\d{7}$/,
                                  message: "Invalid Phone Number",
                                },
                              ]}
                            >
                              <Input
                                placeholder="07XXXXXXXX"
                                onChange={handlePhoneChanged}
                                maxLength={10}
                                type="text"
                                autoComplete="off"
                              />
                            </Form.Item>
                          </div>
                          <div className="left-inputs">
                            <Form.Item
                              label={
                                <span>
                                  Last Name<span style={{ color: "red" }}>*</span>
                                </span>
                              }
                              name="last_name"
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
                              <Input
                                placeholder="XXXX"
                                onChange={handleLastNameChanged}
                                type="text"
                                autoComplete="off"
                              />
                            </Form.Item>
                            <Form.Item
                              label={
                                <span>
                                  Work Email
                                  <span style={{ color: "red", marginLeft: 5 }}>
                                    *
                                  </span>
                                </span>
                              }
                              name="email"
                              className="input"
                              rules={[
                                { required: true, message: "Missing Email" },
                                {
                                  pattern:
                                    /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                                  message: "Invalid Email",
                                },
                              ]}
                            >
                              <Input
                                placeholder="example@fixarwanda.com"
                                onChange={handleEmailChanged}
                                type="text"
                                autoComplete="off"
                              />
                            </Form.Item>
                            {user_level && user_level.name.toLowerCase() === "level_1" && <Form.Item
                              label={
                                <span>
                                  User Level
                                  <span style={{ color: "red" }}> *</span>
                                </span>
                              }
                              name="user_level"
                              className="mt-[30px]"
                              // initialValue={levels}
                              rules={[
                                { required: true, message: "Missing Level" }]}
                            >
                              <Select
                                className="w-full h-[40px] rounded-md  border-bder-color capitalize"
                                placeholder={"Select level"}
                                onChange={handleInviteLevel}
                                initialValue={levels}
                                name="user_level"
                              >
                                {levels?.map((item) => {
                                  return (
                                    <Option
                                      value={item.name}
                                      key={item.id}
                                      title={item.name}
                                    >
                                      {capitalizeAll(item.name)}
                                    </Option>
                                  );
                                })}
                              </Select>
                            </Form.Item>}
                            {inviteLevel && inviteLevel.toLowerCase() === "level_2" && <Form.Item
                              label={
                                <span>
                                  Client
                                  <span style={{ color: "red" }}> *</span>
                                </span>
                              }
                              name="client"
                              className="mt-[30px]"
                              initialValue={props?.userInfo?.clients}
                              rules={[
                                { required: true, message: "Missing Client" }]}
                            >
                              <Select
                                className="w-full h-[40px] rounded-md  border-bder-color capitalize"
                                // defaultValue={props?.userInfo?.clients}
                                value={userData?.client}
                                // showSearch
                                placeholder={"Select a Client"}
                                onChange={(e) => {
                                  infoUpdated()
                                  setuserData({ ...userData, client: e })
                                }}
                                loading={clients.length === 0}
                                optionFilterProp="children"
                                filterOption={(input, option) => option.children.toLowerCase().includes(input?.toLowerCase())}
                                filterSort={(optionA, optionB) =>
                                  optionA.children.toLowerCase().localeCompare(optionB.children.toLowerCase())
                                }
                                name="client"
                                initialValue={props?.userInfo?.clients}
                              >
                                {clients?.map((item) => {
                                  return (
                                    <Option
                                      value={item.id}
                                      key={item.id}
                                      title={item.name}
                                    >
                                      {capitalizeAll(item.name)}
                                    </Option>
                                  );
                                })}
                              </Select>
                            </Form.Item>}
                          </div>
                        </div>

                        <div className="flex w-full justify-center">
                          <Button
                            loading={loading}
                            type="primary"
                            className="primaryBtn w-32"
                            htmlType="submit"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </StyledEditUserProfile>
                  </Form>
                ) : (
                  <Form
                    name="form_item_path"
                    layout="vertical"
                    form={form}
                    onFinish={profileEdited}
                  >
                    <StyledEditUserProfile>
                      <div className="flex flex-col">
                        <div className="flex mt-1">

                          <div>
                            <Form.Item
                              label={
                                <span>
                                  First Name <span style={{ color: "red" }}>*</span>
                                </span>
                              }
                              name="first_name"
                              className="input"
                              rules={[
                                props.addUser
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
                              {!props.addUser ? (
                                <Input
                                  defaultValue={capitalize(
                                    props.userInfo?.firstname
                                  )}
                                  onChange={handleFirstNameChanged}
                                  type="text"
                                  autoComplete="off"
                                />
                              ) : (
                                <Input
                                  placeholder="XXXX"
                                  onChange={handleFirstNameChanged}
                                  type="text"
                                  autoComplete="off"
                                />
                              )}
                            </Form.Item>

                            <Form.Item
                              label={
                                <span>
                                  Job Title <span style={{ color: "red" }}>*</span>
                                </span>
                              }
                              name="job_title"
                              className="mt-[30px]"
                              initialValue={props?.userInfo?.title}
                            >
                              <Select
                                className="w-full h-[40px] rounded-md  border-bder-color capitalize"
                                defaultValue={props?.userInfo?.title}
                                value={userData?.job_title}
                                showSearch
                                placeholder={
                                  props.addUser
                                    ? "Select Job Title"
                                    : `${capitalize(props.userInfo?.title)}`
                                }
                                onChange={titleChanged}
                                onSearch={onSearch}
                                loading={props?.job_titles?.length === 0}
                                optionFilterProp="children"
                                filterOption={(input, option) => option.children.toLowerCase().includes(input?.toLowerCase())}
                                filterSort={(optionA, optionB) =>
                                  optionA.children.toLowerCase().localeCompare(optionB.children.toLowerCase())
                                }

                                notFoundContent={newJobTitle.length > 0 &&
                                  <Button
                                    style={{
                                      background: 'var (--primary)',
                                      color: 'var (--primary)',
                                      display: 'flex',
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '2px',
                                      color: 'var(--primary)',
                                    }}
                                    onClick={() => showPopconfirm(newJobTitle)}
                                  >
                                    <Icon icon="fe:plus" width={15} height={15} />
                                    Create job title : {capitalizeAll(newJobTitle)}
                                  </Button>
                                }
                              >
                                {props?.job_titles?.map((item) => {
                                  return (
                                    <Option
                                      value={item.id.toString()}
                                      key={item.id}
                                      title={item.title_name}
                                    >
                                      {capitalizeAll(item.title_name)}
                                    </Option>
                                  );
                                })}
                              </Select>
                            </Form.Item>

                            {/* === create new job title modal ===  */}
                            <ConfirmationModal
                              value={newTitle}
                              handleOk={confirmCreateTitle}
                              handleCancel={cancelCreateTitle}
                              openConfirm={openConfirm}
                              confirmLoading={confirmLoading}
                              title="Confirm creating a position."
                              content="Are you sure you want to create this position?"
                            />

                            <Form.Item
                              label={
                                <span>
                                  Phone Number{" "}
                                  <span style={{ color: "red" }}>*</span>
                                </span>
                              }
                              name="Phone Number"
                              className="input"
                              rules={[
                                props.addUser && {
                                  required: true,
                                  message: "Phone number Required",
                                },
                                { validator: validatePhoneInput },
                              ]}
                            >
                              {!props.addUser ? (
                                <Input
                                  defaultValue={
                                    props.userInfo?.username
                                      ? capitalize(props.userInfo?.username)
                                      : "-"
                                  }
                                  onChange={handlePhoneChanged}
                                  type="text"
                                  autoComplete="off"
                                  maxLength={10}
                                />
                              ) : (
                                <Input
                                  placeholder="07XXXXXXXX"
                                  onChange={handlePhoneChanged}
                                  type="text"
                                  autoComplete="off"
                                  maxLength={10}
                                />
                              )}
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
                              className="input"
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
                              {!props.addUser ? (
                                <Input
                                  defaultValue={capitalize(
                                    props.userInfo?.lastname
                                  )}
                                  onChange={handleLastNameChanged}
                                  type="text"
                                  autoComplete="off"
                                />
                              ) : (
                                <Input
                                  placeholder="XXXX"
                                  onChange={handleLastNameChanged}
                                  type="text"
                                  autoComplete="off"
                                />
                              )}
                            </Form.Item>
                            <Form.Item
                              label={
                                <span>
                                  Work Email <span style={{ color: "red" }}>*</span>
                                </span>
                              }
                              name="email"
                              className="input"
                              rules={[
                                props.addUser && { required: true, message: "Missing Email" },
                                { validator: validateEmail },
                              ]}
                            >
                              {!props.addUser ? (
                                <Input
                                  defaultValue={props.userInfo?.email}
                                  onChange={handleEmailChanged}
                                  type="text"
                                  autoComplete="off"
                                />
                              ) : (
                                <Input
                                  placeholder="example@fixarwanda.com"
                                  onChange={handleEmailChanged}
                                  type="text"
                                  autoComplete="off"
                                />
                              )}
                            </Form.Item>

                            {/* {user_level && user_level?.name?.toLowerCase() === "level_1" && <Form.Item
                              label={
                                <span>
                                  User Level
                                  <span style={{ color: "red" }}> *</span>
                                </span>
                              }
                              name="user_level"
                              className="mt-[30px]"
                              initialValue={user_level?.name?.toLowerCase()}
                              rules={[
                                { required: true, message: "Missing Level" }]}
                            >
                              <Select
                                className="w-full h-[40px] rounded-md  border-bder-color capitalize"
                                placeholder={"Select level"}
                                onChange={handleInviteLevel}
                                // initialValue={levels}
                                defaultValue={user_level?.name?.toLowerCase()}
                                name="user_level"
                              >
                                {levels?.map((item) => {
                                  return (
                                    <Option
                                      value={item.name}
                                      key={item.id}
                                      title={item.name}
                                    >
                                      {capitalizeAll(item.name)}
                                    </Option>
                                  );
                                })}
                              </Select>
                            </Form.Item>}
                            {inviteLevel && inviteLevel?.toLowerCase() === "level_2" && <Form.Item
                              label={
                                <span>
                                  Client
                                  <span style={{ color: "red" }}> *</span>
                                </span>
                              }
                              name="client"
                              className="mt-[30px]"
                              initialValue={props?.userInfo?.clients}
                              rules={[
                                { required: true, message: "Missing Client" }]}
                            >
                              <Select
                                className="w-full h-[40px] rounded-md  border-bder-color capitalize"
                                // defaultValue={props?.userInfo?.clients}
                                value={userData?.client}
                                // showSearch
                                placeholder={"Select a Client"}
                                onChange={(e) => {
                                  infoUpdated()
                                  setuserData({ ...userData, client: e })
                                }}
                                loading={clients.length === 0}
                                optionFilterProp="children"
                                filterOption={(input, option) => option.children.toLowerCase().includes(input?.toLowerCase())}
                                filterSort={(optionA, optionB) =>
                                  optionA.children.toLowerCase().localeCompare(optionB.children.toLowerCase())
                                }
                                name="client"
                                // initialValue={props?.userInfo?.clients}
                                defaultValue={props?.userInfo?.clients}
                              >
                                {clients?.map((item) => {
                                  return (
                                    <Option
                                      value={item.id}
                                      key={item.id}
                                      title={item.name}
                                    >
                                      {capitalizeAll(item.name)}
                                    </Option>
                                  );
                                })}
                              </Select>
                            </Form.Item>} */}
                          </div>
                        </div>

                        <div className="flex w-full justify-center">
                          <Button
                            type="primary"
                            className="primaryBtn w-32"
                            htmlType="submit"
                            disabled={updateProfiledisabled}
                            loading={loading}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </StyledEditUserProfile>
                  </Form>
                )}
              </div>
            </div>
          </StyledEditUserProfile>
        )}
        {/* Payment form  */}
        {userInviteStep === 1 && (
          <div>
            {/* ======= setting access ========= */}
            <SettingsAccess userAccess={userData.user_access} inviteUser={true} handleAccess={handleUserAccessChanges} />
            <div className="flex w-full justify-center gap-3">
              <Button
                type="primary"
                className="secondaryCustomBtn w-32"
                onClick={handleBackStep}
              >
                Back
              </Button>

              <Button
                type="primary"
                className="primaryBtnCustom w-32"
                // disabled={updateProfiledisabled}
                onClick={profileEdited}
                loading={loading}
              >
                Save
              </Button>
            </div>
          </div>

        )}

      </Modal >
    </StyledEditUserProfile >
  );
}

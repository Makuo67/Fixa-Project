import React, { useContext, useEffect, useState } from "react";
import { StyledUserProfile } from "./StyleUser-profile";
import { Badge, Button, Col, Collapse, Modal, notification, Row, Skeleton, Tabs, Tag } from "antd";
import { Icon } from "@iconify/react";
import { capitalize } from "../../helpers/excelRegister";
import EditWorkerInfo from "./Modals/edit";
import Confirm from "./Modals/confirm";
import ChangePassword from "./Modals/ChangePassword";
import { useDispatch } from "react-redux";
import { USER_LOGOUT_REQUESTED } from "../../redux/constants/user.constants";
import { useRouter } from "next/router";
import { updateAvatar } from "../../helpers/user-profile/user-profile";
import Avatar from "antd/lib/avatar/avatar";
import { PusherContext } from "../../context/PusherContext";
import { useUserAccess } from "../Layouts/DashboardLayout/AuthProvider";
import UploadImage from "../shared/UploadImage";
import { accessSubEntityRetrieval } from "@/utils/accessLevels";
import { authUserLogOut } from "@/helpers/auth";
import useSession from "@/utils/sessionLib";

export default function UserInfoCard(props) {
  const [status, setStatus] = useState();
  const [editProfile, setEditProfile] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showEditPasswordModal, setShowEditPasswordModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [isSelected, setIsSelected] = useState(false);
  const [userAvatar, setUserAvatar] = useState({ avatar_url: "" });
  const [route, setRoute] = useState(null);
  const [myProfileBadge, setMyprofileBadge] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  const { setProfileData } = useContext(PusherContext);

  const dispatch = useDispatch();
  const router = useRouter();
  const { userLogout } = useSession();

  const { userProfile, setLoadUser } = useUserAccess();

  useEffect(() => {
    if (router.isReady) {
      // console.log('router.query ===>',router.pathname)
      if (router.pathname === '/settings/[userProfile]') {
        setRoute('admin')
      }
      else if (router.pathname === '/[userProfile]') {
        setRoute('user')
      }
    }
  }, [router.isReady]);

  useEffect(() => {
    if (props.infoLoaded) {
      setProfileLoading(true);
      setStatus(props.userInfo?.isActive);
      setProfileLoading(false);
    }
  }, [props.infoLoaded]);

  useEffect(() => {
    if (userProfile?.email && props?.userInfo?.email && userProfile?.email === props?.userInfo?.email) {
      setMyprofileBadge(true);
    }
  }, [userProfile, props?.userInfo]);


  useEffect(() => {
    if (props.profile_update) {
      setProfileLoading(true);
      setStatus(props.userInfo?.isActive);
      setTimeout(() => {
        setProfileLoading(false);
      }, [1000]);
    }
  }, [props.profile_update]);

  const editUserInfo = () => {
    setEditProfile(true);
  };

  const showConfirmation = () => {
    setShowConfirm(true);
  };

  const showEditPassword = () => {
    setShowEditPasswordModal(true);
  };

  // show edit profile modal
  const showEditProfile = () => {
    setShowEditProfileModal(true);
  };

  const logout = async () => {
    // clear local storage
    authUserLogOut();
    // clear iron-session
    userLogout()
    // await signOut({ callbackUrl: '/login' });
    dispatch({ type: USER_LOGOUT_REQUESTED });
    router.push("/login");
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    setIsModalOpen(false);
    updateAvatar(userAvatar, props?.userInfo?.id).then((res) => {
      if (res) {
        setLoadUser(true);
        notification.success({
          message: `Success`,
          description: "Profile Updated!",
        });

        if (props?.avatarUpdated) {
          props?.avatarUpdated(true);
        }

        if (props?.setProfile_update) {
          props?.setProfile_update(true);
        }

        setProfileData((pre) => {
          return {
            ...pre,
            loading: true,
            profileUpdated: true,
            profileUrl: userAvatar?.avatar_url,
            profileJobTitle: "",
          };
        });
      } else {
        notification.error({
          message: `Error`,
          description: "Something went wrong",
        });
      }
    });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const avatarChanged = (avatar) => {
    setSelectedAvatar(avatar);
    setUserAvatar(() => {
      return {
        avatar_url: avatar,
      };
    });
  };

  const contacts = (<div className="">
    {/* <h4 className="contacts">CONTACTS</h4> */}
    <div style={{ display: "flex", flexDirection: "column" }}>
      <p
        style={{
          display: "inline-flex",
          alignItems: "center",
          whiteSpace: "normal",
        }}
      >
        <Icon
          icon="ic:round-mail-outline"
          color="#00A1DE"
          height={18}
        />
        <span style={{ color: "#414A52", fontWeight: "500" }}>
          &nbsp; &nbsp;{" "}
          {props?.userInfo?.email?.toString()?.length != 0 ? props?.userInfo?.email : "-"}
        </span>
      </p>
      <p
        style={{
          display: "inline-flex",
          alignItems: "center",
          whiteSpace: "normal",
        }}
      >
        <Icon icon="ph:phone-light" color="#00A1DE" height={18} />
        {props.userInfo?.username ? (
          <span style={{ color: "#414A52", fontWeight: "500" }}>
            &nbsp; +250{" "}
            {props.userInfo?.username?.substring(1)?.length != 0
              ? props.userInfo?.username?.substring(1)
              : "XXXXXXX"}
          </span>
        ) : (
          <>-</>
        )}
      </p>
    </div>

    {/* ======== settings route ===== */}
    {route === 'user' && (
      <div className="flex gap-4 items-center mt-5">
        <Button
          type="primary"
          className="primaryBtnCustom"
          icon={
            <Icon
              className="text-white"
              icon="material-symbols:edit-square-outline"
              height={18}
            />
          }
          onClick={showEditProfile}
        >
          Edit Profile
        </Button>

        <Button
          type="secondary"
          className="actionSecondaryBtn"
          icon={
            <Icon
              icon="material-symbols:edit-square-outline"
              color="#FA8C16ed"
              height={18}
            />
          }
          onClick={showEditPassword}
        >
          Change Password
        </Button>
        <Button
          type="secondary"
          className="actionSecondaryBtn"
          icon={
            <Icon
              icon="material-symbols:logout"
              color="#FA8C16ed"
              height={18}
            />
          }
          onClick={logout}
        >
          Log Out
        </Button>
        <ChangePassword
          showEditPasswordModal={showEditPasswordModal}
          setShowEditPasswordModal={setShowEditPasswordModal}
          email={props?.userInfo?.email}
        />

        {/* Edit profile modal */}
        <EditWorkerInfo
          editProfile={showEditProfileModal}
          setEditProfile={setShowEditProfileModal}
          editMyProfile={true}
          userInfo={props?.userInfo}
          avatarUpdated={props?.avatarUpdated}
        />
        {/* End Edit profile modal */}
      </div>
    )}
  </div>
  )
  const onChangeCollapse = (key) => {
    console.log(key);
  };

  const onChangeTabs = (key) => {
    console.log(key);
  };

  const collapseItems = () => [
    {
      key: '1',
      label: 'Contacts',
      children: <p>{contacts}</p>,
    },
  ];

  const tabsItems = [
    {
      key: '1',
      label: 'Tab 1',
      children: 'Content of Tab Pane 1',
    },
    {
      key: '2',
      label: 'Tab 2',
      children: 'Content of Tab Pane 2',
    },
    {
      key: '3',
      label: 'Tab 3',
      children: 'Content of Tab Pane 3',
    },
  ];

  return (
    <StyledUserProfile>
      {profileLoading ? (
        <div className="profile">
          <Skeleton
            className="settingsHeader"
            avatar
            paragraph={{ rows: 6 }}
            active
          />
        </div>
      ) : (
        <>
          <Modal
            centered
            title="Change profile image"
            okText="Update"
            cancelText="Discard"
            open={isModalOpen}
            onOk={handleOk}
            onCancel={handleCancel}
            styles={{
              body: {
                height: 150
              }
            }}
            width={400}
            okButtonProps={{
              className: "bg-primary"
            }}
          >
            <div className="flex w-full h-full items-center justify-center" >
              <div className="flex justify-center">
                <UploadImage
                  picture={true}
                  setImageUrl={avatarChanged}
                  existingImage={props?.userInfo?.avatar_url}
                />
              </div>
            </div>
          </Modal>

          {/* ===== USER profile  =====*/}
          <div className="flex bg-white w-full h-[500px] p-7 rounded-md flex-col gap-3">
            <div className="avatar-container">
              {props?.userInfo?.avatar_url?.length != 0 &&
                props?.userInfo?.avatar_url != null ? (
                <Avatar
                  key={"0"}
                  className="w-32 h-32 rounded-full hover:cursor-pointer hover:opacity-60 flex justify-center items-center bg-secondary text-primary image"
                  draggable={true}
                  onClick={showModal}
                >
                  <div className="w-32 h-32" onClick={showModal}>
                    <img
                      className="w-32 h-32"
                      src={props?.userInfo?.avatar_url}
                    />
                  </div>
                </Avatar>
              ) : (
                <Avatar
                  key={"1"}
                  className="avatar-component"
                  draggable={true}
                  onClick={showModal}
                >
                  <span className="initials" onClick={showModal} style={{ textTransform: "uppercase" }}>
                    {props.userInfo?.firstname?.charAt(0) +
                      props.userInfo?.lastname?.charAt(0)}
                  </span>
                </Avatar>
              )}
            </div>
            {/* ==== user INFO ==== */}
            <div className="flex flex-col gap-3">
              <p className="user-names">
                {capitalize(props.userInfo?.firstname)?.toString()?.length != 0
                  ? capitalize(props.userInfo?.firstname)
                  : "-"}{" "}
                {capitalize(props.userInfo?.lastname)?.toString()?.length != 0
                  ? capitalize(props.userInfo?.lastname)
                  : "-"}
                <br />
                {/* show me */}
                {myProfileBadge ? (

                  <span>
                    <Tag
                      className="bg-gray-1 text-white text-base w-11 rounded-md"
                    >
                      You
                    </Tag>
                  </span>
                ) : ""}

                <span>
                  <Tag
                    className="worker-status"
                    color={props.userInfo?.isActive ? "#E8FAFA" : "red"}
                  >
                    <Badge
                      status={props.userInfo?.isActive ? "success" : "error"}
                      text={
                        <span
                          style={{
                            color: props.userInfo?.isActive ? "#0DA35B" : "red",
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        >
                          {props.userInfo?.isActive ? "active" : "inactive"}
                        </span>
                      }
                    />
                  </Tag>
                </span>
                <br />
                <span className="title">
                  {capitalize(props.userInfo?.title)?.toString()?.length != 0
                    ? capitalize(props.userInfo?.title)
                    : "-"}
                </span>
              </p>
              <Collapse items={collapseItems("text")} defaultActiveKey={['1']} onChange={onChangeCollapse} />
              {/* ======== settings route ===== */}
              {route === 'admin' && (
                <div className="flex items-center gap-2">
                  {userProfile && accessSubEntityRetrieval(userProfile?.user_access, 'settings', 'office team', 'edit office user') && (

                    <Button
                      type="primary"
                      className="actionSecondaryBtn"
                      icon={
                        <Icon icon="material-symbols:edit-square-outline" height={18} />
                      }
                      onClick={editUserInfo}
                    >
                      Edit
                    </Button>
                  )}

                  <>
                    {
                      userProfile && accessSubEntityRetrieval(userProfile?.user_access, 'settings', 'office team', 'deactivate office user') &&
                        props.userInfo?.isActive ? (
                        <Button
                          type="secondary"
                          className="sadActionSecondaryBtn w-40"
                          icon={<Icon icon="uiw:stop-o" height={18} />}
                          onClick={showConfirmation}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          className="truthActionSecondaryBtn"
                          icon={
                            <Icon
                              icon="material-symbols:check-circle-outline"
                              color="#0da35b"
                              height={20}
                            />
                          }
                          onClick={showConfirmation}
                        >
                          Activate
                        </Button>
                      )}
                  </>

                  <EditWorkerInfo
                    editProfile={editProfile}
                    setEditProfile={setEditProfile}
                    userInfo={props?.userInfo}
                    job_titles={props.job_titles}
                    setProfile_update={props.setProfile_update}
                    myProfileBadge={myProfileBadge}
                  />
                  <Confirm
                    showConfirm={showConfirm}
                    setShowConfirm={setShowConfirm}
                    userInfo={props?.userInfo}
                    setProfile_update={props.setProfile_update}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </StyledUserProfile>
  );
}

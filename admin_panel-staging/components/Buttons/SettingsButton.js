import { PlusOutlined } from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import { Button } from "antd";
import EditWorkerInfo from "../UserProfile/Modals/edit";
import { getAccessLevels } from "@/helpers/settings/settings";
import { getDefaultLevelAccess } from "@/utils/accessLevels";
import { useUserAccess } from "../Layouts/DashboardLayout/AuthProvider";

export const NewSettingsUserButton = (props) => {
  const [editProfile, setEditProfile] = useState(false);
  const [initialAccess, setInitialAccess] = useState([]);

  const { userProfile } = useUserAccess();

  const editUserInfo = () => {
    setEditProfile(true);
  };

  useEffect(() => {
    getAccessLevels().then((res) => {
      // const defaultAccess = getDefaultLevelAccess('level_0', res);
      setInitialAccess(res);
    })
  }, []);


  return (
    <>
      <Button
        className="primaryBtn"
        icon={<PlusOutlined className='text-white' />}
        onClick={editUserInfo}
      >
        Invite a new User
      </Button>
      <EditWorkerInfo
        editProfile={editProfile}
        setEditProfile={setEditProfile}
        addUser={true}
        job_titles={props?.job_titles}
        setuserInvited={props?.setuserInvited}
        setJobTitleChanged={props?.setJobTitleChanged}
        companyName={props?.companyName}
        initialAccess={initialAccess}
        userInfo={userProfile}
      />
    </>
  );
};

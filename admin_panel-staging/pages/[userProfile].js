import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import Layout from "../components/Layouts/DashboardLayout/Layout";
import { retriveUserDataFromLocalStorage } from "../helpers/auth";
import { getUserInfo } from "../helpers/user-profile/user-profile";

export default function UserProfile() {
  const router = useRouter();
  const { user_id, userProfile } = router.query;

  const [names, setNames] = useState(null);
  const [userInfo, setInfo] = useState(null);
  const [infoLoaded, setInfoLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(null);
  const [avatarUpdated, setAvatarUpdated] = useState(false);

  useEffect(() => {
    if (user_id && userProfile) {
      setNames(userProfile);
      getUserInfo(user_id).then((user) => {
        setInfo(user?.user_body);
        setInfoLoaded(true);
      });
    }
  }, [user_id, userProfile]);

  useEffect(() => {
    setNames(userProfile);
    setIsAdmin(router.query?.isAdmin);
    if (avatarUpdated && user_id) {
      getUserInfo(user_id).then((user) => {
        setInfo(user?.user_body);
        setInfoLoaded(true);
      });
    }
    setAvatarUpdated(false);
  }, [avatarUpdated]);

  return (
    <div>
      <UserInfoCard
        userInfo={userInfo}
        isAdmin={isAdmin}
        avatarUpdated={setAvatarUpdated}
        infoLoaded={infoLoaded}
      />
    </div>
  );
}
UserProfile.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

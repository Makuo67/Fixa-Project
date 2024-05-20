import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import UserInfoCard from "../../components/UserProfile/UserInfoCard";
import Layout from "../../components/Layouts/DashboardLayout/Layout";
import {
  checkUserAccess,
} from "../../helpers/auth";
import { getUserInfo } from "../../helpers/user-profile/user-profile";
import { Icon } from "@iconify/react";
import SettingsAccess from "@/components/Settings/SettingsAccess";

export default function ProfileSettings() {
  const router = useRouter();
  const { user_id, userProfile } = router.query;

  const [names, setNames] = useState(null);
  const [userInfo, setInfo] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [user_titles, setUser_titles] = useState([]);
  const [profile_update, setProfile_update] = useState(false);
  const [infoLoaded, setInfoLoaded] = useState(false);

  useEffect(() => {
    if (user_id && userProfile) {
      setNames(userProfile);
      getUserInfo(user_id).then((user) => {
        setInfo(user?.user_body);
        setUser_titles(user?.titles);
        setInfoLoaded(true);
      });

      checkUserAccess().then((access) => {
        if (access && router.query?.isAdmin) {
          setIsAdmin(true);
        }
      });
    }
  }, [user_id, userProfile]);

  useEffect(() => {
    if (profile_update && user_id) {
      getUserInfo(user_id).then((user) => {
        setInfo(user?.user_body);
        setUser_titles(user?.titles);
      });
      setProfile_update(false);
    }
  }, [profile_update]);

  return (
    <section className="flex flex-col gap-2">
      {/* ========= Top header ========= */}
      <div className="flex items-center gap-1 cursor-pointer w-fit"
        onClick={() => {
          router.push(`/settings`)
        }}>
        <Icon icon="material-symbols:arrow-back-rounded" width="25" />
        <h3>Back</h3>
      </div>

      <div className="flex w-full gap-8">
        {/* ========= user profile ========= */}
        <div className="w-1/2">
          <UserInfoCard
            userInfo={userInfo}
            isAdmin={isAdmin}
            job_titles={user_titles}
            setProfile_update={setProfile_update}
            profile_update={profile_update}
            infoLoaded={infoLoaded}
          />
        </div>
        {/* ========= Access section ========= */}
        <div className="w-2/3">
          <SettingsAccess userAccess={userInfo?.user_access} inviteUser={false} />
        </div>

      </div>
    </section>
  );
}
ProfileSettings.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

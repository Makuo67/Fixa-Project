import { useState, createContext, useContext, useEffect, useCallback } from "react";
import localforage from "localforage";

import { checkOnboarding, retriveAuthTokenFromLocalStorage, storeAuthTokenInLocalStorage } from "../../../helpers/auth";
import { getUserAccess } from "@/helpers/user-profile/user-profile";
import { useRouter } from "next/router";
import useSession from "@/utils/sessionLib";

const UserAccessContext = createContext();

export const useUserAccess = () => {
  return useContext(UserAccessContext);
};

const AuthProvider = (props) => {

  const [userAccess, setUserAccess] = useState({});
  const [loadUser, setLoadUser] = useState(false);
  const [token, setToken] = useState(null);
  const [companyStatusLoading, setCompanyStatusLoading] = useState(true);

  const [userProfile, setUserProfile] = useState({
    id: '',
    username: '',
    email: '',
    profile_image: '',
    title: '',
    client: {},
    phoneNumber: '',
    userProfileLoading: true,
    user_access: [],
    user_level: {}
  });
  const [companyStatus, setCompanyStatus] = useState({
    company_name: "",
    is_site_created: false,
    is_staff_members_added: false,
    is_workforce_added: false,
    is_payment_added: false,
    is_dashboard_available: false,
  });

  const router = useRouter();
  const path = router.pathname;

  const { session } = useSession();
  // useEffect for the session
  useEffect(() => {
    if (session && typeof session === 'object') {
      if (session.isLoggedIn === true && session.token !== '') {
        setToken(`Bearer ${session.token}`);
        storeAuthTokenInLocalStorage(`Bearer ${session.token}`);
      }
      // if path is not sign up
      else if (session && session.isLoggedIn === false && path !== '/signup/[id]' && path !== '/onboarding') {
        router.push('/login');
      }
    }
  }, [session]);

  // TODO: to remove this localforage

  const retrieveUserAccess = () => {
    localforage
      .getItem("userAccess")
      .then((value) => {
        if (value === null) {
        } else {
          setUserAccess(value);
        }
      })
      .catch((error) => {
        setUserAccess({});
      });
  };

  // func to update user profile
  const updateUserProfile = useCallback((res) => {
    // check if res is object
    if (typeof res === 'object') {
      setUserProfile({
        id: res?.data?.user?.id,
        email: res?.data?.user?.email,
        username: res?.data?.user?.firstname ? `${res?.data?.user?.firstname} ${res?.data?.user?.lastname}` : null,
        phoneNumber: res?.data?.user?.username,
        profile_image: res?.data?.user_profile?.avatar_url,
        title: res?.data?.user_profile?.title?.title_name,
        client: res?.data?.user_profile?.client ? res?.data?.user_profile?.client.id : null,
        userProfileLoading: false,
        user_access: res?.data?.user_profile?.user_access,
        user_level: res?.data?.user_level
      });
    }
  }, []);

  useEffect(() => {
    // Getting user access from indexDB
    if (token === null) {
      retriveAuthTokenFromLocalStorage().then((value) => {
        if (value !== null && value !== undefined && value.length > 0) {
          setToken(value);
        }
      });
    }

    if (token !== null && token !== undefined && token.length > 0) {
      getUserAccess().then((res) => {
        retrieveUserAccess();
        updateUserProfile(res);

        // updating company status
        if (companyStatusLoading) {
          setCompanyStatus({
            company_name: res?.data?.company_status?.company_name,
            is_site_created: res?.data?.company_status?.is_site_created,
            is_staff_members_added: res?.data?.company_status?.is_staff_members_added,
            is_workforce_added: res?.data?.company_status?.is_workforce_added,
            is_payment_added: res?.data?.company_status?.is_payment_added,
            is_dashboard_available: res?.data?.company_status?.is_dashboard_available,
            is_staffing: res?.data?.company_status?.is_staffing

          })
          checkOnboarding(res?.data?.company_status).finally(() => {
            setCompanyStatusLoading(false);
          })
        }
      });
    }
  }, [router.isReady, token, props.children, companyStatusLoading])

  // update on user changes
  useEffect(() => {
    if (loadUser) {
      getUserAccess().then((res) => {
        retrieveUserAccess();
        updateUserProfile(res)
        setLoadUser(false);
      });
    }
  }, [loadUser]);

  useEffect(() => {
    retriveAuthTokenFromLocalStorage().then((value) => {
      if (value !== null && value !== undefined && value.length > 0) {
        setToken(value);
      }
    });

  }, []);

  return (
    <UserAccessContext.Provider value={{
      userAccess,
      setUserAccess,
      userProfile,
      setUserProfile,
      companyStatus,
      setCompanyStatus,
      companyStatusLoading,
      setCompanyStatusLoading,
      setLoadUser
    }}
    >
      {props.children}
    </UserAccessContext.Provider>
  );
};

export default AuthProvider;

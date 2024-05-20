import { Button, notification, Skeleton, Tabs } from "antd";
import { useRouter } from "next/router";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import localforage from "localforage";
import { LoadingOutlined } from "@ant-design/icons";

import Layout from "../../components/Layouts/DashboardLayout/Layout";
import { StyledSettings } from "../../components/Tables/PayrollTable.styled";
import { getCompanyInfo } from "../../helpers/settings/settings";
import EditCompanyInfo from "../../components/Settings/Modals/EditCompany";
import { settingsTabsItem } from "../../components/Projects/SettingsPageTabs";
import { capitalizeAll } from "../../helpers/capitalize";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import ErrorComponent from "@/components/Error/Error";
import RenderLoader from "@/components/Loaders/renderLoader";
import { accessEntityRetrieval, accessRouteRetrieval } from "@/utils/accessLevels";

// const { Search } = Input;
export default function Settings() {
  const [companyInfo, setCompanyInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [companyEdited, setcompanyEdited] = useState(false);

  const router = useRouter();
  const { companyStatus, userProfile, companyStatusLoading } = useUserAccess();
  const { is_staffing } = companyStatus
  const { user_access } = userProfile;
  const { tab } = router.query;

  useEffect(() => {

    getCompanyInfo()
      .then((res) => {
        setCompanyInfo(res?.data?.companies[0]);
        setLoading(false);
      })
      .catch((error) => {
        notification.error({
          message: error.name,
          description: error.message,
        });
      });
  }, []);

  useEffect(() => {
    if (companyEdited) {
      setLoading(true);
      getCompanyInfo()
        .then((res) => {
          console.log(res);
          setCompanyInfo(res?.data?.companies[0]);
          setLoading(false);
        })
        .catch((error) => {
          notification.error({
            message: error.name,
            description: error.message,
          });
        });
    }
    setcompanyEdited(false);
  }, [companyEdited]);

  const EditCompany = () => {
    setShowEdit(true);
  };

  const onChange = (key) => {
    router.replace({
      pathname: `/settings`,
      query: { tab: key }
    });
  };

  if (companyStatus?.company_name === "" || user_access?.length === 0) {
    return <RenderLoader />
  } else if (!accessRouteRetrieval(user_access, 'settings')) {
    return <ErrorComponent status={403} backHome={true} />
  }
  return (
    <>
      <StyledSettings>
        {loading ? (
          <Skeleton
            avatar
            paragraph={{ rows: 2 }}
            className="settingsHeader"
            active
          />
        ) : (
          <div className="settingsHeader">
            <div className="settings-0 w-full">
              <div className="logo">

                {companyInfo?.img_url ? (
                  <img
                    className="logo"
                    src={companyInfo?.img_url}
                    style={{ height: "70px", width: "70px", borderRadius: "50%" }}
                  />
                ) : (
                  <div className="w-16 h-16 bg-primary flex items-center justify-center rounded-full">
                    <span className="text-white font-bold text-lg">
                      {companyInfo?.company_name && companyInfo?.company_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className="companyinfo">
                <span className="companytitle">{companyInfo?.company_name && capitalizeAll(companyInfo?.company_name)}</span>
                <div className="companybody">
                  <div className="address">
                    <span className="address-0">Address: </span>
                    <span className="address-1">{companyInfo?.address}</span>
                  </div>
                  <div className="tin">
                    <span className="tin-0">Tin: </span>
                    <span className="tin-1">{companyInfo?.tin_number}</span>
                  </div>
                </div>
                <div className="companyfooter">
                  <div className="phone">
                    <span className="phone-0">Phone: </span>
                    <span className="phone-1">{companyInfo?.phone}</span>
                  </div>
                  <div className="email">
                    <span className="email-0">Email: </span>
                    <span className="email-1">{companyInfo?.email}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="settings-1">
              {user_access && accessEntityRetrieval(user_access, 'settings', 'edit company info') && (
                <Button
                  type="secondary"
                  className="actionSecondaryBtn"
                  icon={<Icon icon="lucide:edit" color="#fa8c16" />}
                  onClick={EditCompany}
                >
                  Edit Company Info
                </Button>
              )}
              <EditCompanyInfo
                showEdit={showEdit}
                setShowEdit={setShowEdit}
                companyInfo={companyInfo}
                setcompanyEdited={setcompanyEdited}
              />
            </div>
          </div>
        )}
        <div className="tabs-container">
          <Tabs
            defaultActiveKey={tab}
            items={settingsTabsItem(user_access, is_staffing)}
            size="large"
            onChange={onChange}
            tabBarGutter={100}
            tabBarStyle={{
              backgroundColor: "inherit",
              borderBottom: "1px solid #CCDBE1",
            }}
          />
        </div>
      </StyledSettings>
    </>
  );
}

Settings.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

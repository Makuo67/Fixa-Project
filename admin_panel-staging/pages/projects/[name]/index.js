import { StyledProjectName } from "../../../components/Projects/StyledProjectName.styled";
import { useRouter } from "next/router";
import Layout from "../../../components/Layouts/DashboardLayout/Layout";
import { Tabs, Spin } from "antd";
import { useContext, useEffect, useState } from "react";
import Stats, { StyledStatsContainer } from "../../../components/Stats/Stats";
import { Icon } from "@iconify/react";
import { projectTabsItem } from "../../../components/Projects/ProjectPageTabs";
import CompanyLogo from "../../../components/shared/CompanyLogo";
import { ProjectStatuses } from "../../../components/Projects/ProjectStatuses";
import { ProjectButton } from "../../../components";
import { getSingleProjectDetails } from "../../../helpers/projects/projects";
import { ProjectInfoSkeletons } from "../../../components/Skeletons/ProjectAggregatesSkeletons";
import { PusherContext } from "../../../context/PusherContext";
import { LoadingOutlined } from "@ant-design/icons";
import { capitalizeAll } from "../../../helpers/capitalize";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import ErrorComponent from "@/components/Error/Error";
import RenderLoader from "@/components/Loaders/renderLoader";
import { toMoney } from "@/helpers/excelRegister";
import {
  checkAccessToPage,
  checkUserAccessToEntity,
  checkUserAccessToSubEntity,
} from "@/utils/accessLevels";

const antSpinIcon = (
  <LoadingOutlined
    style={{
      fontSize: 16,
    }}
    spin
  />
);
export default function ProjectName() {
  const router = useRouter();
  const [projectDetails, setProjectDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectPageAccess, setProjectPageAccess] = useState(false);
  const [editProjectEntityAccess, setEditProjectEntityAccess] = useState(false);
  const [detailsAccess, setDetailsAccess] = useState(false);
  const [attendanceAccess, setAttendanceAccess] = useState(false);
  const [tradesAccess, setTradesAccess] = useState(false);
  const [supervisorsAccess, setSupervisorsAccess] = useState(false);
  const [suppliersAccess, setSuppliersAccess] = useState(false);

  const { companyStatus, companyStatusLoading, userProfile } = useUserAccess();
  const { user_access, user_level } = userProfile;

  const { name, id, tab } = router.query;

  const {
    envoiceLoading,
    setEnvoiceLoading,
    setRatesLoading,
    projectStatusLoading,
    setProjectStatusLoading,
    projectUpdateLoading,
    setProjectUpdateLoading,
  } = useContext(PusherContext);

  const onChange = (key) => {
    router.replace({
      pathname: `/projects/${name}`,
      query: { id: id, tab: key },
    });
    if (key.toString() === "2") {
      setRatesLoading(true);
    }
  };

  useEffect(() => {
    if (router.isReady) {
      getSingleProjectDetails(router.query.id).then((res) => {
        setLoading(false);
        setProjectDetails(res?.data);
        setProjectStatusLoading(false);
        setProjectUpdateLoading(false);
        setEnvoiceLoading(false);
      });
    }
  }, [router.isReady, loading, projectStatusLoading, projectUpdateLoading]);

  useEffect(() => {
    if (user_access) {
      setProjectPageAccess(checkAccessToPage("project", user_access));
      setDetailsAccess(
        checkUserAccessToEntity("project", "details", user_access)
      );
      setAttendanceAccess(
        checkUserAccessToEntity("project", "attendance", user_access)
      );
      setTradesAccess(
        checkUserAccessToEntity("project", "trades", user_access)
      );
      setSupervisorsAccess(
        checkUserAccessToEntity("project", "supervisors", user_access)
      );
      setSuppliersAccess(
        checkUserAccessToEntity("project", "suppliers", user_access)
      );
      setEditProjectEntityAccess(
        checkUserAccessToEntity("project", "edit project", user_access)
      );
    }
  }, [user_access]);

  if (companyStatus?.company_name === "" || user_access.length === 0) {
    return <RenderLoader />;
  } else if (!checkAccessToPage("project", user_access)) {
    return <ErrorComponent status={403} backHome={true} />;
  }
  return (
    <>
      <StyledProjectName>
        <div className="container">
          <div className="project-name-header">
            {loading || projectUpdateLoading ? (
              <ProjectInfoSkeletons
                title={false}
                avatar={true}
                size="small"
                rows={2}
                width="500px"
              />
            ) : (
              <div className="project-name-header-left">
                {projectDetails?.info?.project_profile_url ? (
                  <div className="logo">
                    <CompanyLogo
                      url={projectDetails?.info?.project_profile_url}
                    />
                  </div>
                ) : (
                  <div>
                    <span
                      className="cardImage"
                      style={{
                        backgroundColor: "#DCEBF1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                      }}
                    >
                      {projectDetails?.info?.name
                        ? projectDetails?.info?.name
                            .split(" ")
                            .map((word) => word.charAt(0).toUpperCase())
                            .join("")
                        : "-"}
                    </span>
                  </div>
                )}
                <div className="name">
                  <h2>{capitalizeAll(projectDetails?.info?.name)}</h2>
                  <div className="name-sub">
                    {projectStatusLoading ? (
                      <Spin indicator={antSpinIcon} />
                    ) : (
                      <ProjectStatuses
                        currentStatus={projectDetails?.info?.status}
                        project={projectDetails?.info?.name}
                        isDrop={
                          user_level &&
                          user_level.name.toLowerCase() === "level_1" &&
                          editProjectEntityAccess
                        }
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="project-name-header-right">
              {user_level &&
              user_level?.name?.toLowerCase() === "level_1" &&
              editProjectEntityAccess ? (
                <ProjectButton add={false} projectInfo={projectDetails?.info} />
              ) : null}
            </div>
          </div>

          <StyledStatsContainer>
            <Stats
              isProjectName={true}
              title="ACTIVE WORKERSS"
              value={toMoney(projectDetails?.aggregation?.total_active_workers)}
              loading={loading || envoiceLoading}
              // error={error}
              icon1={<Icon icon="vaadin:male" color="#0291c8" />}
              icon2={<Icon icon="fa:female" color="#c41d7f" />}
              title1="Men"
              title2="Women"
              value1={toMoney(
                projectDetails?.aggregation?.total_active_male_workers
              )}
              value2={toMoney(
                projectDetails?.aggregation?.total_active_female_workers
              )}
            />
            <Stats
              isProjectName={true}
              title="TOTAL SHIFTS"
              value={toMoney(projectDetails?.aggregation?.total_shifts)}
              loading={loading || envoiceLoading}
              // error={error}
              icon1={<Icon icon="fa-solid:sun" color="#faad14" />}
              icon2={<Icon icon="bi:moon-stars-fill" color="#8edefc" />}
              title1="Day"
              title2="Night"
              value1={toMoney(projectDetails?.aggregation?.total_day_shifts)}
              value2={toMoney(projectDetails?.aggregation?.total_night_shifts)}
            />
          </StyledStatsContainer>

          <div className="tabs-container">
            <Tabs
              defaultActiveKey={tab}
              items={projectTabsItem(
                user_level?.name?.toLowerCase(),
                detailsAccess,
                attendanceAccess,
                tradesAccess,
                supervisorsAccess,
                suppliersAccess
              )}
              size="large"
              onChange={onChange}
              tabBarGutter={100}
              tabBarStyle={{
                backgroundColor: "inherit",
                borderBottom: "1px solid #CCDBE1",
                // width: '80%'
              }}
            />
          </div>
        </div>
      </StyledProjectName>
    </>
  );
}
ProjectName.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

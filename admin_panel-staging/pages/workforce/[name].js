import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { StyledProfileTabs } from "../../components/WorkerProfile/Tabs/ProfileTabs.styled";
import { useRouter } from "next/router";
import { LoadingOutlined, ClearOutlined } from '@ant-design/icons';

import {
  Tabs,
  Form,
  Skeleton,
} from "antd";

import {
  GetWorkerEduInfo,
} from "../../redux/actions/workerprofile.actions";
import Layout from "../../components/Layouts/DashboardLayout/Layout";
import { StyledProfile } from "../../components/WorkerProfile/WorkerProfile.styled";

import {
  getProjects,
  getServices,
} from "../../redux/actions/workforce.actions";
import {
  fetchProfile,
  fetchWorkHistory,
  getWorkerPaymentMethod,
} from "../../helpers/worker-profile";
import { getAllDistricts } from "../../redux/actions/services.actions";
import PersonalDetails from "../../components/WorkerProfile/Tabs/PersonalDetails";
import Profile from "../../components/WorkerProfile/WorkerProfile";
import ProfileScore from "../../components/Leaderboard/ProfileScore";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import ErrorComponent from "@/components/Error/Error";
import { WorkforceEmptyOnboarding } from "@/components/Sections/WorkforceEmptyOnboarding";
import PaymentDetails from "@/components/WorkerProfile/Tabs/PaymentDetails";
import { accessRouteRetrieval, accessSubpageEntityRetrieval } from "@/utils/accessLevels";
import RenderLoader from "../../components/Loaders/renderLoader";
import dayjs from "dayjs";
import { WorkerHistory } from "@/components/WorkerProfile/WorkerHistory";

const WorkerProfile = () => {
  const [form] = Form.useForm();
  const [workingHistory, setWorkingHistory] = useState("");
  const [assessmentSubmitted, setAssessmentSubmitted] = useState(false);
  const [loader, setLoader] = useState(false);
  const [workerProfileLoading, setWorkerProfileLoading] = useState(true);
  const [personalDetailsLoader, setPersonalDetailsLoader] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [worker_rate, setWorker_rate] = useState(0);
  const [profile, setProfile] = useState(null);

  const [paymentMethods, setPaymentMethods] = useState([])
  const [paymentMethodUpdated, setPaymentMethodUpdated] = useState(true);

  // disabling the dates before onboarding
  const disableBeforeOnboardedDate = (current) => {
    const workerOnboardedDate = profile?.worker_information?.date_onboarded;
    if (!workerOnboardedDate) return false;
    // all dates before this will be disabled except the onboarded day
    return workerOnboardedDate && current && current.valueOf() < dayjs(workerOnboardedDate).startOf('day');
  }

  let { worker, worker_education } = useSelector(
    (state) => state.worker_profile
  );

  const { trades } = useSelector((state) => state.workforce.filters);
  const dispatch = useDispatch();
  const { companyStatus, userProfile } = useUserAccess();
  const { user_access, user_level } = userProfile

  const router = useRouter();
  const { worker_id, tab } = router.query;

  useEffect(() => {
    if (worker_id) {
      dispatch(GetWorkerEduInfo(worker_id));
      dispatch(getServices());
      dispatch(getProjects());
      dispatch(getAllDistricts()).then((data) => setDistricts(data));

      fetchWorkHistory(worker_id)
        .then((res) => {
          setWorkingHistory(res);
          if (res?.history?.length > 0) {
            setWorker_rate(res?.history[0]?.daily_earnings);
          } else {
            setWorker_rate(worker?.worker_information?.worker_rates[0]?.value);
          }
        })
        .catch((error) => {
          console.log("ERROR IN GETTING WORK HISTORY", error);
        });
    }

    fetchProfile(worker_id).then((prof) => {
      setProfile(prof);
    }).finally(() => {
      setWorkerProfileLoading(false);
    })
  }, [router.isReady, worker_id, ...Object.keys(router.query).filter(key => key !== 'tab')]);

  useEffect(() => {
    if (assessmentSubmitted) {
      dispatch(GetWorkerEduInfo(worker_id));
      fetchProfile(worker_id).then((prof) => {
        setProfile(prof);
        setLoader(false);
        setAssessmentSubmitted(false);
      });
    }
  }, [assessmentSubmitted]);

  useEffect(() => {
    if (worker_id && tab?.toString() === "3" || paymentMethodUpdated) {
      getWorkerPaymentMethod(worker_id).then((res) => {
        setPaymentMethods(res?.payment_methods)
        setPaymentMethodUpdated(false)
      })
    }
  }, [worker_id, tab, paymentMethodUpdated])

  const onTabChange = (value) => {
    // Update the query with the new tab value
    const query = { ...router.query };
    query.tab = value;

    // Replace the current URL with the updated query
    router.replace({
      pathname: router.pathname,
      query: query,
    });
  };

  const date_title = "Date";

  const backToRegister = () => {
    router.push("/workforce/worker-registration?type=bulk");
  }

  // if (workerProfileLoading) {
  //   return renderLoader();
  // }
  if (companyStatus?.company_name === "" || user_access?.length === 0) {
    return <RenderLoader />
  } else if (!accessRouteRetrieval(user_access, 'workforce', 'workers')) {
    return <ErrorComponent status={403} backHome={true} />
  }

  return (
    <>
      {
        !companyStatus.is_workforce_added ?
          <WorkforceEmptyOnboarding addWorkers={backToRegister} /> :
          <div>
            <StyledProfile>
              {loader || workerProfileLoading ? (
                <div style={{ margin: "5%" }}>
                  <Skeleton
                    active
                    avatar={{ size: 150 }}
                    paragraph={{
                      rows: 3,
                    }}
                    style={{ width: "80%" }}
                  />
                </div>
              ) : (
                <div>
                  <StyledProfile>
                    <Profile
                      worker={profile}
                      workingHistory={workingHistory}
                      setLoader={setLoader}
                      worker_id={worker_id}
                      setAssessmentSubmitted={setAssessmentSubmitted}
                    />
                  </StyledProfile>
                </div>
              )}
            </StyledProfile>
            <StyledProfileTabs>
              <Tabs
                activeKey={tab || "1"}
                tabBarGutter={100}
                tabBarStyle={{
                  backgroundColor: "inherit",
                  borderBottom: "1px solid #CCDBE1",
                }}
                onChange={onTabChange}
              >
                {userProfile && accessSubpageEntityRetrieval(userProfile?.user_access, 'workforce', 'workers', 'details') && (
                  <Tabs.TabPane tab="DETAILS" key="1"
                    style={{ height: "fit-content" }}
                  >
                    {personalDetailsLoader ? (
                      <Skeleton style={{ padding: "5%" }} active />
                    ) : (
                      <div className="details">
                        <PersonalDetails
                          worker={profile}
                          workerId={worker_id}
                          workerEdu={worker_education}
                          districts={districts}
                          worker_service={worker?.worker_information?.services}
                          trades={trades}
                          worker_rate={worker_rate}
                          setPersonalDetailsLoader={setPersonalDetailsLoader}
                          setAssessmentSubmitted={setAssessmentSubmitted}
                          setLoader={setLoader}
                          loader={loader}
                          workerProfileLoading={workerProfileLoading}
                          personalDetailsLoader={personalDetailsLoader}
                        />
                      </div>
                    )}
                  </Tabs.TabPane>
                )}
                {/* ====== WORK HISTORY TAB ====== */}
                {userProfile && accessSubpageEntityRetrieval(userProfile?.user_access, 'workforce', 'workers', 'work history') && (
                  <Tabs.TabPane tab="WORK HISTORY" key="2">
                    <WorkerHistory
                      worker_id={worker_id}
                      user_access={userProfile?.user_access}
                    />
                  </Tabs.TabPane>
                )}

                {/*  ============== PAYMENT DETAILS TAB ============= */}
                {userProfile && accessSubpageEntityRetrieval(userProfile?.user_access, 'workforce', 'workers', 'payment details') && (
                  <Tabs.TabPane tab="PAYMENT DETAILS" key="3">
                    {paymentMethodUpdated ? (
                      <Skeleton style={{ padding: "5%" }} active />
                    )
                      :
                      (<PaymentDetails paymentMethods={paymentMethods} setPaymentMethodUpdated={setPaymentMethodUpdated} />)
                    }
                  </Tabs.TabPane>
                )}

                {/*  ============= lEADERBOARD SCORES TAB=========== */}
                {userProfile && accessSubpageEntityRetrieval(userProfile?.user_access, 'workforce', 'workers', 'scores') && (
                  <Tabs.TabPane tab="SCORES" key="4">
                    <ProfileScore worker_id={worker_id} />
                  </Tabs.TabPane>
                )}
              </Tabs>
            </StyledProfileTabs>
          </div>
      }
    </>
  );
};

export default WorkerProfile;

WorkerProfile.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

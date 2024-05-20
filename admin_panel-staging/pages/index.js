import { Select, Radio, DatePicker, Button } from "antd";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import dayjs from "dayjs";
import moment from "moment";

import Layout from "../components/Layouts/DashboardLayout/Layout";
import Stats, { StyledStatsContainer } from "../components/Stats/Stats";
import { LoadingOutlined, SyncOutlined } from "@ant-design/icons";
import { toMoney } from "../helpers/excelRegister";
import { getDashboardMetrics, getDashboardProject } from "../helpers/dashboard/dashboard";
import { DashboardStyledLayout, LineChart, DonutChart } from "../components";

import { EmptyOnboarding } from "@/components/Sections/EmptyOnboarding";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import RenderLoader from "@/components/Loaders/renderLoader";

const { Option } = Select;

const PickerWithType = ({ type, onChange }) => {
  const defaultYear = dayjs();

  if (type === 'year' || type === 'month') {
    return <DatePicker picker={type} onChange={onChange} defaultValue={defaultYear} />;
  }
  return '';
};

export default function Home() {
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState('all_time');
  const [projects, setProjects] = useState([]);
  const [project, setProject] = useState('All Projects');
  const [error, setError] = useState(false);
  const [metricsQueries, setMetricsQueries] = useState({
    project: -1,
    year: -1,
    month: -1,
    redis: true,
  });
  const router = useRouter();
  const { companyStatus, companyStatusLoading, userProfile, setCompanyStatusLoading } = useUserAccess();

  //function to handle change of aggregates time
  const handleTimeChange = (e) => {
    if (e.target.value === 'year') setMetricsQueries({ ...metricsQueries, year: moment().year(), month: -1 });
    else if (e.target.value === 'month') setMetricsQueries({ ...metricsQueries, year: moment().year(), month: moment().month() + 1, redis: true });
    else {
      setMetricsQueries({ ...metricsQueries, year: -1, month: -1, redis: true });
    };
    setTime(e.target.value);
  }

  // function to handle change of the above projects
  const handleProjectChange = (value) => {
    setProject(value);
    setMetricsQueries({
      ...metricsQueries, project: parseInt(value), redis: true
    });
  }

  //function to handle changes of the date picker
  const handleDatePickerChange = (date, dateString) => {
    // separate year and month in datestring
    if (dateString.includes('-')) {
      const year = parseInt(dateString.split('-')[0]);
      const month = parseInt(dateString.split('-')[1]);
      setMetricsQueries({
        ...metricsQueries, year: year, month: month
      });
    }
    else if (dateString.length === 4) {
      setMetricsQueries({
        ...metricsQueries, year: parseInt(dateString), month: -1
      });
    }
    else {
      setMetricsQueries({ ...metricsQueries, year: -1, month: -1 });
      setTime('all_time');
    }
  }


  const fetchMetricsData = async (metricsQueries) => {
    setLoading(true);
    try {
      const res = await getDashboardMetrics(metricsQueries);
      if (res && res.data) {
        setMetrics(res.data);
        setLoading(false);
        setError(false);
      } else {
        setMetrics([]);
        setError(true);
      }
    } catch (err) {
      setMetrics([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setMetricsQueries({ ...metricsQueries, redis: false }) // set redis to false
  }

  useEffect(() => {
    //getting projects
    getDashboardProject().then((res) => {
      if (!Array.isArray(res)) {
        setProjects([]);
      }
      else {
        setProjects(res);
      }
    }).catch((err) => {
      setProjects([]);
    })
  }, []);

  /* useEffect for metrics data */
  useEffect(() => {
    // Fetching the metrics data with the given queries
    if (metricsQueries) {
      fetchMetricsData(metricsQueries);
    }
  }, [metricsQueries]);

  if (companyStatusLoading) {
    return <RenderLoader />
  }
  // else if (!userProfile?.workforce_view) {
  //   return <ErrorComponent status={403} backHome={true} />
  // }
  return (
    <>
      {
        !companyStatus?.is_dashboard_available ?
          (<EmptyOnboarding companyStatusLoading={companyStatusLoading} companyStatus={companyStatus} setCompanyStatusLoading={setCompanyStatusLoading} />) :
          (<DashboardStyledLayout>
            <div className="dashboardContainer">
              <div>
                {/* === dashboard start here === */}
                <div className="dashboardFlexLayout">
                  <h1>Dashboard</h1>
                  <Select
                    // defaultValue='All Projects'
                    value={project}
                    onChange={handleProjectChange}
                    className="projectSelect"
                    style={{
                      color: "#171832",
                      fontWeight: 500,
                      fontSize: "16px",
                      borderRadius: "5px",
                      top: "-8px",
                    }}
                  >
                    <Option value="-1">All Projects</Option>
                    {projects?.map((item) => {
                      return (
                        <Option
                          value={item.id.toString()}
                          key={item.id}
                          title={item.name}
                          style={{ textTransform: "capitalize" }}
                        >
                          {item.name}
                        </Option>
                      );
                    })}
                  </Select>
                  {/* === Aggregates filters  === */}
                  <div style={{ width: "100%", display: "flex", justifyContent: "space-between", }}>
                    <div style={{ position: "relative", top: "-8px", gap: "10px", display: "flex", }}>
                      <Radio.Group
                        value={time}
                        onChange={handleTimeChange}
                        style={{
                          borderRadius: "10px",
                        }}
                      >
                        <Radio.Button value="all_time">All Time</Radio.Button>
                        <Radio.Button value="year">Year</Radio.Button>
                        <Radio.Button value="month">Month</Radio.Button>
                      </Radio.Group>
                      <PickerWithType
                        type={time}
                        defaultTimeValue={time}
                        onChange={handleDatePickerChange}
                      />
                    </div>
                    <div style={{ position: "relative", top: "-8px", right: "0px", gap: "10px", display: "flex", }}>
                      <Icon
                        icon="tabler:refresh"
                        color="#0291C8"
                        height={"24px"}
                        style={{ cursor: "pointer", transition: "transform 0.5s", transform: loading ? "rotate(360deg)" : "none", }}
                        onClick={handleRefresh}
                      />
                    </div>
                  </div>
                </div>

                {/* === Aggregates Stats  === */}
                <div>
                  <StyledStatsContainer>
                    <Stats
                      isDashboard={true}
                      title="total shifts"
                      value={toMoney(metrics?.total_shifts)}
                      loading={loading}
                      error={error}
                      icon={
                        <Icon
                          icon="fa6-solid:person-digging"
                          color="#0291C8"
                          height={"18px"}
                        />
                      }
                      icon1={<Icon icon="fa-solid:sun" color="#faad14" />}
                      icon2={<Icon icon="bi:moon-stars-fill" color="#8edefc" />}
                      metrics={metrics}
                    />
                    <Stats
                      isDashboard={true}
                      title="active workers"
                      value={toMoney(metrics?.active_workers)}
                      loading={loading}
                      error={error}
                      icon={
                        <Icon
                          icon="mdi:account-hard-hat-outline"
                          color="#0291c8"
                          height={"24px"}
                        />
                      }
                      icon1={<Icon icon="vaadin:male" color="#0291c8" />}
                      icon2={<Icon icon="fa:female" color="#c41d7f" />}
                      metrics={metrics}
                    />
                    <Stats
                      isDashboard={true}
                      title="total projects"
                      value={toMoney(metrics?.total_project)}
                      loading={loading}
                      error={error}
                      metrics={metrics}
                      project={metricsQueries.project}
                      icon={
                        <Icon icon="fa-solid:tools" color="#0291c8" height={"18px"} />
                      }
                      icon1={
                        <Icon
                          icon="material-symbols:play-arrow-rounded"
                          color="#52C41A"
                          height={18}
                          width={18}
                          style={{
                            backgroundColor: "#F4FFB8",
                            borderRadius: "2px",
                          }}
                        />
                      }
                      icon2={
                        metricsQueries.project === -1 ? (
                          <Icon
                            icon="material-symbols:pause-rounded"
                            color="#fa541c"
                            height={18}
                            width={18}
                            enableBackground={"#FFD8BF"}
                            style={{
                              backgroundColor: "#FFD8BF",
                              borderRadius: "2px",
                              padding: "2px",
                            }}
                          />
                        ) : ''
                      }
                    />
                  </StyledStatsContainer>
                </div>
              </div>

              {/* === Workers Charts  === */}
              <div className="dashboardDonutSection">
                <div className="dashboardDonutChart">
                  <h2>Total Workers per Service</h2>
                  {loading ? (
                    <div className='chartLoading'>
                      <LoadingOutlined style={{ fontSize: "160px", color: '#171832' }} />
                    </div>
                  ) : (
                    <DonutChart key={'workers-chart'}
                      chartData={metrics?.graph_total_workers_by_services}
                    />
                  )}
                </div>
                <div className="dashboardDonutChart">
                  <h2>Total Workers per Projects</h2>
                  {loading ? (
                    <div className='chartLoading'>
                      <LoadingOutlined style={{ fontSize: "160px", color: '#171832' }} />
                    </div>
                  ) : (
                    <DonutChart key={'project-chart'}
                      chartData={metrics?.graph_total_workers_by_projects}
                    />
                  )}
                </div>
              </div>

              {/* === Shift Chart  === */}
              <div className="dashboardLineSection">
                <div className="lineChartHead">
                  <h2>Shifts</h2>
                  <h3>
                    Total: <span>{
                      loading ? <SyncOutlined spin color="#171832" /> :
                        error ? '-' : toMoney(metrics?.graph_shift?.total)
                    }</span>
                  </h3>
                </div>
                <div className="lineChart">
                  {loading ? (
                    <div className='chartLoading'>
                      <LoadingOutlined style={{ fontSize: "160px", color: '#171832' }} />
                    </div>
                  ) : (
                    <LineChart lineData={metrics?.graph_shift} />
                  )}
                </div>
              </div>
            </div>
          </DashboardStyledLayout>)
      }
    </>
  );
}

Home.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};


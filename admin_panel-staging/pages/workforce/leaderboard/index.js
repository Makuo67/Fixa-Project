import {
    Col,
    Row,
    Tabs,
    Tooltip,
    Tag,
    Badge,
    Empty,
    Button
} from "antd";
import {
    CheckCircleTwoTone,
    CloseCircleTwoTone, LoadingOutlined, SyncOutlined
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import Layout from "../../../components/Layouts/DashboardLayout/Layout";
import { useRouter } from "next/router";
import { getMetricDistribution, getWorkerLeaderboard } from "../../../helpers/workforce/leaderboard";
import DynamicTable from "../../../components/Tables/DynamicTable";
import ScoreDisplay from "../../../components/Leaderboard/ScoreDisplay";
import TopPerformers from "../../../components/Leaderboard/TopPerformers";
import MetricHistogram from "../../../components/Leaderboard/MetricHistogram";
import { MissingData } from "../../../components";
import { capitalizeAll } from "../../../helpers/capitalize";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import ErrorComponent from "@/components/Error/Error";
import { WorkforceEmptyOnboarding } from "@/components/Sections/WorkforceEmptyOnboarding";
import RenderLoader from "@/components/Loaders/renderLoader";
import { accessRouteRetrieval } from "@/utils/accessLevels";
import { USER_LOGIN_LOADING } from "@/redux/constants/user.constants";

export default function Leaderboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState([]);
    const [isLeaderboardAvalaible, setIsLeaderboardAvailable] = useState(false);

    const [distribution, setDistribution] = useState({
        loading: true,
        error: false,
        data: []
    })

    const { metric } = router.query;
    const { userAccess, companyStatus, companyStatusLoading, userProfile } = useUserAccess();
    const { user_access, user_level } = userProfile

    useEffect(() => {
        setLoading(true)
        if (!metric) {
            router.replace({
                pathname: "/workforce/leaderboard",
                query: { metric: "total" }
            });
        }
        setDistribution({ ...distribution, loading: true })

        if (metric !== undefined) {
            getWorkerLeaderboard(`&_sort=${metric || "total"}_score:DESC`).then((data) => {
                const leaderboardData = data?.result
                for (let i = 0; i < leaderboardData?.length; i++) {
                    leaderboardData[i].place = i + 1;
                }
                setData(leaderboardData)
                setIsLeaderboardAvailable(data?.meta > 0)
                setLoading(false)
            })

            getMetricDistribution(metric + "_score" || "total_score").then((data) => {
                setDistribution({ loading: false, error: false, data: data })
            })

        }

    }, [router.isReady, router.query, metric]);

    // console.log(data)
    const columns = [
        {
            title: "PLACE",
            dataIndex: "place",
            key: "place",
            width: 100,
        },
        {
            title: "NAME",
            dataIndex: "worker",
            key: "worker.name",
            render: (value, _) => {
                return (
                    <Tooltip
                        title={_.is_rssb_verified === "green" ? "This name is verified." : _.is_rssb_verified === "red" ? "This name is not verified." : ""}
                        style={{ textTransform: "capitalize" }}
                    >
                        <span className="names cursor-pointer">{_.first_name ? capitalizeAll(_.first_name) : "-"}{" "}{_?.last_name ? capitalizeAll(_.last_name) : "-"} {" "}</span>
                        {_.is_rssb_verified === "green" ? (
                            <CheckCircleTwoTone twoToneColor="#52c41a" />) : data.is_rssb_verified === "red" ? (
                                <CloseCircleTwoTone twoToneColor="#F5222D" />) : ""}
                    </Tooltip>
                );
            }

        },
        {
            title: "PHONE",
            dataIndex: "phone_number",
            key: "phone_number",
            render: (value, _) => {
                return (<Tooltip
                    title={value === "" || !value ? "This worker have no phone number" : _?.is_momo_verified_and_rssb_desc}
                >
                    {value}{" "}
                    {value === "" || !value ? (
                        <Tag color={"orange"}>
                            <Badge
                                status={"warning"}
                                text={<span
                                    style={{
                                        color: "orange", textTransform: "capitalize",
                                    }}
                                >
                                    {"No Phone number"}
                                </span>}
                            />
                        </Tag>
                    ) : _.is_momo_verified_and_rssb === "green" ? (
                        <CheckCircleTwoTone twoToneColor="#52c41a" />)
                        : _.is_momo_verified_and_rssb === "blue" ? (
                            <CheckCircleTwoTone twoToneColor="#0063F8" />)
                            : (<CloseCircleTwoTone twoToneColor="#F5222D" />)
                    }
                </Tooltip>
                );
            },
        },
        {
            title: "ID NUMBER",
            dataIndex: "nid_number",
            key: "nid_number",
            render: (value, data) => {
                return (<Tooltip
                    title={
                        data.is_rssb_verified === "green"
                            ? "This NID number is verified." : data.is_rssb_verified === "red"
                                ? "This NID number is not verified." : ""
                    }
                >
                    {value}{" "}
                    {data.is_rssb_verified === "green" ? (
                        <CheckCircleTwoTone twoToneColor="#52c41a" />) : data.is_rssb_verified === "red"
                        ? (<CloseCircleTwoTone twoToneColor="#F5222D" />) : ""
                    }
                </Tooltip>)
            }
        },

        {
            title: "GENDER",
            dataIndex: "worker",
            key: "worker.gender",
            width: 100,
            render: (value, _) => value?.gender?.toLowerCase() == "male" ? "M" : "F"
        },
        {
            title: "SCORE",
            dataIndex: `${metric}_score`,
            key: `${metric}_score`,
            render: (value, data) => {
                return <ScoreDisplay value={value} difference={data[`${metric}_score_difference`]} />
            }
        },
    ];


    const onTabChange = (value) => {
        const query = {};
        Object.assign(query, router.query);
        query["metric"] = value


        router.replace({
            pathname: "/workforce/leaderboard",
            query,
        });
    };
    const items = [
        {
            key: 'total',
            label: `Total`,
            tooltip: `Total Score of all metrics.`,
        },
        {
            key: 'multiple_skills',
            label: `Multiple Skills`,
            tooltip: `Score calculated from worker skills tied to their attendance.`,
        },
        {
            key: 'technical',
            label: `Technical`,
            tooltip: `Score calculated from worker's Productivity and Quality of Work.`,
        },
        {
            key: 'flexibility',
            label: `Flexibility`,
            tooltip: `Score calculated from variations in worker's employment history data.`,
        },
        {
            key: 'attendance',
            label: `Attendance`,
            tooltip: `Score calculated from worker's attendance data of the past 2 weeks from now.`,
        },
    ];
    const handleTableChange = (pagination) => {
        // console.log("pagination", pagination);
    };

    const registerWorkers = () => {
        router.push("/workforce/worker-registration?type=bulk");
    }

    if (companyStatus?.company_name === "" || user_access?.length === 0) {
        return <RenderLoader />
    }
    else if (!accessRouteRetrieval(user_access, 'workforce', 'leaderboard')) {
        return <ErrorComponent status={403} backHome={true} />
    }

    return (
        <>
            {!companyStatus.is_workforce_added ?
                <WorkforceEmptyOnboarding addWorkers={registerWorkers} title={"Workforce Leaderboard"} /> :
                !isLeaderboardAvalaible && !loading ?
                    <div className="h-full flex items-center justify-center">
                        <Empty description="No leaderboard data found, please register workers and record your first attendance to get started." className="flex flex-col items-center justify-center" >
                            <Button
                                type="primary"
                                className="primaryBtn"
                                onClick={() => router.push("/workforce")}
                            >
                                Back to Workforce
                            </Button>
                        </Empty>
                    </div> :
                    <>
                        <h1 className="text-xl sm:text-3xl font-medium">Workforce Leaderboard</h1>
                        {router.isReady && (
                            <Tabs
                                defaultActiveKey={
                                    router.query.metric == null
                                        ? "total"
                                        : router.query.metric
                                }
                                onChange={(e) => onTabChange(e)}
                                // items={items}
                                tabBarGutter={100}
                                tabBarStyle={{
                                    backgroundColor: "inherit",
                                    borderBottom: "1px solid #CCDBE1",
                                }}
                            >
                                {items.map((item) => (
                                    <Tabs.TabPane
                                        key={item.key}
                                        tab={(
                                            <Tooltip title={item.tooltip}>
                                                <span>{item.label}</span>
                                            </Tooltip>
                                        )}
                                    />
                                ))}
                            </Tabs>
                        )}
                        {/* empty state if no data */}
                        {loading ? (<div className="h-full flex items-center justify-center">
                            <SyncOutlined spin={true} />
                        </div>) : data && data.length > 0 ? (
                            <Row gutter={[16, 16]} style={{ height: 100 }}>
                                <Col span={14}>
                                    {loading ? (
                                        <TopPerformers
                                            loading={loading}
                                        />
                                    ) : (
                                        <TopPerformers
                                            loading={loading}
                                            first={{
                                                name: data[0]?.first_name + " " + data[0]?.last_name,
                                                score: data[0] && data[0][`${metric}_score`]
                                            }}
                                            second={{
                                                name: data[1]?.first_name + " " + data[1]?.last_name,
                                                score: data[1] && data[1][`${metric}_score`]
                                            }}
                                            third={{
                                                name: data[2]?.first_name + " " + data[2]?.last_name,
                                                score: data[2] && data[2][`${metric}_score`]
                                            }}

                                        />
                                    )}
                                </Col>
                                <Col span={10}>
                                    {distribution?.loading ? (
                                        <MetricHistogram
                                            loading={distribution?.loading}
                                        />
                                    ) : (
                                        <MetricHistogram data={distribution?.data} loading={distribution?.loading} error={distribution?.error} />
                                    )}
                                </Col>
                                <Col span={24}>
                                    <DynamicTable
                                        loading={loading}
                                        rowKey={`id`}
                                        data={data}
                                        columns={columns}
                                        pagination={{
                                            total: data?.length,
                                        }}
                                        onChange={(value) => handleTableChange(value)}
                                        isLeaderboard={user_access && accessRouteRetrieval(user_access, 'workforce', 'leaderboard')}
                                    />
                                </Col>
                            </Row>
                        ) : (
                            <>
                                <Empty description={`No ${metric?.replace(/_/g, ' ')} scores found.`}
                                    className="flex flex-col items-center justify-center"
                                />
                            </>
                        )}

                    </>
            }
        </>


    );
}

Leaderboard.getLayout = function getLayout(page) {
    return <Layout>{page}</Layout>;
};
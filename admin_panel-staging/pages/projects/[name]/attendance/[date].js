
import { Input } from "antd";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";

import Layout from '../../../../components/Layouts/DashboardLayout/Layout';
import { AttendancePageStyles } from '../../../../components/Projects/ProjectAttendance/Attendancepage.styled';
import DynamicTable from '../../../../components/Tables/DynamicTable';
import userHelmet from '../../../../public/images/user-helmet.svg';
import { capitalizeAll } from "../../../../helpers/capitalize";
import PageHeaderList from "../../../../components/Projects/ProjectAttendance/PageHeaderList";

import {
    fetchAsyncAttendance,
    fetchAsyncAggregates,
    searchAttendanceList
} from "../../../../helpers/projects/attendance/attendanceList";
import ExportButton from "../../../../components/shared/ExportButton";
import AttendanceStatSkeleton from "../../../../components/shared/AttendanceStatSkeleton";
import { retriveUserDataFromLocalStorage } from "../../../../helpers/auth";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import ErrorComponent from "@/components/Error/Error";
import RenderLoader from "@/components/Loaders/renderLoader";
import { StyledProjectName } from "@/components/Projects/StyledProjectName.styled";
import AttendanceDetailsFilters from "@/components/Filters/AttendanceDetailsFilters";
import { useRouter } from "next/router";
import { accessRouteRetrieval, checkUserAccessToEntity, checkUserAccessToSubEntity } from "@/utils/accessLevels";
import { SearchField } from "@/components/Search/SearchField";

const helmet = <Image src={userHelmet} alt="user-icon" />;

const attendanceListColumns = [
    {
        title: "NAME",
        dataIndex: "names",
        key: "name",
        render: (text) => { return (<span className="names cursor-pointer">{capitalizeAll(text)}{" "}</span>) }
    },
    {
        title: "ADDRESS",
        dataIndex: "address",
        key: "address",
        render: (text) => !text || text === null ? '-' : capitalizeAll(text)
    },
    {
        title: "GENDER",
        dataIndex: "gender",
        key: "gender",
        render: (text) => !text || text === null ? '-' : String(text).charAt(0).toUpperCase()

    },
    {
        title: "SERVICE",
        dataIndex: "service",
        key: "service",
        // Uppercasing the first letter
        render: (text) => !text || text === null ? '-' : String(text.charAt(0).toUpperCase() + text.slice(1)),
    },
];

const Attendance = ({ date, project, shift, id, attendance_status_id }) => {
    const [attendanceList, setAttendanceList] = useState([]);
    const [attendanceAggregates, setAttendanceAggregates] = useState([]);
    const [tableLoading, setTableLoading] = useState(true);
    const [totalAttendance, setTotalAttendance] = useState(0);
    const [attendanceDate, setAttendanceDate] = useState(date);
    const [projectID, setProjectID] = useState("");
    const [showSizechanger, setShowSizechanger] = useState(true);
    const [query, setQuery] = useState("");
    const [statLoading, setStatLoading] = useState(true);
    const [user, setUser] = useState({});

    const [approveAccess, setApproveAccess] = useState(false)
    const [declineAccess, setDeclineAccess] = useState(false)
    const [entityAccess, setEntityAccess] = useState(false)

    const { companyStatus, userProfile } = useUserAccess();
    const { user_access, user_level } = userProfile

    const router = useRouter()
    const { gender, service } = router.query;


    const formatDate = (date) => {
        let formatedDate = "";
        let strArray = date?.split("-");
        formatedDate = strArray?.reverse().join("/");
        return formatedDate;
    };

    const fetchAttendance = (date, project_id, shift, gender, service) => {
        setTableLoading(true);
        fetchAsyncAttendance(date, project_id, shift, gender, service)
            .then((res) => {
                setAttendanceList(res);
                setTableLoading(false);
                setTotalAttendance(res.length);
            })
            .catch((error) => {
                console.log("ERROR IN GETTING ATTENDANCE", error);
                setAttendanceList([]);
                setTableLoading(false);
            }).finally(() => {
                setTableLoading(false);
            });
    };

    useEffect(() => {
        setEntityAccess(checkUserAccessToEntity("project", "attendance", user_access))
        setApproveAccess(checkUserAccessToSubEntity("project", "attendance", "approved", user_access))
        setDeclineAccess(checkUserAccessToSubEntity("project", "attendance", "declined", user_access))
    }, [user_access]);

    useEffect(() => {
        if (date && project) {
            setAttendanceDate(date);
            setProjectID(project);
            // Fetch attendance
            fetchAttendance(date, project, shift, gender, service);
            // Fetch aggregates
            fetchAsyncAggregates(date, project, shift, id, gender, service)
                .then((res) => {
                    setAttendanceAggregates(res.reverse());
                    setStatLoading(false);
                })
                .catch((error) => {
                    setStatLoading(false);
                    console.log("ERROR IN GETTING AGGREGATES", error);
                }).finally(() => {
                    setStatLoading(false);
                });

            // get logged in user
            retriveUserDataFromLocalStorage().then((res) => {
                setUser(res)
            });
        } else {
            setTableLoading(true);
        }
    }, [router.isReady, router.query]);

    const handleSearch = (value) => {
        if (value.length >= 1) {
            setQuery(value);
            // setTableLoading(true);
            searchAttendanceList(value).then((res) => {
                setAttendanceList(res);
                setTotalAttendance(res.length);
                setTableLoading(false);
            });
        } else {
            setQuery("");
            fetchAttendance(date, project, shift, gender, service);
        }
    };

    const handlePagination = () => {
        return null;
    };

    if (companyStatus?.company_name === "" || user_access?.length === 0) {
        return RenderLoader()
    }
    else if (!checkUserAccessToEntity("project", "attendance", user_access)) {
        return <ErrorComponent status={403} backHome={true} />
    }
    return (
        <StyledProjectName>
            <AttendancePageStyles>
                <div className="w-full space-y-11">
                    {/* ========== Page header SECTION ======= */}
                    {entityAccess ?
                        <>
                            <div>
                                <PageHeaderList
                                    attendanceDate={attendanceDate} formatDate={formatDate}
                                    attendanceId={id}
                                    shift={shift}
                                    date={date}
                                    attendance_status_id={attendance_status_id}
                                    user={user}
                                    declineAccess={declineAccess}
                                    approveAccess={approveAccess}
                                />
                            </div>
                            <div>
                                <AttendanceDetailsFilters
                                    isExpandable
                                    showAdvancedFilters
                                    hasPagination
                                    filter_fields={[
                                        "service",
                                        "gender"
                                    ]}
                                />
                            </div>
                        </> : ""}
                    <div>
                        {statLoading ? (<AttendanceStatSkeleton />) :
                            <div className="flex flex-wrap gap-4">
                                <>
                                    {attendanceAggregates?.map((item, index) => {
                                        if (item.numbers != 0) {
                                            return (
                                                <>
                                                    <div className="flex flex-col bg-white hover:border border-[#E5E5E5] rounded-md shadow-md gap-2 w-[250px] p-4 cursor-pointer">
                                                        <div className="flex justify-between">
                                                            <span className="capitalize text-[#828282] font-bold text-base">{item.title !== "null" ? item.title : "No-service"}</span>
                                                            <span>{helmet}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[#0B1354] font-bold text-xl">{item.numbers}</span>
                                                        </div>

                                                    </div>
                                                </>

                                            );
                                        }
                                    })}
                                </>
                            </div>
                        }

                    </div>
                    <div>
                        {/* ========== LIST TABLE =========  */}

                        <DynamicTable
                            data={attendanceList}
                            columns={attendanceListColumns}
                            loading={tableLoading}
                            extra_middle={[
                                <SearchField key={0} value={query} handleSearch={handleSearch} />
                            ]}
                            extra_right={[
                                <ExportButton
                                    date={date}
                                    project={project}
                                    shift={shift}
                                    key={0}
                                />
                            ]}
                            pagination={{
                                total: totalAttendance,
                                showSizeChanger: showSizechanger,
                            }}
                            onChange={(value) => handlePagination(value)}
                            workerClicked={user_access && accessRouteRetrieval(user_access, 'workforce', 'workers')}
                            rowKey={(record) => record.id}
                        />
                    </div>
                </div>
            </AttendancePageStyles>
        </StyledProjectName>
    );
};
export default Attendance;





export async function getServerSideProps(context) {
    const { date } = context.params;
    const { project, id, shift, attendance_status_id } = context.query;
    return {
        props: {
            date: date,
            project: project,
            id: id,
            shift: shift,
            attendance_status_id,

        },
    };
}

Attendance.getLayout = function getLayout(page) {
    return <Layout>{page}</Layout>;
};
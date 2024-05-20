import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    UnorderedListOutlined,
} from "@ant-design/icons";
import { Button, Spin, Tooltip } from "antd";
import localforage from "localforage";
import moment from "moment";

import { StyledExpandedAttendance } from "./StyledExpandedAttendance.styled";
import { getAttendanceDetails } from "../../../helpers/projects/projects";
import ConfirmAttendance from "../../Modals/ProjectModals/ConfirmAttendance";
import { capitalizeAll } from "../../../helpers/capitalize";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import { set } from "idb-keyval";
import { checkUserAccessToEntity, checkUserAccessToSubEntity } from "@/utils/accessLevels";

const ExpandedAttendance = (props) => {
    const [shift, setShift] = useState(props.data.shift_name);
    const [date, setDate] = useState(props.data.date);
    const [statusB, setStatus] = useState(props.data.status);
    const [loggedUser, setLoggedUser] = useState({});
    const [numbers, setNumbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openConfirmModal, setOpenConfirmModal] = useState(false);
    const [actiontype, setActionType] = useState(null);
    const [approveAccess, setApproveAccess] = useState(false)
    const [declineAccess, setDeclineAccess] = useState(false)
    const [entityAccess, setEntityAccess] = useState(false)

    const { userAccess, userProfile } = useUserAccess();
    const { user_access, user_level } = userProfile

    const [payload, setPayload] = useState({
        attendance_id: "",
        status: "",
        approved_by: "",
        approved_by_name: "",
        approved_time: "",
        type: "",
    })

    const router = useRouter();
    const { id, name } = router.query

    useEffect(() => {
        localforage.getItem("user").then((data) => {
            setLoggedUser(data)
        })
    }, []);
    useEffect(() => {
        setEntityAccess(checkUserAccessToEntity("project", "attendance", user_access))
        setApproveAccess(checkUserAccessToSubEntity("project", "attendance", "approved", user_access))
        setDeclineAccess(checkUserAccessToSubEntity("project", "attendance", "declined", user_access))
    }, [user_access]);

    useEffect(() => {
        if (loading) {
            getAttendanceDetails(props.data.id)
                .then(
                    (res) => {
                        setNumbers(res);
                        setLoading(false);
                    }
                );
        }
    }, [loading]);

    const approve = async () => {
        setActionType("approve");
        setOpenConfirmModal(true)

        let approved_by = loggedUser.id;
        setPayload({
            attendance_id: props.data.id,
            attendance_status_id: props.data.attendance_status_id,
            status: "approved",
            approved_by: approved_by,
            approved_by_name: loggedUser?.firstname + " " + loggedUser?.lastname,
            approved_time: Date.now(),
            type: "routine",
        });
    };
    const decline = async () => {
        setActionType("decline");
        setOpenConfirmModal(true)
        let approved_by = loggedUser.id;

        setPayload({
            attendance_id: props.data.id,
            attendance_status_id: props.data.attendance_status_id,
            status: "declined",
            approved_by: approved_by,
            approved_by_name: loggedUser?.firstname + " " + loggedUser?.lastname,
            approved_time: Date.now(),
            type: "routine",
        });
    };

    const handleRouting = async () => {
        // Project ID
        let projectId = `project=${props.data.project_id}`;
        let attendance_date = moment(props.data.date).format("YYYY-MM-DD");
        let attendance_id = `id=${props.data.id}`;
        let attendance_status_id = `attendance_status_id=${props.data.attendance_status_id}`;
        let shift = `shift=${props.data.shift_name}`;
        let attendanceProps = { projectName: name, attendanceDate: attendance_date }
        // set("attendanceProps", attendanceProps)

        router.push({
            pathname: `/projects/${name}/attendance/${attendance_date}`,
            query: `${projectId}&${attendance_id}&${shift}&${attendance_status_id}`,
        });
    };

    const closeConfirm = () => {
        setOpenConfirmModal(false);
    };

    return (
        <>
            <ConfirmAttendance
                openConfirmModal={openConfirmModal}
                closeConfirm={closeConfirm}
                buttonText={`Yes`}
                cancelText={`No`}
                type={actiontype}
                shift={shift}
                date={date}
                payload={payload}
                setLoading={setLoading}
                setStatus={setStatus}
                setLoadPage={props.setLoading}
            />
            {loading ? (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Spin />
                </div>
            ) : (
                <StyledExpandedAttendance>
                    <div className="container">
                        <div className="numbers">
                            {numbers.map((item, index) => (
                                <div className="inner" key={index}>
                                    <h2>{item.total_workers}</h2>
                                    <span style={{ textTransform: "capitalize" }}>
                                        {item.service_name}
                                    </span>
                                </div>
                            ))}
                            {statusB == "approved" || statusB == "Approved" ? (
                                <div className="inner-approved">
                                    <h1>APPROVED BY</h1>
                                    <span>
                                        {props.data.approved_by_name !== null
                                            ? `${capitalizeAll(props.data?.approved_by_name)}`
                                            : ""}
                                    </span>
                                    <h1>{`${moment().format("DD/MM/YYYY h:mm A")}`}</h1>
                                </div>
                            ) : statusB == "declined" || statusB == "Declined" ? (
                                <div className="inner-declined">
                                    <h1>DECLINED BY</h1>
                                    <span>
                                        {props.data.approved_by_name !== null
                                            ? `${capitalizeAll(props.data?.approved_by_name)}`
                                            : ""}
                                    </span>
                                    <h1>{`${moment(props.data.approved_time).format(
                                        "DD/MM/YYYY h:mm A"
                                    )}`}</h1>
                                </div>
                            ) : (
                                ""
                            )}
                        </div>
                       {entityAccess ?( <>
                            {statusB == "pending" || statusB == "Pending" ? (
                                <div className="buttons">
                                    <Button type="secondary" className="flex flex-row items-center justify-center rounded-md text-primary border border-primary" onClick={handleRouting}>
                                        <UnorderedListOutlined />
                                        Attendance List
                                    </Button>
                                    <>
                                        {/* <Tooltip
                                        title={!entityAccess && !declineAccess ? "" : "You need a full access to decline this attendance."}
                                    > */}
                                        {entityAccess && declineAccess ? (<Button type="secondary" className="flex flex-row items-center justify-center text-bder-red rounded-md border border-bder-red"
                                            onClick={decline}
                                            disabled={entityAccess && declineAccess ? false : true}
                                        >
                                            <CloseCircleOutlined />
                                            Decline
                                        </Button>) : ""
                                        }
                                        {/* </Tooltip> */}
                                        {/* <Tooltip
                                        title={!entityAccess && !approveAccess ? "" : "You need a full access to approve this attendance."}
                                    > */}
                                        {entityAccess && approveAccess ? (<Button type="secondary" className="flex flex-row items-center justify-center text-green-2 hover:text-green-2 rounded-md border-green-2 hover:border-green-2"
                                            onClick={approve}
                                            disabled={entityAccess && approveAccess ? false : true}
                                        >
                                            <CheckCircleOutlined />
                                            Approve
                                        </Button>) : ""}
                                        {/* </Tooltip> */}
                                    </>

                                </div>
                            ) : statusB == "declined" || statusB == "Declined" ? (
                                <div className="buttons">
                                    {entityAccess ? (<Button  type="secondary"className="flex flex-row items-center justify-center rounded-md text-primary border border-primary" onClick={handleRouting}>
                                        <UnorderedListOutlined />
                                        Attendance list
                                    </Button>) : ""}

                                    {/* <Tooltip
                                    title={!entityAccess && !declineAccess  ? "" : "You need a full access to confirm this attendance."}
                                > */}
                                    {entityAccess && approveAccess ? (<Button type="secondaryw" className="flex flex-row items-center justify-center text-green-2 rounded-md border-green-2"
                                        onClick={approve}
                                        disabled={entityAccess && approveAccess ? false : true}
                                    >
                                        <CheckCircleOutlined />
                                        Confirm
                                    </Button>) : ""}
                                    {/* </Tooltip> */}
                                </div>
                            ) : (
                                <div className="buttons">
                                    {entityAccess ? (<Button type="secondary" className="flex flex-row items-center justify-center rounded-md text-primary border border-primary" onClick={handleRouting}>
                                        <UnorderedListOutlined />
                                        Attendance list
                                    </Button>) : ""}
                                </div>
                            )}
                        </>): ""}
                    </div>
                </StyledExpandedAttendance>
            )}
        </>
    );
};

export default ExpandedAttendance;

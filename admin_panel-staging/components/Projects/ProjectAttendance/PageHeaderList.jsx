import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button, Space, Modal, Input, Tooltip } from 'antd';
import { CloseCircleOutlined, CheckCircleOutlined, ArrowLeftOutlined, SyncOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
// import { ToastContainer } from "react-toastify";
// import 'react-toastify/dist/ReactToastify.css';

import { AttendancePageStyles } from "./Attendancepage.styled";
import { StyledAttendance } from "./Attendancelist.styled";
import { getAttendanceStatus, attendanceAction } from "../../../helpers/projects/attendance/attendanceList";
// import { notifyError } from "../../helpers/attendance/Notification
import { get, set } from 'idb-keyval';
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";

const { confirm, success } = Modal;

const PageHeaderList = ({ attendanceDate, formatDate, attendanceId, shift, date, attendance_status_id, user, declineAccess, approveAccess }) => {
    const [loading, setLoading] = useState(true);
    const [attendanceStatus, setAttendanceStatus] = useState({
        "id": "",
        "status": "",
        "attendance_id": "",
        "approved_by": "",
        "comment": ""
    });
    const [attendance_id, setAttendance_id] = useState('');
    const [attendancePayload, setAttendancePayload] = useState({
        attendance_id: "",
        date: "",
        status: "",
        attendance_status_id: ""
    });

    const router = useRouter();
    const { userAccess, userProfile } = useUserAccess();
    const { user_access } = userProfile

    const fetchStatus = (attendanceId) => {
        setLoading(true);
        getAttendanceStatus(attendanceId).then((res) => {
            setLoading(false);
            setAttendanceStatus({
                "id": res?.id,
                "status": res?.status,
                "attendance_id": res?.attendance_id,
                "approved_by": res?.approved_by,
                "comment": res?.comment
            });

        }).catch((err) => {
            setLoading(true);
        });
    }

    useEffect(() => {
        setAttendance_id(attendanceId);
        fetchStatus(attendanceId);
        setAttendancePayload({
            ...attendancePayload,
            date: date,
            attendance_id: attendanceId,
            attendance_status_id: attendance_status_id
        });
    }, []);

    // Handling approve and decline of attendance
    const handleAttendanceAction = async (payload, decline) => {
        let reason = await get('comment')
        if (!reason) {
            reason = ""
        }
        attendanceAction(
            payload,
            user,
            decline,
            reason
        )
            .then((res) => {
                if (res.includes("ERR_")) {
                    // notifyError(res);
                    fetchStatus(attendance_id);
                }
                else {
                    fetchStatus(attendance_id);
                    successModal({ attendanceDate: formatDate(attendanceDate), decline });
                }
            })
            .catch((err) => {
                console.log("ERROR in actions ==> ", err);
            });
    };

    const showConfirmModal = ({ attendanceDate, danger }) => {
        confirm({
            title: `Are you sure you want to ${danger ? "Decline" : "Approve"
                } attendance of ${attendanceDate}`,
            icon: <ExclamationCircleOutlined />,
            cancelText: "No",
            okText: "Yes",
            closable: false,
            onOk() {
                danger
                    ? handleAttendanceAction(attendancePayload, "decline")
                    : handleAttendanceAction(attendancePayload);
            },
            okButtonProps: {
                danger: danger,
                style: {
                    backgroundColor: "var(--primary)",
                    borderColor: "var(--primary)"
                }
            },
            onCancel() {
                // console.log("Closed");
            },
            width: 500,
            content: danger && (
                <div>
                    <p>Comment</p>
                    <Input
                        placeholder="Add Comment"
                        style={{
                            borderRadius: "6px",
                        }}
                        onChange={(e) => giveComment(e)}
                        required
                    />
                </div>
            ),
        });
    };

    const giveComment = (e) => {
        set('comment', e.target.value)
    };

    const successModal = ({ attendanceDate, decline }) => {
        success({
            title: `You have successfully ${decline ? "declined" : "confirmed"
                } the attendance of ${attendanceDate}`,
            okText: "Close",
            okButtonProps: { type: "default" },
            width: 500,
        });
    };

    // Customized Back icon
    const BackButton = () => (
        <Button type="text" icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}>
            Back
        </Button>
    );

    return (
        <div style={{ width: "100%" }}>

            <div style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                alignContent: 'center',
                width: 'auto',
                gap: '10px',
                backgroundColor: "#F2FAFD",
                padding: '24px 16px',
            }}>
                <div className="flex items-center justify-center">
                    <BackButton />
                    <p>
                        {`Attendance list ${formatDate(attendanceDate)} ${shift?.charAt(0).toUpperCase() + shift?.slice(1)} shift`}
                    </p>
                </div>
                <div style={{ display: 'flex' }}>
                    {loading ?
                        (<SyncOutlined spin style={{ fontSize: '20px', color: "var(--primary)" }} />) : (

                            <AttendancePageStyles>
                                {attendanceStatus && attendanceStatus.approved_by === null ? (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        gap: '20px 5px'
                                    }}>
                                        <>
                                            {/* <Tooltip
                                                title={declineAccess ? "" : "You need a full access to decline this attendance."}
                                            > */}
                                            {declineAccess ? (<Button
                                                type="secondary"
                                                className="buttonActions buttonDecline"
                                                icon={<CloseCircleOutlined />}
                                                key="1"
                                                onMouseEnter={() => {
                                                    setAttendancePayload({
                                                        ...attendancePayload,
                                                        status: "declined",
                                                    });
                                                }}
                                                onClick={() =>
                                                    showConfirmModal({
                                                        attendanceDate: formatDate(attendanceDate),
                                                        danger: true,
                                                    })
                                                }
                                                disabled={!declineAccess}
                                            >
                                                Decline
                                            </Button>) : ""}
                                            {/* </Tooltip> */}
                                            {/* <Tooltip
                                                title={approveAccess ? "" : "You need a full access to approve this attendance."}
                                            > */}

                                            {approveAccess ? (<Button
                                                type="secondary"
                                                className="buttonActions buttonApprove"
                                                icon={
                                                    <CheckCircleOutlined style={{ color: "#52C41A" }} />
                                                }
                                                key="2"
                                                style={{ color: "#52C41A" }}
                                                onMouseEnter={() => {

                                                    setAttendancePayload({
                                                        ...attendancePayload,
                                                        status: "approved",
                                                    });
                                                }
                                                }
                                                onClick={() =>
                                                    showConfirmModal({
                                                        attendanceDate: formatDate(attendanceDate),
                                                        danger: false,
                                                    })
                                                }
                                                disabled={!approveAccess}
                                            >
                                                Approve
                                            </Button>) : ""}
                                            {/* </Tooltip> */}
                                        </>
                                    </div>
                                ) : (
                                    <StyledAttendance>
                                        {attendanceStatus.status?.toLowerCase() === 'approved' ? (
                                            <Space className="statusSpace">
                                                <Button type="secondary" className="approved">
                                                    {attendanceStatus.status?.charAt(0).toUpperCase() + attendanceStatus.status?.slice(1)}
                                                </Button>
                                            </Space>

                                        ) : (
                                            <Space className="statusSpace">
                                                <Button type="secondary" className="declined">
                                                    {attendanceStatus.status?.charAt(0).toUpperCase() + attendanceStatus.status?.slice(1)}
                                                </Button>
                                            </Space>

                                        )}
                                    </StyledAttendance>
                                )
                                }
                            </AttendancePageStyles >
                        )}
                </div>
            </div>

        </div>
    )
}

export default PageHeaderList;

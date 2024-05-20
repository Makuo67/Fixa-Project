import { Icon } from "@iconify/react";
import {
  Modal,
} from "antd";
import { useState } from "react";
import Content from "../../Uploads/WorkerExcel.styled";
import WorkerShifts from "./WorkerShifts";

const EditPayrollShiftsModal = (props) => {
  const [attendanceData, setAttendanceData] = useState({
    date: "",
    shift_id: 1,
  });
  const [new_shifts, setNew_shifts] = useState({
    project_id: parseInt(props?.project_id),
    supervisor_id: "",
    shift_id: 1,
    assigned_worker_id: [parseInt(props.userData?.assigned_worker_id)],
    dates_shifts: [],
  });
  const [shifts_details, setShifts_details] = useState({
    project_id: parseInt(props?.project_id),
    assigned_worker_id: [parseInt(props.userData?.assigned_worker_id)],
  });
  const [worker_shifts, setWorker_shifts] = useState([]);
  const [showAddShiftSection, setshowAddShiftSection] = useState(false);
  const [realAttendance, setRealAttendance] = useState([]);

  const handleModalClose = () => {
    setAttendanceData((prevState) => {
      return { attendanceData, date: "" };
    });
    setWorker_shifts(realAttendance);
    setNew_shifts([]);
    props.closeShiftEditor();
  };

  const hideAddShiftSection = () => {
    setshowAddShiftSection(false);
  };
  const Title = () => (
    <Content confirmPayment={true}>
      <h1 className="import edit-shifts">Edit Worker Timesheet</h1>
    </Content>
  );

  return (
    <Modal
      // closeIcon={<Icon icon="fe:close" className="close" />}
      title={<Title />}
      open={props.editModal}
      style={{
        top: 10,
      }}
      // width={800}
      styles={{
        body: {
          height: "fit-content"
        }
      }}
      onCancel={handleModalClose}
      footer={null}
    >
      <WorkerShifts
        closeShiftEditor={props.closeShiftEditor}
        userData={props.userData}
        project_id={props?.project_id}
        changeExpandedState={props.changeExpandedState}
        loadPayrollInfo={props.loadPayrollInfo}
        setLoading={props.setLoading}
        startDate={props.startDate}
        endDate={props.endDate}
        attendanceData={attendanceData}
        setAttendanceData={setAttendanceData}
        worker_shifts={worker_shifts}
        setWorker_shifts={setWorker_shifts}
        new_shifts={new_shifts}
        setNew_shifts={setNew_shifts}
        hideAddShiftSection={hideAddShiftSection}
        showAddShiftSection={showAddShiftSection}
        setshowAddShiftSection={setshowAddShiftSection}
        realAttendance={realAttendance}
        setRealAttendance={setRealAttendance}
        shifts_details={shifts_details}
      />
    </Modal>
  );
};
export default EditPayrollShiftsModal;

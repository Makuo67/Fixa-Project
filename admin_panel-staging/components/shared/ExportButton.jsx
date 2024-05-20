import { useState, useEffect } from "react";
import { Button } from "antd";
import { CSVLink } from "react-csv";
import { Icon } from "@iconify/react";

// import { exportAttendance, getProjectsDetails }
import { exportAttendance, getProjectDetails } from "../../helpers/projects/attendance/attendanceList";
import { buildColumns, cleanDatafn } from "../../helpers/projects/attendance/attendanceList";

const exportIcon = <Icon icon="uil:file-export" color="var(--button-color)" height={18} />;

let cols = ["names", "address", "gender", "service"];

const exportCols = buildColumns(cols);

const ExportButton = ({ date, project, shift }) => {
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    if (!date) {
      return setLoading(true);
    }
    exportAttendance(date, project)
      .then((res) => {
        setAttendanceData(cleanDatafn(res));
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
      });

    // Fetching the project name
    getProjectDetails(project)
      .then((res) => {
        setProjectName(res?.name);
      })
      .catch((err) => {
        setProjectName("Unknown");
      });
  }, []);

  return (
    <Button type="primary" icon={exportIcon} className="primaryBtn" >
      {attendanceData.length > 0 ? (
        <CSVLink
          data={attendanceData}
          headers={exportCols}
          filename={`${projectName}_${date} ${shift.charAt(0).toUpperCase() + shift.slice(1)
            }_Shift Attendance.csv`}
        >
          {loading ? "Loading csv" : "Export"}
        </CSVLink>
      ) : (
        <>No data</>
      )}
    </Button>
  );
};

export default ExportButton;

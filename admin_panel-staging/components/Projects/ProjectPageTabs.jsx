import { ProjectDetails } from "./ProjectDetails/ProjectDetails";
import { ProjectRates } from "./ProjectRates/ProjectRates";
import { ProjectSupervisors } from "./ProjectSupervisors/ProjectSupervisors";
import AttendanceList from "./ProjectAttendance/AttendanceList";
import { ProjectPayees } from "./ProjectPayees/ProjectPayees";

export const projectTabsItem = (
  level,
  detailsAccess = true,
  attendanceAccess = true,
  tradesAccess = true,
  supervisorsAccess = true,
  suppliersAccess = true
) => {
  const tabs = [
    {
      key: '1',
      label: 'Details',
      children: <ProjectDetails />,
      show: detailsAccess,
    },
    {
      key: '2',
      label: 'Attendance',
      children: <AttendanceList />,
      show: attendanceAccess,
    },
    {
      key: '3',
      label: 'Trades',
      children: <ProjectRates />,
      show: tradesAccess,
    },
    {
      key: '4',
      label: 'Supervisors',
      children: <ProjectSupervisors />,
      show: supervisorsAccess,
    },
    {
      key: '5',
      label: 'Suppliers',
      children: <ProjectPayees />,
      show: suppliersAccess,
    },
  ];

  return level === 'level_2'
    ? tabs.slice(0, 2)
    : tabs.filter(tab => tab.show);
}



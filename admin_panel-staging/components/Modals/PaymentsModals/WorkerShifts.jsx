import { Icon } from "@iconify/react";
import { PlusOutlined } from "@ant-design/icons";
import { Button, DatePicker, Divider, Input, notification, Select } from "antd";
import moment from "moment";
import { useEffect, useState } from "react";
import {
  getWorkerShifts,
  addAttendance,
  deleteAttendance,
  updateAttendance,
} from "../../../helpers/payments/payroll/payroll";
import { capitalize, toMoney } from "../../../helpers/excelRegister";
import EditShiftsTable from "../../Tables/Modals/EditShiftsTable";
import ShiftsModalStyles from "./EditShiftsModalStyles";
import { retriveUserDataFromLocalStorage } from "../../../helpers/auth";
import { checkDateRange } from "../../../helpers/checkDateRange";
import { capitalizeAll } from "../../../helpers/capitalize";
import { handleError } from "../../../helpers/payments/error";

const WorkerShifts = (props) => {

  const [shifts, setShifts] = useState([]);
  const [shiftsLoading, setShiftsLoading] = useState(true);
  const [worker_payrollID, setWorker_payrollID] = useState(props.userData?.id);
  const [addShiftDisabled, setAddShiftDisabled] = useState(true);
  const [updatedShifts, setUpdatedShifts] = useState([]);
  const [worker_rate, setWorker_rate] = useState([]);
  const [user_id, setUser_id] = useState(null);
  const [shiftsUpdate, setShiftsUpdate] = useState(true);
  var check;
  const [shiftsAdded, setShiftsAdded] = useState(0);
  const [disableAddShiftButton, setDisableAddShiftButton] = useState(false);
  const [attendanceList, setAttendanceList] = useState([]);

  const sortAttendanceData = (attendance) => {
    attendance.sort((a, b) => new Date(b.date) - new Date(a.date));
    return attendance;
  };

  const makeAddShiftVisible = () => {
    setDisableAddShiftButton(true);
    props.setshowAddShiftSection(true);
  };

  const handleDateChanged = (e) => {
    props.setAttendanceData((pre) => {
      return {
        ...pre,
        date: moment(e).format("YYYY-MM-DD"),
      };
    });
    setAddShiftDisabled(false);
  };

  const handleShiftChanged = (e) => {
    props.setAttendanceData((pre) => {
      return {
        ...pre,
        shift_id: e,
      };
    });
  };

  useEffect(() => {
    retriveUserDataFromLocalStorage().then((user) => {
      setUser_id(user?.id);
      props.setNew_shifts((pre) => {
        return {
          ...pre,
          supervisor_id: user?.id,
        };
      });
    });

    getWorkerShifts(worker_payrollID).then((res) => {
      // console.log("---res", res);
      if (res?.attendance_shifts) {
        props.setWorker_shifts(sortAttendanceData(res?.attendance_shifts));
        props.setRealAttendance(sortAttendanceData(res?.attendance_shifts));
      }
      setWorker_rate(res?.worker_rate);
      setShiftsUpdate(false);
      setShifts(res?.shifts);
      setShiftsLoading(false);
    });
  }, [shiftsUpdate]);

  const handleSubmitShift = () => {
    setDisableAddShiftButton(true);
    props.hideAddShiftSection();
    check = checkDateRange(
      props.startDate,
      props.endDate,
      props.attendanceData.date
    );
    if (props.attendanceData.date == "") {
      notification.error({
        message: "Failed",
        description: `Date is required`,
      });
    } else {
      if (!check) {
        notification.error({
          message: "Failed",
          description: `Date is not within Payroll Period`,
        });
      } else {
        var exists = false;
        props.worker_shifts?.map((shift) => {
          if (
            moment(shift.date).format("YYYY-MM-DD") ===
            moment(props.attendanceData.date).format("YYYY-MM-DD")
          ) {
            exists = true;
          }
        });
        if (exists == false) {
          setShiftsAdded(shiftsAdded + 1);
          props.setNew_shifts((prevState) => {
            return {
              ...props.new_shifts,
              dates_shifts: props.attendanceList,
            };
          });
          props.setWorker_shifts([
            ...props.worker_shifts,
            {
              date: new Date(props.attendanceData.date),
              service_name: props.worker_shifts[0].service_name,
              value: props.worker_shifts[0].value,
              shift_name: props.worker_shifts[0].shift_name,
            },
          ]);

          setAttendanceList([
            ...attendanceList,
            {
              date: props.attendanceData.date,
              shift_id: props.attendanceData.shift_id,
            },
          ]);
          props.setAttendanceData((prevState) => {
            return {
              ...props.attendanceData,
              date: [...props.attendanceData.date, props.attendanceData],
            };
          });
          props.hideAddShiftSection();
        } else {
          notification.error({
            message: "Failed",
            description: `Worker can not work 2 shifts in one day`,
          });
          props.setAttendanceData((prevState) => {
            return { ...props.attendanceData, date: "" };
          });
        }
      }
    }
  };

  const handleUpdateShift = (e, id) => {
    setUpdatedShifts([...updatedShifts, { attendance_id: id, shift_id: e }]);
  };

  const handleDeleteShift = (record) => {
    let shift = {
      attendance_id: record.attendance_id,
      workers_assigned: [parseInt(props.userData?.assigned_worker_id)],
    };

    props.realAttendance.filter((realshift) => {
      if (realshift.attendance_id === record.attendance_id) {
        deleteAttendance(shift).then((res) => {
          // console.log('response ---> ',res);
          handleError(res.status, res.status === 'success' ? 'Shift Deleted Duccessfully' : res.error);
          shift = {};
          props.setLoading(true);
          props.closeShiftEditor();
        });
      } else {
        setShiftsAdded(shiftsAdded - 1);
        props.setWorker_shifts((current) =>
          current.filter((shift) => {
            return shift.date !== record.date;
          })
        );
      }
    });
    const new_payload = attendanceList.filter((shift) => {
      if (shift.date !== moment(record.date).format("YYYY-MM-DD")) {
        return shift;
      }
    });
    setAttendanceList(new_payload);
  };

  const handleShiftsSave = () => {
    if (shiftsAdded >= 1) {
      props.setNew_shifts((prevState) => {
        return { ...props.new_shifts, dates_shifts: attendanceList };
      });

      const payload = {
        project_id: props.shifts_details.project_id,
        supervisor_id: user_id,
        assigned_worker_id: props.shifts_details.assigned_worker_id,
        dates_shifts: attendanceList,
      };

      addAttendance(payload).then((res) => {
        handleError(res.status, res.status === 400 ? res.data.error : 'Shift Added Successfully');
      });
      props.setLoading(true);
      props.setNew_shifts([]);
      props.setWorker_shifts([]);
      setAttendanceList([]);
      props.setAttendanceData((prevState) => {
        return { ...props.attendanceData, date: "" };
      });
      setShiftsAdded(0);
      notification.success({
        message: "Success",
        description: `Worker Timesheet successfully edited`,
      });
      props.loadPayrollInfo()
    } else {
      setShiftsAdded(0);
      notification.error({
        message: "Failed",
        description: `No Shift(s) Added`,
      });
      props.closeShiftEditor();
    }
  };

  const handleClose = () => {
    setDisableAddShiftButton(false);
    if (props.new_shifts.length > 1) {
      props.setNew_shifts([]);
      props.setWorker_shifts(props.realAttendance);
    }
    props.setNew_shifts([]);
    props.setWorker_shifts(props.realAttendance);
    props.closeShiftEditor();
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => (
        <p
          style={{
            color: "#798C9A",
            fontSize: "14px",
            fontWeight: "500",
            paddingTop: "10px",
          }}
        >
          {moment(date).utc().format("DD|MM|YYYY")}
        </p>
      ),
    },
    {
      title: "Service",
      dataIndex: "service_name",
      key: "service_name",
      render: (service_name) => (
        <ShiftsModalStyles>
          <Select
            defaultValue={service_name}
            style={{
              width: 80,
            }}
            options={[
              {
                value: service_name,
                label: capitalize(service_name),
              },
            ]}
          />
        </ShiftsModalStyles>
      ),
    },
    {
      title: "Shift",
      dataIndex: "shift_name",
      key: "shift_name",
      render: (_, record) => (
        <Select
          defaultValue={capitalize(record.shift_name)}
          style={{
            width: 80,
          }}
          onChange={(e) => handleUpdateShift(e, record.id)}
          options={(shifts || []).map((shift) => ({
            value: shift.id,
            label: capitalize(shift.name),
          }))}
        />
      ),
    },
    {
      title: "Amount (RWF)",
      dataIndex: "value",
      key: "value",
      render: (value) => (
        <div
          style={{
            background: "#E4EEF3",
            borderRadius: "3px",
            padding: "8px 6px",
            paddingLeft: "6px",
            fontSize: "12px",
            fontWeight: "500",
            width: "80px",
          }}
        >
          {toMoney(value)}
        </div>
      ),
    },
    {
      title: "Delete",
      dataIndex: "delete",
      key: "delete",
      render: (_, record) => (
        <Icon
          icon="material-symbols:delete-outline-rounded"
          color="#f5222d"
          height="25px"
          onClick={() => handleDeleteShift(record)}
          style={{ cursor: "pointer" }}
        />
      ),
    },
  ];

  return (

    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
        }}
        className="mt-8"
      >
        <p
          style={{
            color: "#798C9A",
            marginRight: "70px",
            paddingLeft: "20px",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          Date
        </p>
        <p
          style={{
            color: "#798C9A",
            marginRight: "70px",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          Service
        </p>
        <p
          style={{
            color: "#798C9A",
            marginRight: "80px",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          Shift
        </p>
        <p
          style={{
            color: "#798C9A",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          Amount(RWF)
        </p>
      </div>
      {/* <hr style={{ border: "1px solid #CCDBE1" }} /> */}
      <Divider />
      {props.showAddShiftSection ? (
        <div
          style={{
            background: "#DFF3FB",
            display: "flex",
            justifyContent: "space-between",
            gap: "10px",
            marginTop: "10px",
            borderRadius: "5px",
            border: "2px solid #E4EEF3",
          }}
        >
          <div style={{ paddingTop: "6px" }}>
            <DatePicker
              style={{
                width: 80,
                height: 32,
                borderRadius: "3px",
                marginRight: "15px",
              }}
              onChange={handleDateChanged}
            />
            <Select
              defaultValue={capitalize(worker_rate?.name)}
              style={{
                width: 80,
                height: 32,
                borderRadius: "3px",

                marginRight: "15px",
              }}
              options={[
                {
                  value: worker_rate?.value,
                  label: capitalize(worker_rate?.name),
                },
              ]}
            />
            <Select
              defaultValue={capitalize(shifts[0]?.name)}
              style={{
                width: 80,
                height: 32,
                borderRadius: "3px",
                marginRight: "15px",
              }}
              options={(shifts || []).map((shift) => ({
                value: shift.id,
                label: capitalize(shift.name),
              }))}
              onChange={handleShiftChanged}
            />
            <Input
              defaultValue={toMoney(worker_rate?.value)}
              disabled={true}
              style={{
                width: 90,
                height: 32,
                borderRadius: "5px",
              }}
            />
          </div>

          <div style={{ cursor: "pointer", paddingTop: "10px" }} className="">
            <Icon
              icon="uiw:close-square-o"
              color="#798c9a"
              height={28}
              onClick={props.hideAddShiftSection}
            />
          </div>
          <div style={{ cursor: "pointer", paddingTop: "4px" }}>
            <Icon
              icon="fluent:checkbox-checked-24-filled"
              color="#00a1de"
              height={38}
              disabled={disableAddShiftButton}
              onClick={handleSubmitShift}
            />
          </div>
        </div>
      ) : (
        <Button
          type="secondary"
          className="add secondaryBtn mt-3"
          onClick={makeAddShiftVisible}
        >
          <PlusOutlined />
          <span className="addText">Add Shift</span>
        </Button>
      )}

      <EditShiftsTable
        columns={columns}
        data={props.worker_shifts}
        loading={shiftsLoading}
      />
      <div className="flex justify-center gap-4 w-full">
        <Button
          type="secondary"
          className="secondaryBtn"
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button
          type="primary"
          className="primaryBtn"
          onClick={handleShiftsSave}
        >
          Save
        </Button>
      </div>
    </div>

  );
};

export default WorkerShifts;

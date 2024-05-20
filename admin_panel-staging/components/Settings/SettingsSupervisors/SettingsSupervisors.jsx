import { Icon } from "@iconify/react";
import { Button, Input, notification } from "antd";
import DynamicTable from "../../Tables/DynamicTable";
import { useState, useEffect, useContext } from "react";
import localforage from "localforage";
import { useRouter } from "next/router";

import { getAllRoles, getAllSupervisors } from "../../../helpers/projects/supervisors";
import { StyledSettingsSupervisors } from "./StyledSettingsSupervisors.styled";
import { AddSettingsSupervisors } from "../Modals/AddSettingsSupervisors";
import { SettingsSupervisorsColumns } from "../../Columns/SettingsSupervisorsColumns";
import { PusherContext } from "../../../context/PusherContext";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import { accessSubEntityRetrieval } from "@/utils/accessLevels";

export const SettingsSupervisors = () => {
  const [allSupervisors, setAllSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addSupervisor, setAddSupervisor] = useState(false);
  const [supervisorId, setSupervisorId] = useState(false);

  const { loadSupervisor, setLoadSupervisor } = useContext(PusherContext);

  const router = useRouter();
  const { userAccess, userProfile } = useUserAccess();

  const data = [];

  useEffect(() => {
    localforage
      .getItem("userAccess")
      .then((value) => {
        if (value.toString() === "false") {
          router.push("/");
        }
      })
      .catch((error) => {
        console.log("error", error);
      });
  }, []);

  useEffect(() => {
    if (loading || loadSupervisor) {
      getAllRoles().then((res) => {
        const supervisorRole = res?.roles?.find((role) => role?.name.toLowerCase() === "supervisor")?.id;
        setSupervisorId(supervisorRole)
        if (supervisorRole) {
          getAllSupervisors(supervisorRole)
            .then((res) => {
              setAllSupervisors(res?.data);
              setLoading(false);
              setLoadSupervisor(false);
            })
            .catch((error) => {
              notification.error({
                message: error.name,
                description: error.message,
              });
            });
        } else {
          setLoading(false);
          setLoadSupervisor(false);
        }
      })

    }
  }, [loading, loadSupervisor]);

  const openSupervisorModal = () => {
    setAddSupervisor(true);
  };
  const closeSupervisorModal = () => {
    setAddSupervisor(false);
  };

  const onSearch = (input) => {
    if (String(input).length > 0) {
      const filteredData = allSupervisors.filter((item) => {
        return item.lastname?.toLowerCase().includes(input.toLowerCase()) || item.firstname?.toLowerCase().includes(input.toLowerCase()) || item.job_title?.toLowerCase()?.includes(input?.toLowerCase()) || item.email?.toLowerCase()?.includes(input.toLowerCase()) || item.username?.toLowerCase()?.includes(input?.toLowerCase())
      })
      setAllSupervisors(filteredData)
    } else {
      setLoading(true);
    }
  };

  const handleTableChange = (pagination) => {
    // console.log("pagination", pagination);
  };

  return (
    <StyledSettingsSupervisors>
      <AddSettingsSupervisors
        addSupervisor={addSupervisor}
        closeSupervisorModal={closeSupervisorModal}
        setLoading={setLoading}
        edit={false}
      />
      <DynamicTable
        rowKey={`id`}
        columns={SettingsSupervisorsColumns(userProfile)}
        data={allSupervisors}
        extra_left={[
          <div className="users" key={0}>
            <span>{allSupervisors?.length}</span>
            <span>Supervisors</span>
          </div>,
        ]}
        extra_middle={[
          <Input
            key={0}
            size="large"
            placeholder="Search by Name, Phone, or Email"
            className="search"
            // defaultValue={router.query?.search}
            onChange={(e) => onSearch(e.target.value)}
            prefix={
              <Icon
                icon="material-symbols:search"
                color="#A8BEC5"
                height="20px"
              />
            }
            allowClear
          />,
        ]}
        extra_right={userProfile && accessSubEntityRetrieval(userProfile?.user_access, 'settings', 'supervisors', 'add new supervisor') && [
          <Button key={0} className="primaryBtn" onClick={openSupervisorModal}>
            <Icon icon="material-symbols:add" color="var(--button-color)" width="20px" />
            <span>Add Supervisor</span>
          </Button>,
        ]}
        isSettings={true}
        loading={loading || loadSupervisor}
        pagination={{
          total: data?.length,
        }}
        onChange={(value) => handleTableChange(value)}
      />
    </StyledSettingsSupervisors>
  );
};

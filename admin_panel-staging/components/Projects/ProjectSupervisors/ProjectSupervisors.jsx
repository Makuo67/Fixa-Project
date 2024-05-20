import DynamicTable from "../../Tables/Projects/ProjectsDynamicTable";
import { Button, Empty, Input } from "antd";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { StyledProjectSupervisors } from "./StyledProjectSupervisors.styled";
import AddSupervisor from "../Modals/AddSupervisor";
import { ProjectSupervisorsTableColumns } from "../../Columns/ProjectSupervisorsTableColumns";
import { getAllProjectSupervisors, getAllRoles } from "../../../helpers/projects/supervisors";
import { Icon } from "@iconify/react";
import { LoadingOutlined } from "@ant-design/icons";
import { PusherContext } from "../../../context/PusherContext";
import ErrorComponent from "@/components/Error/Error";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import { checkUserAccessToEntity, checkUserAccessToSubEntity } from "@/utils/accessLevels";

export const ProjectSupervisors = () => {
  const [addSupervisor, setAddSupervisor] = useState(false);
  const [allSupervisors, setAllSupervisors] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [supervisorId, setSupervisorId] = useState(false);

  const [supervisorsAccess, setSupervisorsAccess] = useState(false)
  const [deleteSupervisorAccess, setDeleteSupervisorAccess] = useState(false)
  const [linkSupervisorAccess, setLinkSupervisorAccess] = useState(false)

  const { loadSupervisor, setLoadSupervisor } = useContext(PusherContext);
  const { userProfile } = useUserAccess();
  const { user_access, user_level } = userProfile

  const router = useRouter();
  const { id } = router.query;

  const handleTableChange = (pagination) => {
    console.log(pagination);
  };
  const openSupervisorModal = () => {
    setAddSupervisor(true);
  };

  const closeSupervisorModal = () => {
    setAddSupervisor(false);
  };



  useEffect(() => {
    if (user_access) {
      setSupervisorsAccess(checkUserAccessToEntity("project", "supervisors", user_access))
      setDeleteSupervisorAccess(checkUserAccessToSubEntity("project", "supervisors", "delete", user_access))
      setLinkSupervisorAccess(checkUserAccessToSubEntity("project", "supervisors", "link existing", user_access))
    }
  }, [user_access]);

  useEffect(() => {
    if (id) {
      getAllRoles().then((res) => {
        const supervisorRole = res?.roles?.find((role) => role?.name.toLowerCase() === "supervisor")?.id;
        setSupervisorId(supervisorRole)
        if (supervisorRole) {
          getAllProjectSupervisors(id, supervisorRole).then((res) => {
            setAllSupervisors(res?.data);
            setLoading(false);
            setLoadSupervisor(false);
          });
        } else {
          setLoading(false);
          setLoadSupervisor(false);
        }
      })
    }
  }, [id, loading, loadSupervisor]);

  const onSearch = (value) => {
    if (String(value)?.length > 0) {
      // Normalize both query and data in the array & push results into the results.
      const results = allSupervisors.filter(item => item?.first_name?.toLowerCase().includes(value.toLowerCase()) || item?.last_name?.toLowerCase().includes(value.toLowerCase()) || item?.phone_number?.includes(value) || item?.email?.includes(value) || item?.role_name?.toLowerCase().includes(value.toLowerCase()))
      setAllSupervisors(results);
    } else {
      setLoading(true);
    }

  };

  // loading || loadSupervisor
  if (loading ) {
    return (
      <div className="w-full flex items-center justify-center">
        <LoadingOutlined />
      </div>
    )
  }
  // else if (!supervisorsAccess) {
  //   return <ErrorComponent status={403} backHome={true} />
  // }
  return (
    <StyledProjectSupervisors>
      <div className="supervisor-contianer">
        <DynamicTable
          rowKey={`id`}
          columns={ProjectSupervisorsTableColumns(deleteSupervisorAccess)}
          data={allSupervisors}
          supervisors={true}
          extra_middle={[
            <Input
              key={0}
              size="large"
              placeholder="Search by Name, Phone, or Email"
              className="search"
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
          extra_right={linkSupervisorAccess ? [
            <Button key={0} className="primaryBtn" onClick={openSupervisorModal}>
              <Icon icon="material-symbols:add" color="var(--button-color)" width="20px" />
              <span>Add Supervisor</span>
            </Button>,
          ] : []}
          loading={loading || loadSupervisor}
          pagination={{
            total: allSupervisors?.length,
          }}
          onChange={(value) => handleTableChange(value)}
          emptyStateText="No Supervisor found, please add Supervisors."
        />
      </div>
      {linkSupervisorAccess && (<AddSupervisor
        addSupervisor={addSupervisor}
        closeSupervisorModal={closeSupervisorModal}
        setLoading={setLoading}
      />)}
    </StyledProjectSupervisors>
  );
};

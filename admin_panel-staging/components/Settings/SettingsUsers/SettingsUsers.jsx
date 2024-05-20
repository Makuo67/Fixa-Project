import { Icon } from "@iconify/react";
import { NewSettingsUserButton } from "../../Buttons/SettingsButton";
import { Input } from "antd";
import DynamicTable from "../../Tables/DynamicTable";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import SettingsTableColumns from "../../Columns/SettingsTableColumns";
import localforage from "localforage";
import { getAllUsers, getCompanyInfo } from "../../../helpers/settings/settings";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import { accessSubEntityRetrieval } from "@/utils/accessLevels";

export const SettingsUsers = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [job_titles, setJob_titles] = useState([]);
  const [userInvited, setuserInvited] = useState(false);
  const [jobTitlesChanged, setJobTitleChanged] = useState(false);
  const [companyName, setCompanyName] = useState("");

  const router = useRouter();
  const { companyStatus, userProfile } = useUserAccess();
  const { is_staffing } = companyStatus

  const data = [];

  useEffect(() => {
    setLoading(true);
    getCompanyInfo()
      .then((res) => {
        setJob_titles(res?.data?.job_titles);
        setCompanyName(res?.data?.companies[0]?.company_name);
        setLoading(false);
      })
      .catch((error) => {
        notification.error({
          message: error.name,
          description: error.message,
        });
      });
  }, []);

  // in case titles are changed
  useEffect(() => {
    // setLoading(true);
    if (jobTitlesChanged) {
      getCompanyInfo()
        .then((res) => {
          setJob_titles(res?.data?.job_titles);
          setLoading(false);
        })
        .catch((error) => {
          notification.error({
            message: error.name,
            description: error.message,
          });
        });
    }
    return setJobTitleChanged(false)
  }, [jobTitlesChanged]);

  useEffect(() => {
    if (loading) {
      getAllUsers()
        .then((res) => {
          setAllUsers(res?.data);
          setLoading(false);
        })
        .catch((error) => {
          notification.error({
            message: error.name,
            description: error.message,
          });
        });
    }
  }, [loading]);

  useEffect(() => {
    if (userInvited) {
      setLoading(true);
      getAllUsers()
        .then((res) => {
          setAllUsers(res?.data);
          setLoading(false);
        })
        .catch((error) => {
          notification.error({
            message: error.name,
            description: error.message,
          });
        });
    }
    setuserInvited(false);
  }, [userInvited]);

  const onSearch = (input) => {

    if (String(input).length > 0) {
      const filteredData = allUsers.filter((item) => {
        return item.lastname?.toLowerCase().includes(input.toLowerCase()) || item.firstname?.toLowerCase().includes(input.toLowerCase()) || item.job_title?.toLowerCase()?.includes(input?.toLowerCase()) || item.email?.toLowerCase()?.includes(input.toLowerCase())
      })
      setAllUsers(filteredData)
    } else {
      setLoading(true);
    }
  };

  const handleTableChange = (pagination) => {
    // console.log("pagination", pagination);
  };

  return (
    <>
      <DynamicTable
        rowKey={`id`}
        columns={SettingsTableColumns(userProfile, is_staffing)}
        data={allUsers}
        extra_left={[
          <div className="users" key={0}>
            <span>{allUsers?.length}</span>
            <span>Users</span>
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
        extra_right={userProfile && accessSubEntityRetrieval(userProfile?.user_access, 'settings', 'office team', 'invite office user') && [
          <NewSettingsUserButton
            key={0}
            job_titles={job_titles}
            setuserInvited={setuserInvited}
            setJobTitleChanged={setJobTitleChanged}
            companyName={companyName}
          />
        ]}
        isSettings={true}
        loading={loading}
        pagination={{
          total: data?.length,
        }}
        onChange={(value) => handleTableChange(value)}
      />
    </>
  );
};

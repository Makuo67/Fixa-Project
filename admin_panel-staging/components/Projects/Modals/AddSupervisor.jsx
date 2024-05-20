import React, { useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { Button, Input, Modal, notification } from "antd";
import { Icon } from "@iconify/react";

import StyledEditor from "../../Settings/Modals/StyleEditor";
import SupervisorTable from "../../Tables/Projects/SupervisorTable";
import {
  addSupervisor,
  attachSuppliersToProject,
  getAllRoles,
  getAllSupervisors,
  getAllSuppliers,
  getSuppliersNotOnProject,
} from "../../../helpers/projects/supervisors";
import { AllSupervisorsColumns, AllSuppliersColumns } from "../../Columns/AllSupervisorsColumns";
import { StyledProjectSupervisors } from "../ProjectSupervisors/StyledProjectSupervisors.styled";
import { PusherContext } from "@/context/PusherContext";

export default function AddSupervisor(props) {
  const [allSupervisors, setAllSupervisors] = useState([]);
  const [selectedSupervisors, setSelectedSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [suppliers, setAllSuppliers] = useState([]);

  const { loadSupervisor } = useContext(PusherContext);

  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    getAllRoles().then((res) => {
      const supervisorRole = res?.roles?.find((role) => role?.name.toLowerCase() === "supervisor")?.id;
      if (supervisorRole) {
        getAllSupervisors(supervisorRole)
          .then((res) => {

            if (res?.data) {
              var active_supervisors = res?.data.filter((item) => item.status === true) ?? [];

              setAllSupervisors(filteredSupervisors(active_supervisors));
              setLoading(false);
            }
          })
          .catch((error) => {
            notification.error({
              message: error.name,
              description: error.message,
            });
          });
      } else {
        setLoading(false);
      }
    })

    getSuppliersNotOnProject(id).then((res) => {
      setAllSuppliers(res)
    })

  }, [loading, loadSupervisor]);

  const filterSuppliers = (suppliers) => {
    const suppliersObj = suppliers?.filter((obj) => {
      return obj.isActive;
    });
    return suppliersObj;
  }
  const filteredSupervisors = useCallback(
    (supervisors) => {
      const filteredSupervisors = supervisors?.filter((obj) => {
        return !obj.projects.some((project) => project.id === parseInt(id));
      });
      return filteredSupervisors;
    },
    [loading, loadSupervisor]);

  const close = () => {
    props.closeSupervisorModal();
  };

  const ModalTitle = () => (
    <StyledEditor>
      <h1 className="import modalTitle supervisor">Select Supervisor(s)</h1>
    </StyledEditor>
  );

  const SuppliersModalTitle = () => (
    <StyledEditor>
      <h1 className="import modalTitle supervisor">Select Suppliers(s)</h1>
    </StyledEditor>
  );

  const [selectionType, setSelectionType] = useState("checkbox");

  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      if (props.isSuppliers) {
        setSelectedSuppliers(selectedRowKeys);
      } else {
        setSelectedSupervisors(selectedRowKeys);
      }
    },
    getCheckboxProps: (record) => ({
      disabled: record.name === "Disabled User",
      // Column configuration not to be checked
      name: record.name,
    }),
  };

  const onSearch = (value) => {

    // Looping in the array
    if (String(value)?.length > 0) {
      // console.log(value, suppliers);
      if (props.isSuppliers) {

        const filteredData = suppliers.filter((item) => {
          return item.name?.toLowerCase().includes(value.toLowerCase()) || item.email?.includes(value) || item?.phone.includes(value)
        })
        // console.log("results", results)
        setAllSuppliers(filteredData);
      } else {

        const filteredData = filteredSupervisors(allSupervisors).filter((item) => {
          return item.last_name?.toLowerCase().includes(value.toLowerCase()) || item.first_name?.toLowerCase().includes(value.toLowerCase()) || item.email?.includes(value) || item?.phone_number.includes(value) || item?.role_name?.toLowerCase().includes(value.toLowerCase())
        })
        // console.log("results", results)
        setAllSupervisors(filteredData);
      }
    } else {
      setLoading(true);
    }

  };

  const handleAddSupervisor = () => {
    setButtonLoading(true);
    const addPayload = {
      user_ids: selectedSupervisors,
      project_id: id,
    };

    const addSuppliersPayload = {
      project_id: id,
      supplier_ids: selectedSuppliers,
    }

    if (props?.isSuppliers) {
      attachSuppliersToProject(id, addSuppliersPayload).then(() => {
        props.setLoading(true);
        props.closeSupervisorModal();
      })
        .finally(() => {
          setButtonLoading(false);
        })
    } else {

      addSupervisor(addPayload)
        .then((res) => {
          notification.success({
            message: "Success",
            description: "Supervisor Added",
          });
          setLoading(true);
          props.setLoading(true);
          props.closeSupervisorModal();
          // setButtonLoading(false);
        })
        .catch((error) => {
          notification.error({
            message: "Failed",
            description: `${error.message}`,
          });
        }).finally(() => {
          setButtonLoading(false);
        });
    }
  };

  return (
    <Modal
      centered
      title={props.isSuppliers ? <SuppliersModalTitle /> : <ModalTitle />}
      okText="Yes"
      cancelText="No"
      open={props.addSupervisor}
      onOk={close}
      onCancel={close}
      styles={{
        body: {
          height: "100%",
        }
      }}
      width={"70vw"}
      footer={null}
    >
      <StyledProjectSupervisors>
        <div className="pb-4">
          <Input
            key={0}
            size="large"
            placeholder={props?.isSuppliers ? "Search suppliers by name" : "Search supervisor by Name, Phone, or Email"}
            className="search"
            onChange={(e) => onSearch(e.target.value)}
            suffix={
              <Icon
                icon="material-symbols:search"
                color="#A8BEC5"
                height="20px"
              />
            }
            style={{ width: "100%" }}
            allowClear
          />
        </div>
        <SupervisorTable
          data={props.isSuppliers ? suppliers : allSupervisors}
          columns={props?.isSuppliers ? AllSuppliersColumns : AllSupervisorsColumns}
          rowSelection={rowSelection}
          selectionType={selectionType}
          showHeader={false}
          loading={loading}
        />
        <div
          className="submit-buttons-container"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <Button type="secondary" className={"secondaryBtn"} htmlType="submit" onClick={close}>
            Cancel
          </Button>
          <Button
            type="primary"
            className={"primaryBtn"}
            htmlType="submit"
            onClick={() => handleAddSupervisor()}
            loading={buttonLoading}
          >
            Save
          </Button>
        </div>
      </StyledProjectSupervisors>
    </Modal>
  );
}

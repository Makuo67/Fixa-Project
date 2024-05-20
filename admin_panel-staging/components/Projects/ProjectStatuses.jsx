import { Button, Divider, Dropdown, Space, Modal } from "antd";
import { Icon } from "@iconify/react";
import { StyledProjectStatuses } from "./StyledProjectStatuses.styled";
import { useContext, useState } from "react";
import { useRouter } from "next/router";
import { updateProjectStatus } from "../../helpers/projects/projects";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { PusherContext } from "../../context/PusherContext";
import { useUserAccess } from "../Layouts/DashboardLayout/AuthProvider";

const { confirm } = Modal;
export const ProjectStatuses = (props) => {
  const [drop, setDrop] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(props.currentStatus);
  const router = useRouter();
  const { userAccess } = useUserAccess();

  const { setProjectStatusLoading } = useContext(PusherContext);

  const { id } = router.query;
  const handleOpen = (o) => {
    if (userAccess && userAccess.project_edit === true){
      setDrop(o);
    }
  };
  const handleChangeStatus = (status) => {
    const updateBody = {
      progress_status: status,
    };
    confirm({
      title: `Are you sure you want to change ${props?.project} status to ${status}?`,
      icon: <ExclamationCircleOutlined />,
      // content: "Some descriptions",
      cancelText: "No",
      okText: "Yes",
      // footer: null,
      okButtonProps: { 
        className : "popBtn",
        type: "primary",
       },
       cancelButtonProps: {
        className : "popCancelBtn",
        type: "secondary",
       },
      onOk() {
        updateProjectStatus(id, updateBody).then((res) => {
          setCurrentStatus(status);
          setProjectStatusLoading(true);
          // router.reload()
        });
      },
      onCancel() {
        console.log("Cancel");
      },
    });
  };

  const statuses = [
    {
      id: 0,
      name: "ongoing",
      label: "Ongoing",
    },
    {
      id: 1,
      name: "onhold",
      label: "On Hold",
    },
    {
      id: 2,
      name: "completed",
      label: "Completed",
    },
    // {
    //   id: 3,
    //   name: "not_started",
    //   label: "Not Started",
    // },
  ];
  return (
    <StyledProjectStatuses currentStatus={props.currentStatus}>
      <Dropdown
        className="select-status-container"
        trigger={["click"]}
        open={props?.isDrop && drop}
        onOpenChange={handleOpen}
        dropdownRender={() => (
          <Space
            className="ul-dropdown"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              padding: "8px 12px",
              gap: "0px",
              width: "132px",
              height: "fit-content",
              backgroundColor: "#FFFFFF",
              boxShadow: "0px 4px 26px rgba(30, 45, 84, 0.25)",
              borderRadius: "5px",
            }}
          >
            {statuses.map(
              (item, index) =>
                item.name !== props.currentStatus && (
                  <div key={index}>
                    <Button
                      key={index}
                      onClick={() => handleChangeStatus(item.name)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "1px 5px",
                        gap: "5px",
                        width: "104px",
                        height: "22px",
                        backgroundColor: `${item.name === "ongoing"
                          ? "#FFF7E6"
                          : item.name === "onhold"
                            ? "#FFF1F0"
                            : item.name === "completed"
                              ? "#F6FFED"
                              : "#DCEBF1"
                          }`,
                        borderRadius: "10px",
                        border: "none",
                        fontStyle: "bold",
                        fontWeight: "500",
                        fontSize: "12px",
                        lineHeight: "15px",
                        color: `${item.name === "ongoing"
                          ? "#FAAD14"
                          : item.name === "onhold"
                            ? "#F5222D"
                            : item.name === "completed"
                              ? "#389E0D"
                              : "#2C3336"
                          }`,
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          justifyContent: "center",
                          gap: "5px",
                        }}
                      >
                        {item.name === "ongoing" ? (
                          <Icon
                            icon="mdi:clock-time-four-outline"
                            color="#fa8c16"
                          />
                        ) : item.name === "onhold" ? (
                          <Icon icon="bi:pause-fill" color="#f5222d" />
                        ) : item.name === "completed" ? (
                          <Icon
                            icon="icon-park-outline:check-one"
                            color="#389e0d"
                          />
                        ) : (
                          <Icon
                            icon="mdi:clock-time-four-outline"
                            color="#000"
                          />
                        )}
                        <span>{item.label}</span>
                      </span>
                    </Button>
                    <Divider
                      style={{
                        width: "100%",
                        height: "1px",
                        backgroundColor: "#DCEBF1",
                        margin: "7px 0",
                      }}
                    />
                  </div>
                )
            )}
          </Space>
        )}
      >
        <Button className="select-status">
          <Space className="select-status-space">
            <span>
              {props.currentStatus === "ongoing" ? (
                <Icon icon="mdi:clock-time-four-outline" color="#fa8c16" />
              ) : props.currentStatus === "completed" ? (
                <Icon icon="icon-park-outline:check-one" color="#389e0d" />
              ) : props.currentStatus === "onhold" ? (
                <Icon icon="bi:pause-fill" color="#f5222d" />
              ) : (
                <Icon icon="mdi:clock-time-four-outline" className="clock" />
              )}
              {props.currentStatus === "ongoing"
                ? "Ongoing"
                : props.currentStatus === "onhold"
                  ? "On Hold"
                  : props.currentStatus === "completed"
                    ? "Completed"
                    : "Not Started"}
              <Icon
                icon="material-symbols:keyboard-arrow-down-rounded"
                className="arrow"
              />
            </span>
          </Space>
        </Button>
      </Dropdown>
    </StyledProjectStatuses>
  );
};

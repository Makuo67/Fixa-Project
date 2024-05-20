import { useState } from "react";
import moment from "moment";
import { Badge, Tag } from "antd";
import Icon, { CheckCircleFilled, CheckCircleOutlined } from "@ant-design/icons";
import {
  MailSvg,
  ProfileSvg,
} from "../Icons/CustomIcons";

import SendMessageModal from "../Modals/SendMessageModal";
import WorkerService from "./WorkerService";
import WorkerAssessment from "./WorkerAssessment";
import { capitalizeAll } from "../../helpers/capitalize";
import { useUserAccess } from "../Layouts/DashboardLayout/AuthProvider";
import { accessSubpageEntityRetrieval } from "@/utils/accessLevels";

const ProfileIcon = (props) => <Icon component={ProfileSvg} {...props} />;
const MailIcon = (props) => <Icon component={MailSvg} {...props} />;


const Profile = (props) => {
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showModalAssess, setShowModalAsses] = useState(false);
  const { userAccess, userProfile } = useUserAccess();

  const handleCancelAssessModal = () => {
    setShowModalAsses(false);
  };

  const clearSelection = () => {
    // setSelectedRowKeys([]); // clear selected row keys after the action is completed
  };

  return (
    <div className="profile">
      <div className="profile-info">
        <div style={{ display: "flex" }}>
          {props?.worker ? (
            <div className="profile-info-image">
              {props?.worker?.worker_information?.worker_profile_image_url.includes(
                "via.placeholder.com/600x400"
              ) ? (
                <>
                  <ProfileIcon className="image" />
                </>
              ) : (
                <>
                  <img
                    className="image"
                    src={
                      props?.worker?.worker_information?.worker_profile_image_url
                    }
                  />
                </>
              )}
            </div>
          ) : (
            <div className="profile-info-image">
              <ProfileIcon className="image" />
            </div>
          )}
          {/*  */}
          <div className="profile-info-details">
            <div className="dispay-with-icon">
              {props?.worker?.worker_information?.worker?.first_name ? (
                <p className="name">
                  {capitalizeAll(
                    props?.worker?.worker_information?.worker?.first_name
                  )}{" "}
                  {capitalizeAll(
                    props?.worker?.worker_information?.worker?.last_name
                  )}
                </p>
              ) : (
                <p className="name">First Name: - Last Name: -</p>
              )}

              {props?.worker?.worker_information?.verification
                ?.worker_is_verified ? (
                <div className="verified-icon">
                  <CheckCircleFilled style={{ color: "#00A1DE" }} />
                </div>
              ) : (
                <div className="verified-icon">{""}</div>
              )}

              <Tag
                className="worker-status"
                color={
                  props?.worker?.worker_information?.worker.is_active
                    ? "#E8FAFA"
                    : "red"
                }
              >
                <Badge
                  status={
                    props?.worker?.worker_information?.worker.is_active
                      ? "success"
                      : "error"
                  }
                  text={
                    <span
                      style={{
                        color: props?.worker?.worker_information?.worker
                          .is_active
                          ? "#0DA35B"
                          : "red",
                        fontWeight: 600,
                        textTransform: "capitalize",
                      }}
                    >
                      {props?.worker?.worker_information?.worker.is_active
                        ? "active"
                        : "inactive"}
                    </span>
                  }
                />
              </Tag>
            </div>
            <WorkerService
              workHistory={props?.workingHistory}
              services={props?.worker?.worker_information?.services}
            />

            <WorkerAssessment
              worker={props?.worker}
              showModalAssess={showModalAssess}
              handleCancelAssessModal={handleCancelAssessModal}
              setShowModalAsses={setShowModalAsses}
              // projectId={props?.projectId}
              worker_id={props?.worker_id}
              setLoader={props?.setLoader}
              setAssessmentSubmitted={props?.setAssessmentSubmitted}
            />
            <div className="attendances-details">
              <div className="attendances-details-dates">
                <p className="space-x-2">
                  <span>Date Onboarded:</span>
                  <span>{moment(props?.worker?.worker_information?.date_onboarded).utc().format("YYYY/MM/DD")}</span>
                </p>
                {props?.worker?.worker_information?.last_attendance?.date ? (
                  <p>
                    Last attendance:{" "}
                    {props?.worker?.worker_information?.last_attendance?.date.replaceAll(
                      "-",
                      "/"
                    )}
                    {"  "}-{"  "}
                    {capitalizeAll(
                      props?.worker?.worker_information?.last_attendance
                        ?.project_name
                    )}
                  </p>
                ) : (
                  <p> Last attendance: -</p>
                )}
              </div>
              <div className="attendances-details-contacts">
                <div className="momo-and-phone">
                  <p>
                    Phone:{" "}
                    {props?.worker?.worker_information?.worker?.phone_number
                      ? props?.worker?.worker_information?.worker?.phone_number
                      : "-"}
                  </p>

                  {props?.worker?.worker_information?.verification
                    ?.phone_number_is_verified ? (
                    <div>
                      <p className="momo-verified">
                        <CheckCircleOutlined style={{ color: "#00A1DE" }} />
                        <span className="momo-statement">Momo Verified</span>
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p></p>
                    </div>
                  )}
                </div>
                {props?.worker ? (
                  <p>
                    NID Number:{" "}
                    {props?.worker?.worker_information?.worker?.nid_number}
                  </p>
                ) : (
                  <p> NID Number: -</p>
                )}
              </div>
            </div>
          </div>
          <div>
            <div>
              <div className="worker-actions">
                {props?.worker?.worker_information?.verification
                  ?.worker_is_verified ? (
                  <></>
                ) : (
                  <></>
                )}

                {userProfile && accessSubpageEntityRetrieval(userProfile?.user_access, 'workforce', 'workers', 'send message') && (

                  <button
                    className="button-action1"
                    onClick={() => setShowMessageModal(true)}
                    style={{ cursor: "pointer" }}
                  >
                    <MailIcon className="action-icon" />
                    <span className="icon"></span>
                    <span className="text" style={{ color: "#24282C" }}>
                      {"Send message"}{" "}
                    </span>
                  </button>
                )}
                <SendMessageModal
                  key={0}
                  isVisible={showMessageModal}
                  hideModal={() => setShowMessageModal(false)}
                  phoneNumber={
                    props?.worker?.worker_information?.worker?.phone_number
                  }
                  isProfile={true}
                  onOk={1}
                  clearSelection={clearSelection}
                  title={` Send message to ${props?.worker?.worker_information?.worker?.first_name}   ${props?.worker?.worker_information?.worker?.last_name}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

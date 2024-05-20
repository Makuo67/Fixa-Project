import Icon from "@ant-design/icons";
import moment from "moment";
import { useState } from "react";

import { StyledPersonalDetails } from "./personalDetailsTab.styled";
import { EditWorkerSvg } from "../../Icons/CustomIcons";
import { capitalize, capitalizeAll } from "../../../helpers/capitalize";
import EditContactInfo from "../Modals/EditContactInfo";
import EditPersonalDetails from "../Modals/EditPersonalDetails";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import { accessSubpageSubEntityRetrieval } from "@/utils/accessLevels";

const EditWorkerIcon = (props) => <Icon component={EditWorkerSvg} {...props} />;

const PersonalDetails = (props) => {
  const [isEditingPersonalContacts, setIsEditingPersonalContacts] =
    useState(false);
  const { userAccess, userProfile } = useUserAccess();

  const [isEditingPersonalDetails, setIsEditingPersonalDetails] =
    useState(false);

  function calculate_age(dob) {
    var diff_ms = Date.now() - dob.getTime();
    var age_dt = new Date(diff_ms);

    return Math.abs(age_dt.getUTCFullYear() - 1970);
  }

  return (
    <StyledPersonalDetails>
      <div className="details">
        <h3>
          Personal Details{" "}
          {userProfile && accessSubpageSubEntityRetrieval(userProfile?.user_access, 'workforce', 'workers', 'details', 'edit personal details') && !props?.workerProfileLoading &&
            (

              <EditWorkerIcon
                style={{ cursor: "pointer" }}
                onClick={() => setIsEditingPersonalDetails(true)}
              />
            )}
          <EditPersonalDetails
            setIsEditingPersonalDetails={setIsEditingPersonalDetails}
            isEditingPersonalDetails={isEditingPersonalDetails}
            setAssessmentSubmitted={props?.setAssessmentSubmitted}
            setPersonalDetailsLoader={props?.setPersonalDetailsLoader}
            worker={props?.worker}
            worker_service={props?.worker_service}
            trades={props?.trades}
            worker_rate={props?.worker_rate}
            worker_id={props?.workerId}
            setLoader={props?.setLoader}
            is_rssb_verified={props?.workerEdu?.is_rssb_verified}
            workerProfileLoading={props?.workerProfileLoading}
          />
        </h3>
        <div>
          <div className="personal-details">
            <div className=" rowDetails">
              <div className="detailsItem small-width">
                <p className="detail-description">First Name</p>
                <p className="detail-value">
                  {capitalizeAll(
                    props?.worker?.worker_information?.worker?.first_name
                  )}
                </p>
              </div>
              <div className="detailsItem big-width">
                <p className="detail-description">Last Name</p>
                <p className="detail-value">
                  {capitalizeAll(
                    props?.worker?.worker_information?.worker?.last_name
                  )}
                </p>
              </div>
              <div className="detailsItem small-width">
                <p className="detail-description">NID Number</p>
                {props?.worker?.worker_information?.worker?.nid_number ? (
                  <p className="detail-value">
                    {props?.worker?.worker_information?.worker?.nid_number}
                  </p>
                ) : (
                  <p className="">
                    <span className="">-</span>
                  </p>
                )}
              </div>
              <div></div>
            </div>

            {/* second row */}
            <div className="rowDetails">
              <div className="detailsItem small-width">
                <p className="detail-description">Gender</p>
                {props?.worker?.worker_information?.worker?.gender ? (
                  <p className="detail-value">
                    {capitalize(
                      props?.worker?.worker_information?.worker?.gender
                    )}
                  </p>
                ) : (
                  <p className="fields">
                    <span className="">-</span>
                  </p>
                )}
              </div>
              <div className="detailsItem big-width">
                <p className="detail-description">
                  Date of Birth
                </p>
                {props?.worker?.worker_information?.worker?.date_of_birth ? (
                  <p className="detail-value">
                    {moment(
                      props?.worker?.worker_information?.worker?.date_of_birth
                    ).format("YYYY/MM/DD")}
                    <span className="age">
                      ({" "}
                      {calculate_age(
                        new Date(
                          moment(
                            props?.worker?.worker_information?.worker
                              ?.date_of_birth
                          )
                            .utc()
                            .format("YYYY-MM-DD")
                        )
                      )}{" "}
                      years old )
                    </span>
                  </p>
                ) : (
                  <p className="">
                    -
                  </p>
                )}
              </div>
              {/* RSSB CODE */}
              <div className="detailsItem small-width">
                <p className="detail-description">RSSB Number</p>
                {
                  props?.worker?.worker_information?.worker?.rssb_number
                    ? (
                      <p className="detail-value">
                        {
                          props?.worker?.worker_information?.worker?.rssb_number
                        }
                      </p>
                    ) : (
                      <p className="">
                        <span className="">-</span>
                      </p>
                    )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div className="contact-details">
          <div className="contacts">
            <h3>
              Contact Details{" "}
              {userProfile && accessSubpageSubEntityRetrieval(userProfile?.user_access, 'workforce', 'workers', 'details', 'edit contact details') && !props?.workerProfileLoading && (

                <EditWorkerIcon
                  style={{ cursor: "pointer" }}
                  onClick={() => setIsEditingPersonalContacts(true)}
                />
              )}
              <EditContactInfo
                isEditingPersonalContacts={isEditingPersonalContacts}
                setIsEditingPersonalContacts={setIsEditingPersonalContacts}
                setPersonalDetailsLoader={props?.setPersonalDetailsLoader}
                setAssessmentSubmitted={props?.setAssessmentSubmitted}
                worker={props?.worker}
                worker_id={props?.workerId}
                workerEdu={props?.workerEdu}
                districts={props?.districts}
                setLoader={props?.setLoader}
                is_momo_verified_and_rssb={props?.workerEdu?.is_momo_verified_and_rssb}
              />
            </h3>
            <div className="contact-specifics">
              <div className="det">
                <p className="detail-description">Address</p>
                {props?.worker?.worker_information?.worker?.district ? (
                  <p className="detail-value">{`${props?.worker?.worker_information?.worker?.district}`}</p>
                ) : (
                  <p className="detail-value">-</p>
                )}
              </div>
              <div className="det">
                <p className="detail-description">Phone Number</p>
                <p className="detail-value">
                  {props?.worker?.worker_information?.worker?.phone_number}
                </p>
              </div>
              <div className="det">
                <p className="detail-description">Emergency Contact</p>

                {props?.worker?.worker_details?.next_of_kin ? (
                  <p className="detail-value capitalize">
                    {`${props?.worker?.worker_details?.next_of_kin?.map((item, index) => item?.phone_number)}
                                `}{" "}
                    <br /> {props?.worker?.worker_details?.next_of_kin?.map((item, index) => item?.name)}

                  </p>
                ) : (
                  <p className="fields">
                    <span className="">-</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </StyledPersonalDetails >
  );
};

export default PersonalDetails;

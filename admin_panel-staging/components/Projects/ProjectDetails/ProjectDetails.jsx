import { StyledProjectDetails } from "./StyledProjectDetails.styled";
import { useContext, useEffect, useState } from "react";
import { getSingleProjectDetails } from "../../../helpers/projects/projects";
import { ProjectInfoSkeletons } from "../../Skeletons/ProjectAggregatesSkeletons";
import moment from "moment";
import { useRouter } from "next/router";
import { Icon } from "@iconify/react";
import { capitalize } from "../../../helpers/excelRegister";
import { capitalizeAll } from "../../../helpers/capitalize";
import { PusherContext } from "../../../context/PusherContext";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import ErrorComponent from "@/components/Error/Error";
import { checkUserAccessToEntity } from "@/utils/accessLevels";

export const ProjectDetails = () => {
  const [projectDetails, setProjectDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsAccess, setDetailsAccess] = useState(false)

  const router = useRouter();
  const { id } = router.query;
  const { companyStatus,userProfile } = useUserAccess();
  const {user_access,user_level} = userProfile

  const { projectUpdateLoading, setCanCreateInvoice, setClient } = useContext(PusherContext);

    useEffect(() => {
      if(user_access)
      {setDetailsAccess(checkUserAccessToEntity("project", "details", user_access))
    }
    }, [user_access])
    
  useEffect(() => {
    if (id) {
      getSingleProjectDetails(id).then((res) => {
        setProjectDetails(res?.data?.info);
        setCanCreateInvoice(res?.data?.info?.status != "not_started");
        setClient(res?.data?.info?.client_project_manager);
        setLoading(false);
      });
    }
  }, [id, projectUpdateLoading]);

  // if (!projectDetails){
  //   return <ErrorComponent status={403} backHome={true} />
  // };
  return (
    <StyledProjectDetails>
      {loading || projectUpdateLoading ? (
        <ProjectInfoSkeletons
          title={true}
          avatar={false}
          width="800px"
          size="large"
          rows={8}
        />
      ) : (
        <div className="project-details-container space-y-2">
          <h2>Project Details</h2>
          <div className="project-details">
            <div className="project">
              <span className="title">Project Name</span>
              <p>
                {capitalizeAll(projectDetails?.name) || (
                  <Icon icon="octicon:dash-16" color="#798c9a" />
                )}
              </p>
              <span className="title">Start Date</span>
              <p>{moment(projectDetails?.start_date).format("DD/MM/YYYY")}</p>
            </div>
            <div className="client">
              <span className="title">Last Attendance</span>
              <p className="title">
                {capitalize(projectDetails?.last_attendance) || (
                  <Icon icon="octicon:dash-16" color="#798c9a" />
                )}
              </p>{" "}
              <span className="title">End Date</span>
              <p className="title">
                {moment(projectDetails?.end_date).format("DD/MM/YYYY") || (
                  <Icon icon="octicon:dash-16" color="#798c9a" />
                )}
              </p>
            </div>
            <div className="attendance">
              
              <span className="title">Location</span>
              <p className="title">
                {projectDetails?.location || (
                  <Icon icon="octicon:dash-16" color="#798c9a" />
                )}
              </p>
            </div>
          </div>
          <div className="project-details">
            {(projectDetails?.client && user_level && user_level.name.toLowerCase() === "level_1") && <div className="project">
              { projectDetails?.client?.name && <span className="title">Client</span> }
              <p className="capitalize">
                {projectDetails?.client?.name}
              </p>
            </div>}
           
          </div>
          
        </div>
      )}
    </StyledProjectDetails>
  );
};

import { Icon } from '@iconify/react';
import moment from 'moment';

import ProjectCardStyled from "./ProjectCard.styled";
import { capitalizeAll } from '../../../helpers/capitalize';
import { useRouter } from 'next/router';
import ProjectStatus from '../../ProjectStatus/ProjectStatus';

const ProjectCard = ({ project, index, user_level, is_staffing }) => {
  const router = useRouter();


  const handleCardClick = (project) => {
    // console.log("card clicked")
    router.push({
      pathname: `/projects/${project.name}`,
      query: { id: project.id, tab: "1", },
    });
  }

  return (
    <ProjectCardStyled>
      <div className="cardContainer hover:border border-primary" key={index} onClick={() => handleCardClick(project)}>
        <div className="cardMainSection">
          {project.project_profile_url ?
            <div>
              <img src={project.project_profile_url}
                className="cardImage" alt="logo" />
            </div>
            :
            <div>
              <span className="cardImage" style={{ backgroundColor: 'var(--avatar)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                {project.name ? project.name.split(" ")
                  .map(word => word.charAt(0).toUpperCase())
                  .join("") : '-'}
              </span>
            </div>

          }
          <div className="projectMainInfo capitalize">
            <h2>{project.name ? project.name : '-'}</h2>
            <div className="projectMainSubInfo">
              <div>
                <ProjectStatus status={project.status} />
              </div>
            </div>
          </div>
        </div>
        {/* DIVIDER */}
        <div className="cardBottomSection">
          <div className="cardDivider" />
          {/* ===== card container */}
          <div className="detailsContainer">
            {/* ===== card SECTION 1 */}
            <div className="detailsSection">
              <div className="detailsSectionHeading">
                <div className='detail-item-container'>
                  <div className='flex'>
                    <span className="detailsSectionHeadingSpan">
                      <Icon icon="material-symbols:location-on-rounded" color="#798c9a" width="18" />
                    </span>
                    <span className='detailsTitle'>
                      Location
                    </span>
                  </div>
                  <div className='flex'>
                    <div className='filler' />
                    <h3 className="detailsSectionInfo capitalize">
                      {project.address ? project.address : '-'}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="detailsSection">
              <div className="detailsSectionHeading">
                <div className='detail-item-container'>
                  <div className='flex'>
                    <span className="detailsSectionHeadingSpan">
                      <Icon icon="mdi:worker" color="#798c9a" width="18" />
                    </span>
                    <span className='detailsTitle'>
                      Active Workers
                    </span>
                  </div>
                  <div className='flex'>
                    <div className='filler' />
                    <h3 className="detailsSectionInfo">{project.workers ? project.workers : '-'}</h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="detailsSection">
              <div className="detailsSectionHeading">
                <div className='detail-item-container'>
                  <div className='flex'>
                    <span className="detailsSectionHeadingSpan">
                      <Icon icon="healthicons:city-worker" color="#798c9a" width="18" />
                    </span>
                    <span className='detailsTitle'>
                      Supervisors
                    </span>
                  </div>
                  <div className='flex'>
                    <div className='filler' />
                    <h3 className="detailsSectionInfo">{project.supervisor ? project.supervisor : '-'}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DIVIDER */}
          <div className="cardDivider" />

          {/* ===== CARD SECTION 2 */}
          <div className="detailsContainer">
            <div className="detailsSection">
              <div className="detailsSectionHeading">
                <div className='detail-item-container'>
                  <div className='flex'>
                    <span className="detailsSectionHeadingSpan">
                      <Icon icon="ant-design:calendar-filled" color="#798c9a" width="18" />
                    </span>
                    <span className='detailsTitle'>
                      Date Started
                    </span>
                  </div>
                  <div className='flex'>
                    <div className='filler' />
                    <h3 className="detailsSectionInfo">{project.start_date ? moment(project.start_date).format('DD/MM/YYYY') : '-'}</h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="detailsSection detailsSectionMiddle">
              <div className="detailsSectionHeading detailsExpected">
                <div className='detail-item-container'>
                  <div className='flex'>
                    <span className="detailsSectionHeadingSpan">
                      <Icon icon="ant-design:calendar-filled" color="#798c9a" width="18" />
                    </span>
                    <span className='detailsTitle'>
                      Expected end Date
                    </span>
                  </div>
                  <div className='flex'>
                    <div className='filler' />
                    <h3 className="detailsSectionInfo">{project.end_date ? moment(project.end_date).format('DD/MM/YYYY') : '-'}</h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="detailsSection">
              <h4 className="detailsSectionHeading">
                <div className='detail-item-container'>
                  <div className='flex'>
                    <span className="detailsSectionHeadingSpan">
                      <Icon icon="fa6-solid:user-gear" width="18" />
                    </span>
                    <span className='detailsTitle'>
                      Total Services
                    </span>
                  </div>
                  <div className='flex'>
                    <div className='filler' />
                    <h3 className="detailsSectionInfo detailsSectionMiddle capitalize">{project.services ? project.services : '-'}</h3>
                  </div>
                </div>
              </h4>
            </div>
          </div>

          {/* DIVIDER */}
          <div className="cardDivider" />

          {/* ===== CARD SECTION 3 */}
          <div className="detailsContainer">
            <div className="detailsSection">
              <div className="detailsSectionHeading">
                <div className='detail-item-container '>
                  <div className='flex'>
                    <span className="detailsSectionHeadingSpan">
                      <Icon icon="material-symbols:tools-power-drill-sharp" width="18" />
                    </span>
                    <span className='detailsTitle'>
                      Suppliers
                    </span>
                  </div>
                  <div className='flex'>
                    <div className='filler' />
                    <h3 className="detailsSectionInfo capitalize">{project.suppliers ?? "0"}</h3>
                  </div>
                </div>
              </div>

            </div>
            <div className="detailsSection">
              {(Object.keys(project?.client).length > 0 && user_level && user_level.name.toLowerCase() === "level_1" && is_staffing) && <div className="detailsSectionHeading">
                <div className='detail-item-container'>
                  <div className='flex'>
                    <span className="detailsSectionHeadingSpan">
                      <Icon icon="mdi:company" width="18" />
                    </span>
                    <span className='detailsTitle'>
                      Client
                    </span>
                  </div>
                  <div className='flex'>
                    <div className='filler' />
                    <h3 className="detailsSectionInfo capitalize">{project?.client?.name}</h3>
                  </div>
                </div>
              </div>}
            </div>
            <div className="detailsSection">
              <h4 className="detailsSectionHeading">
                <div className='detail-item-container'>
                  <div className='flex'>
                    <span className="detailsSectionHeadingSpan">
                      <Icon icon="fa6-solid:person-digging" color="#798c9a" width="18" />
                    </span>
                    <span className='detailsTitle'>
                      Total Attendance
                    </span>
                  </div>
                  <div className='flex'>
                    <div className='filler' />
                    <h3 className="detailsSectionInfo detailsSectionMiddle capitalize">{project.attendances ?? "0"}</h3>
                  </div>
                </div>
              </h4>
            </div>
          </div>
        </div>
      </div >
    </ProjectCardStyled >
  )
}

export default ProjectCard;
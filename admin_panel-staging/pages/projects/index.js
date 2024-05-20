import { useState, useEffect, useContext } from 'react';
import { Button, Input, Empty } from "antd";
import {
  SearchOutlined,
  DownOutlined,
  UpOutlined,
  PlusOutlined
} from "@ant-design/icons";

import { StyledProjectsStyled } from "../../components/Projects/StyledProjects.styled";
import Layout from "../../components/Layouts/DashboardLayout/Layout";
import { ProjectButton, ProjectCard, ProjectSkeletonCard } from '../../components';
import { getProjectsDetails, searchProject } from '../../helpers/projects/projects';
import QueueAnim from 'rc-queue-anim';
import { PusherContext } from '../../context/PusherContext';
import { useUserAccess } from '@/components/Layouts/DashboardLayout/AuthProvider';
import ErrorComponent from '@/components/Error/Error';
import { ProjectEmptyOnboarding } from '@/components/Sections/ProjectEmptyOnboarding';
import RenderLoader from '@/components/Loaders/renderLoader';
import CreateSite from '@/components/Onboarding/CreateSite';
import { checkAccessToPage, checkUserAccessToEntity } from '@/utils/accessLevels';

//Search component
const SearchField = ({ query, handleSearch, empty }) => (
  !empty &&
  <Input
    size="middle"
    style={{
      width: "400px",
      height: "40px",
      borderRadius: "5px",
      fontSize: "16px"
    }}
    placeholder="Search Project"
    prefix={<SearchOutlined style={{ color: "#A8BEC5" }} />}
    onChange={(e) => handleSearch(e.target.value)}
    value={query}
    name="search"
    allowClear
    autoComplete="off"
  />

);

const Projects = () => {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [showCount, setShowCount] = useState(4);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [projectData, setProjectData] = useState([]);
  const [projectToShow, setProjectToShow] = useState({ loading: false, data: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [projectUpdate, setProjectUpdate] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [showCreateSite, setShowCreateSite] = useState(false);
  const [entityAccess, setEntityAccess] = useState(false)

  const { userProfile, companyStatus, companyStatusLoading } = useUserAccess();
  const { projectUpdateLoading, setProjectUpdateLoading } = useContext(PusherContext);
  const { user_access, user_level } = userProfile
  const { is_staffing } = companyStatus

  // fetch projects on page
  const fetchProjectsData = async () => {
    setShowCreateSite(false)
    setLoading(true);
    setProjectUpdateLoading(true)
    setProjectToShow({ loading: true, data: [] });

    try {
      const res = await getProjectsDetails();
      if (res?.data && res?.data.length > 0) {
        setProjectData(res.data);
        setProjectToShow({ loading: false, data: res.data.slice(0, showCount) });
        setLoading(false);
        setProjectUpdateLoading(false)
        setError(false);
        setEmpty(false);
      } else {
        setProjectData([]);
        setEmpty(true)
      }
    } catch (err) {
      setProjectData([]);
      setError(true);
    } finally {
      setLoading(false);
      setProjectUpdateLoading(false)
      setProjectUpdate(false);
    }
  };
  // Initial UseEffect
  useEffect(() => {
    fetchProjectsData();
    setEntityAccess(checkUserAccessToEntity("project", "new project", user_access))
  }, [user_access]);

  // Project creation UseEffect
  useEffect(() => {
    if (projectUpdate) {
      fetchProjectsData();
    }
  }, [projectUpdate, projectUpdateLoading]);

  /* Project changes & expanding */

  //expanding and collapsing
  const toggleExpanded = () => {
    setExpanded(false)

    setShowCount(showCount + 4);
    setProjectToShow({ loading: false, data: projectData.slice(0, (showCount + 4)) });
    if (projectToShow.data.length >= projectData.length - 4) {
      setExpanded(true)
    }
    if (projectToShow.data.length >= projectData.length) {
      setProjectToShow({ loading: false, data: projectData.slice(0, 4) });
      setShowCount(4)
      setExpanded(false)
    }

  };

  // handling search
  const handleSearch = (value) => {
    setProjectToShow({ loading: true, ...projectToShow });
    if (value.length >= 1) {
      setQuery(value);
      setIsSearching(true);
      setProjectToShow({ loading: false, data: searchProject(value, projectData) });
    } else {
      setQuery(value);
      setIsSearching(false);
      setProjectToShow({ loading: false, data: projectData.slice(0, showCount) });
    }
  };

  const handleSiteShow = () => {
    setShowCreateSite(!showCreateSite)
    setProjectUpdate(true)
  }

  if (companyStatus?.company_name === "" || companyStatusLoading || user_access.length === 0) {
    return <RenderLoader />
  }
  else if (!checkAccessToPage("project", user_access)) {
    return <ErrorComponent status={403} backHome={true} />
  }
  return (
    <>
      {
        !companyStatus?.is_site_created && !showCreateSite ?
          (<ProjectEmptyOnboarding setShowCreateSite={setShowCreateSite} showCreateSite={showCreateSite} />)
          : showCreateSite ? (
            <div className='h-full flex flex-col items-center justify-center  gap-10'>
              <CreateSite handleShow={handleSiteShow} />
            </div>
          ) : (
            <StyledProjectsStyled>
              <div className="container">
                {/* ======= Projects Section ======= */}
                <div className="header">
                  <div className="project-title">
                    <h1>Projects</h1>
                    <SearchField handleSearch={handleSearch} query={query} empty={empty} />
                  </div>
                  {/* {console.log("Create new project access", user_level && user_level.name.toLowerCase() === "level_1" && entityAccess)} */}
                  <div>
                    {user_level && user_level.name.toLowerCase() === "level_1" && entityAccess ? (
                      // <ProjectButton add={true} setProjectUpdate={setProjectUpdate} />
                      <Button
                        type="primary"
                        className="primaryBtn" onClick={() => setShowCreateSite(!showCreateSite)}
                        icon={<PlusOutlined />} >
                        New Project
                      </Button>
                    ) : null}
                  </div>
                </div>

                {!empty ? (
                  <>
                    <div className="cards">
                      {/* ======= CARDS Section ======= */}
                      {/* ======= actual cards ===== */}
                      {(loading || error) &&
                        <div className='cardsWrapper'>
                          {[1, 2, 3, 4].map((index) => {
                            return <ProjectSkeletonCard loading={loading} error={error} key={index} index={index} />
                          })}
                        </div>
                      }
                      {(!loading && !error) &&
                        <QueueAnim
                          className="demo-content cardsWrapper"
                        >
                          {projectToShow.data.map((project, index) => (
                            <div key={index}>
                              <ProjectCard project={project} key={index} index={index} user_level={user_level} is_staffing={is_staffing} />
                            </div>
                          ))}
                        </QueueAnim>
                      }

                    </div>

                    {/* ====== Button section ===== */}
                    <div className="viewMoreBtnWrapper">
                      {(!isSearching && (projectData.length > 4)) && (

                        <Button
                          type='primary'
                          className='primaryBtn'
                          icon={expanded ? <UpOutlined /> : <DownOutlined />}
                          onClick={() => { setProjectToShow({ loading: true, data: [] }); toggleExpanded() }}
                          disabled={projectToShow.loading}
                        >
                          {expanded ? 'View Less' : 'View More'}
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ display: "flex", justifyContent: "center", height: "50vh", alignItems: "center" }}>
                    <Empty description="No projects found, Click on New Project button to create one."
                    />
                  </div>
                )
                }
              </div>
            </StyledProjectsStyled >)
      }
    </>
  );
}

export default Projects;

Projects.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

import { useContext, useState } from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Icon } from "@iconify/react";

import { StyledProjectsStyled } from "../../Projects/StyledProjects.styled";
import ProjectModals from "../../Modals/ProjectModals/ProjectModals";
import { PusherContext } from "../../../context/PusherContext";

const ProjectButton = (props) => {
  const [modalType, setModalType] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState(false);

  const { setProjectUpdateLoading } = useContext(PusherContext);

  const handleOpenModal = (e) => {
    // e.preventDefault();
    setShowModal(true);
    setModalType(e.target.innerText);
  };

  const OpenAddProjectModal = () => {
    setNewProject(true);
    setShowModal(true);
  };

  const handleCancel = () => {
    setShowModal(false);
    setNewProject(false);
  };

  const handleOk = () => {
    setProjectUpdateLoading(true);
    setShowModal(false);
    setNewProject(false);
  };

  return (
    <>
      {props?.add ? (
        <StyledProjectsStyled>
          <Button
            className="primaryBtn"
            onClick={(e) => handleOpenModal(e)}
            type="primary"
            icon={<PlusOutlined onClick={OpenAddProjectModal} />}
          >
            New Project
          </Button>
        </StyledProjectsStyled>
      ) : (
        <StyledProjectsStyled>
          <Button
            className="primaryBtn"
            onClick={(e) => handleOpenModal(e)}
            type="primary"
          >
            Edit Project
          </Button>
        </StyledProjectsStyled>
      )}

      {/* PROJECT MODALS component */}
      <ProjectModals
        show={showModal}
        type={modalType}
        newProject={newProject}
        handleCancel={handleCancel}
        handleOk={handleOk}
        projectInfo={props.projectInfo}
        setProjectUpdate={props.setProjectUpdate}
      />
    </>
  );
};

export default ProjectButton;

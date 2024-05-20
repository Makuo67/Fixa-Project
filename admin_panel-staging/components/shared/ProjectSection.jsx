import styled from "styled-components";
import { Form, Divider } from "antd";
import { useEffect, useState } from "react";

import { capitalizeAll } from "../../helpers/capitalize";
// import { getProjectsDetails } from "../../../helpers/attendance/attendanceList";
import { getProjectDetails } from "../../helpers/projects/attendance/attendanceList";

const StyledContainer = styled.div`
  border-bottom: 1px solid #a8bec5;
  .form {
    margin: 0px 120px;
    display: flex;
    align-items: center;
    gap: 20px;
    padding-top: 10px;
  }
  .divider {
    height: 50px;
    color: #a8bec5;
  }
`;
export default function ProjectsSelect({ id }) {
  const [projects, setProjects] = useState("Loading...");

  /**
   * Get all projects
   */
  const getProjects = async (id) => {
    try {
      getProjectDetails(id).then((res) => {
        setProjects(res?.name);
      });
    } catch (error) {
      setProjects("Error");
      console.log("ERROR", error);
    }
  };

  const [form] = Form.useForm();

  // set default form values
  useEffect(() => {
    // TODO remove hardcoded id
    getProjects(2);
  }, []);

  return (
    <StyledContainer>
      <Form
        form={form}
        initialValues={{
          remember: true,
        }}
        // onFinish={onFinish}
        // onFinishFailed={onFinishFailed}
        autoComplete="off"
        className="form"
      >
        <p>{capitalizeAll(projects)}</p>
        <Divider className="divider" type="vertical" />
      </Form>
    </StyledContainer>
  );
}

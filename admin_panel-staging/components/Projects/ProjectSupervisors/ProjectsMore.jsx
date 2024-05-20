import { Tooltip } from "antd";
import { capitalizeAll } from "../../../helpers/capitalize";

export const ProjectsMore = (projects) => {
  if (projects.length > 1) {
    return (
      <Tooltip title={projects.map((x) => capitalizeAll(x.name)).join(", ")}>
        <span>
          {capitalizeAll(projects[0].name) +
            ", " +
            (projects.length - 1) +
            " more"}
        </span>
      </Tooltip>
    );
  } else if (projects.length == 1) {
    return capitalizeAll(projects[0].name);
  }
  return "";
};

import { Select } from "antd";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllProjects } from "../../redux/actions/project.actions";

const { Option } = Select;

export default function ProjectsSelect({ multiple, allowClear, size }) {
  const dispatch = useDispatch();
  const projects = useSelector((state) => state.project.list);

  useEffect(() => {
    dispatch(getAllProjects());
  }, []);
  return (
    <Select
      mode={multiple && "multiple"}
      allowClear={allowClear}
      placeholder="Please select"
      style={{ width: "100%" }}
      size={size}
    >
      {projects?.map((item) => {
        return (
          <Option value={item.id} key={item.id} project_name={item.name}>
            {item.name}
          </Option>
        );
      })}
    </Select>
  );
}

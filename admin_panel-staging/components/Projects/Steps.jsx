import { Button, message, Steps, theme } from "antd";
import { useState } from "react";

const ProgressDIsplay = (props) => {
  //   const [current, setCurrent] = useState(props.step);
  return (
    <Steps
      size="small"
      current={props.step}
      items={[
        {
          title: "Company Info",
        },
        {
          title: "Admin",
        },
      ]}
    />
  );
};
export default ProgressDIsplay;

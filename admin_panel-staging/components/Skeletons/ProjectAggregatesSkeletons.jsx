import { Icon } from "@iconify/react";
import { Button, Form, Input, Skeleton, Space, Table } from "antd";

export const ProjectAggregatesSkeletons = () => {
  return (
    <Space>
      <Skeleton.Avatar active={true} size="small" shape="square" />
      <Skeleton.Input active={true} size="small" />
      <Skeleton.Avatar active={true} size="small" shape="square" />
    </Space>
  );
};
export const ProjectInfoSkeletons = (props) => {
  return (
    <>
      <Skeleton
        title={props.title}
        avatar={props.avatar}
        active
        paragraph={{ rows: props.rows }}
        size={props.size}
        style={{
          width: props.width,
        }}
      />
    </>
  );
};

export const RatesSkeletons = ({ rowsCount, width, colsCount }) => {
  return (
    <div style={{ height: "200px" }}>
      {colsCount?.map((item, index) => (
        <Space
          key={index}
          index={index}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "10px",
            width: "100%",
          }}
        >
          {Array(rowsCount)
            .fill(true)
            .map((item, index) => (
              <Skeleton.Input
                key={index}
                active={true}
                size="large"
                style={{
                  width: width,
                }}
              />
            ))}
          <Skeleton.Avatar
            active={true}
            size="large"
            shape="square"
            style={{
              height: "44px",
              width: "44px",

              borderRadius: "8px",
            }}
          />
        </Space>
      ))}
    </div>
  );
};

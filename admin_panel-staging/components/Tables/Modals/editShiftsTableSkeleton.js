import { Skeleton, Table } from "antd";

const EditShiftsTableSkeleton = ({ columns, rowCount, expandable }) => {
  const data = [
    {
      key: 1,
      title: "",
    },
    {
      key: 1,
      title: "",
    },
    {
      key: 1,
      title: "",
    },
    {
      key: 1,
      title: "",
    },
    {
      key: 1,
      title: "",
    },
  ];

  return (
    <div style={{ marginLeft: "100px", marginBottom: "40px" }}>
      <Table
        showHeader={false}
        rowKey="key"
        pagination={false}
        dataSource={data}
        columns={columns.map((column) => {
          return {
            ...column,
            render: function renderPlaceholder() {
              return (
                <Skeleton
                  active
                  key={column.dataIndex}
                  title={true}
                  paragraph={false}
                />
              );
            },
          };
        })}
      />
    </div>
  );
};

export default EditShiftsTableSkeleton;

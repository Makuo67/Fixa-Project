import { Skeleton, Table } from "antd";

const SkeletonTable = ({ columns, rowCount, expandable }) => {
  const expandedRowRender = () => {
    const columns = [
      {
        title: "",
        dataIndex: "title",
        key: "title",
        render: () => <Skeleton active key={1} title={true} paragraph={false} />,
      },
    ];
    const _data = [
      {
        key: 1,
        title: "",
      },
    ];

    return <Table size="small" columns={columns} dataSource={_data} pagination={false} />;
  };
  return (
    <Table
      rowKey="key"
      expandable={expandable && { expandedRowRender }}
      pagination={false}
      dataSource={[...Array(rowCount)].map((_, index) => ({
        key: `key${index}`,
      }))}
      columns={columns.map((column) => {
        return {
          ...column,
          render: function renderPlaceholder() {
            return <Skeleton active key={column.dataIndex} title={true} paragraph={false} />;
          },
        };
      })}
    />
  );
};

export default SkeletonTable;

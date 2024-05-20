import React from 'react';
import { Histogram } from '@ant-design/plots';
import { Container } from './TopPerformers';
import { Spin } from 'antd';

const MetricHistogram = ({ data, loading }) => {

  // console.log("METRIC DATA ===>", data);

  const config = {
    data: data || [],
    height: 200,
    binField: 'value',
    binWidth: 2,
    columnStyle: {
      fill: "#00a1de"
    },
    tooltip: {
      formatter: (datum) => {
        // console.log(datum)
        return { title: `Score range: ${datum.range[0]} - ${datum.range[1]}`, name: "Workers", value: datum.count };
      },
    }

  };

  return (
    <Container>
      <h3>Score distribution</h3>
      <Spin tip="Loading..." spinning={loading}>
        <Histogram {...config} />
      </Spin>
    </Container>
  )
};

export default MetricHistogram

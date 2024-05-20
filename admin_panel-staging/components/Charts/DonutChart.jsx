import React, { useEffect, useState } from 'react';
import { Pie } from '@ant-design/plots';

import MissingData from '../shared/MissingData';
import { colors } from './colors';

const DonutChart = ({ chartData }) => {

  const config = {
    appendPadding: 40,
    data: chartData?.data,
    angleField: "value",
    colorField: "type",
    radius: 1,
    innerRadius: 0.6,
    label: {
      type: "inner",
      offset: "-50%",
      content: "",
      style: {
        textAlign: "center",
        fontSize: 14,
      },
    },
    legend: {
      marker: {
        symbol: "square",
        style: {
          r: 6,
        },
      },
      itemName: {
        formatter: (text) => {
          // Replace whitespace characters with a hyphen
          return text.replace(/\s+(?=\S)/g, '-');
        },
      },
      itemWidth: 500,

    },
    color: colors,
    interactions: [
      {
        type: "element-selected",
      },
      {
        type: "element-active",
      },
    ],
    statistic: {
      title: {
        content: "Total:",
        style: {
          fontSize: 15,
          fontWeight: 500,
          fontSize: 12,
          textAlign: "center",
          color: "#798C9A",
        },
      },
      content: {
        style: {
          whiteSpace: "pre-wrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          fontSize: 20,
          color: "#1C2123",
        },
        content: `${chartData?.total}`,
      },
    },
  };


  const extractWordsFromString = (str) => {
    const words = [];
    let word = "";
    for (let i = 0; i < str.length; i++) {
      const char = str.charAt(i);
      if (char === " ") {
        words.push(word);
        word = "";
      } else {
        word += char;
      }
    }
    if (word.length > 0) {
      words.push(word);
    }
    return words.join('-');
  }

  return (
    <>

      {chartData !== null && chartData !== undefined && Object.keys(chartData).length > 1 ? (
        <Pie {...config} width={550} />
      ) : (
        <MissingData />
      )}
    </>
  );
};

export default DonutChart;

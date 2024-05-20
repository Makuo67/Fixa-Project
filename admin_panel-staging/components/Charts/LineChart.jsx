import { Line } from '@ant-design/plots';

import MissingData from '../shared/MissingData';
import { capitalize } from '../../helpers/excelRegister';
import { colors } from './colors';

const LineChart = ({ lineData }) => {

    // The function below will dynamically retrieve the first field of the data in the lineData object, extract the dynamic Field, excluding the "name" and "shifts" fields.
    const xFieldExtractor = (dataObj) => {
        let dynamicXField = 'year';
        if (dataObj !== null && dataObj !== undefined && Object.keys(dataObj).length > 1 && dataObj.hasOwnProperty('data') && dataObj.data.length > 0 && dataObj.data[0].hasOwnProperty('name') && dataObj.data[0].hasOwnProperty('shifts')) {
            dynamicXField = Object?.keys(dataObj?.data[0]).filter(key => key !== "name" && key !== "shifts")[0];
        }
        return dynamicXField;
    }

    const dynamicXField = xFieldExtractor(lineData)

    const config = {
        data: lineData?.data,
        xField: dynamicXField,
        yField: 'shifts',
        seriesField: 'name',
        tooltip: {
            title: 'Shifts by Name', // set tooltip title
            formatter: (datum) => ({ name: capitalize(datum.name), value: `${datum.shifts}` }), // format tooltip data
        },
        legend: {
            position: 'bottom',
            marker: {
                symbol: 'square',
                style: {
                    r: 2,
                    lineWidth: 10,
                },
            },
        },
        color: colors,
        smooth: true,
        animation: {
            appear: {
                animation: 'path-in',
                duration: 3000,
            },
        },
    };

    return (
        <>
            {lineData !== null && lineData !== undefined && Object.keys(lineData).length > 1 ? (
                <Line {...config} />
            ) : (
                <MissingData />
            )}
        </>

    )
}

export default LineChart;
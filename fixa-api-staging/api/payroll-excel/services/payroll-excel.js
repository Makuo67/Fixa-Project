'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const excelJs = require('exceljs');
module.exports = {
    /* Start of excel export data function */
    async exportExcel(columns, data, file_name) {
        // Create a new workbook
        const workbook = new excelJs.Workbook();
        // New Worksheet
        const worksheet = workbook.addWorksheet(`${file_name}`);
        const filename = `./public/downloads/${file_name}.csv`;
        // Column for data in excel.
        worksheet.columns = Object.values(columns).map((key) => ({ header: key, key }));

        for (let index = 0; index < data.length; index++) {
            let element = data[index];
            //saving in excel sheet
            worksheet.addRow(element);
        }
        try {
            await workbook.csv.writeFile(filename);
            // console.log('====> File saved');
        } catch (error) {
            console.log('====> Something went wrong trying to save the file', error);
            filename = false;
        }
        return filename;
    },
    /* End of function */
};

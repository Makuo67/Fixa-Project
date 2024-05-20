import { useEffect, useState } from 'react';
import { Button, Alert, Spin, Upload } from 'antd';
import { useRouter } from 'next/router';

import { getCutomTemporaryTable } from '../../helpers/excelRegister';
import { Icon } from '@iconify/react';
import { readBulkExcelFile } from '../../helpers/workforce/workforce';
import { payoutGetBulkTemp } from '@/helpers/payments/payout/payout';

const WorkerExcel = ({
  handleNext,
  handleCancel,
  uploadSuccess,
  setUploadSuccess,
  setFileData,
  setFileColumns,
  setFileId,
  setFileName,
  type,
  paymentId,
  payoutInfo
}) => {
  const [tempAvailable, setTempAvailable] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  const router = useRouter();
  const { Dragger } = Upload;

  const previewData = () => {
    if (type === "payout_momo") {
      router.push({
        pathname: `/finance/payments/preview`,
        query: {
          paymentId,
          paymentName: payoutInfo?.payout_name
        }
      })
    } else {
      router.push(`worker-registration/file/preview`);
    }
  }

  // Check the availability of data in temporary table
  const fetch_temp_Data = () => {
    if (type === "payout_momo") {
      const payload = {
        start: 0,
        limit: -1,
        payment_id: paymentId
      }
      payoutGetBulkTemp(payload).then((res) => {
        if (res?.data?.data?.payees?.length > 0) {
          setTempAvailable(true)
        }
      })
    } else {
      getCutomTemporaryTable(0).then((res) => {
        if (res?.data?.workers?.length > 0) {
          setTempAvailable(true);
        }
      });
    }
  }

  useEffect(() => {
    fetch_temp_Data();

  }, []);

  const allowedExtensions = ['.csv', '.xls', '.xlsx'];
  const acceptExtensions = allowedExtensions.join(',');

  // file processing function
  const fileProcessing = async (file) => {
    if (file) {
      setUploadLoading(true);
      const response = await readBulkExcelFile(file);
      // TODO: validate the response
      if (response) {
        setUploadLoading(false)
        setUploadSuccess(true);
        setFileData(response.fileData);
        setFileColumns(response.fileColumns);
        setFileId(response.fileId);
        setFileName(response.fileName);
        handleNext();

      } else {
        setUploadLoading(false)
        setUploadSuccess(false);
      }
    }
  }

  // Dragger props for upload
  const props = {
    name: 'file',
    accept: acceptExtensions,
    showUploadList: false,
    multiple: true,
    customRequest: async ({ onSuccess, onError, file }) => {
      fileProcessing(file)
    }
  };

  return (
    <div>
      <div className="flex flex-col items-center justify-center gap-5 h-full w-full">
        <h1 className="text-black font-inter text-xl md:text-2xl font-medium leading-normal">{type === "payout_momo" ? "Bulk Add Payees" : "Bulk import multiple workers"}</h1>
        {type === "payout_momo" ? <div className=" flex flex-col text-center text-base font-medium w-2/3" >
          <p className="text-center  text-title">
            Upload any excel, csv or text file with the list of <b>Payees</b> and their Payment methods.
          </p>
          <a className='text-primary' href="https://datadumpfixa.s3.eu-central-1.amazonaws.com/workers_registration_template.xlsx" download> (You can download and use this provided template)
          </a>
        </div> : <div className=" flex flex-col text-center text-base font-medium w-2/3" >
          <p className="text-center  text-title">
            Upload any excel, csv or text file with the list of <b>Rwandan </b>
            workers you want to bulk add that include an <b>ID Number</b> and <b>Phone Number</b> column.
          </p>
          <a className='text-primary' href="https://datadumpfixa.s3.eu-central-1.amazonaws.com/workers_registration_template.xlsx" download> (You can download and use this provided excel sheet template)
          </a>
        </div>

        }

        {/* dragger */}

        <div className='w-full'>
          <Spin spinning={uploadLoading}>

            <Dragger {...props} className="flex flex-col items-center rounded-md bg-white border-2 border-dashed border-primary w-full text-primary" >
              <div className='flex flex-col items-center gap-2'>
                <p className="flex items-center justify-center">
                  <Icon icon="fa6-solid:file-circle-plus" width="40" height="36" className='' />
                </p>
                <p className="p-2 rounded-md text-white bg-primary items-center justify-center">Select an Excel or CSV file to upload</p>
                <p className="text-center text-base">
                  Or drag and drop it here
                </p>
              </div>
            </Dragger>
          </Spin>
        </div>

        {/* notifications */}
        {tempAvailable && (
          <div className='w-full'>
            <Alert
              message={`Unregistered ${type === "payout_momo" ? "payees" : "workers"}`}
              description={`There is still unregistered ${type === "payout_momo" ? "payees" : "workers"} available, You can visit the page by clicking on View button`}
              type="info"
              showIcon
              action={
                <Button size="default" type="dashed" onClick={previewData}>
                  View
                </Button>
              }
            />
          </div>
        )}

        <div className="flex flex-row gap-4">
          <Button
            // disabled={!uploadSuccess}
            type="secondary"
            className="secondaryBtn cursor-pointer"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            disabled={!uploadSuccess}
            className="primaryBtn"
            onClick={handleNext}
          >
            Next
          </Button>
        </div>
      </div>




    </div >
  )
}

export default WorkerExcel;
import { useEffect, useState } from "react";
import { Button, Progress } from "antd";
import { useRouter } from "next/router";

import WorkersColumnsMapping from "@/components/Uploads/WorkersColumnsMapping";
import WorkerExcel from "@/components/Uploads/WorkerExcel";
import { usePusher } from "@/context/PusherContext";


const BulkRegistration = ({ onBack }) => {
    const [viewSection, setViewSection] = useState('upload');
    const [fileData, setFileData] = useState([]);
    const [fileColumns, setFileColumns] = useState([]);
    const [fileId, setFileId] = useState('');
    const [fileName, setFileName] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const router = useRouter();

    const handleNext = () => {
        if (viewSection === 'upload') {
            setViewSection('mapping');
        }
        else {
            onBack();
        }
    }

    const handleCancel = () => {
        setViewSection('upload');
        router.push("/workforce/worker-registration?type=bulk");
    }


    return (
        <div className='flex flex-col w-full h-full'>

            {viewSection === 'upload' && (
                <div className='w-32 h-10'>
                    <Button type="secondary" className='secondaryBtn' onClick={onBack}>Back</Button>
                </div>
            )}
            {viewSection === 'upload' ? (
                <WorkerExcel handleNext={handleNext} fileName={fileName}
                    uploadSuccess={uploadSuccess}
                    setUploadSuccess={setUploadSuccess}
                    setFileData={setFileData}
                    setFileColumns={setFileColumns}
                    setFileId={setFileId}
                    setFileName={setFileName}
                    handleCancel={onBack}
                    type={"registration"}
                />
            ) : viewSection === 'mapping' ? (
                <WorkersColumnsMapping
                    uploadSuccess={uploadSuccess}
                    fileId={fileId}
                    fileName={fileName}
                    fileData={fileData}
                    fileColumns={fileColumns}
                    handleCancel={handleCancel}
                    handleNext={handleNext}
                    type={"registration"}
                />
            ) : null}
        </div>

    )

}
export default BulkRegistration;
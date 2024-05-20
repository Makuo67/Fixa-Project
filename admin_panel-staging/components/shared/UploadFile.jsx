import { Upload, message } from "antd";
import {
    InboxOutlined,
    LoadingOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    PlusOutlined
} from "@ant-design/icons";
import { useState } from "react";
import AWS from "aws-sdk";
import { extractKeyFromUrl } from "@/utils/s3Utils";

const Dragger = Upload.Dragger;

export default function UploadFile(data) {
    const [upload, setUpload] = useState(null);
    const [progress, setProgress] = useState(0);
    const [filePreview, setFilePreview] = useState(null)
    const [fileList, setFileList] = useState([
        {
            uid: '',
            name: '',
            status: '',
            url: '',
        }])

    const folderName = process.env.NEXT_PUBLIC_AWS_COMPANY_DOCUMENT_STORAGE;
    const bucket = process.env.NEXT_PUBLIC_AWS_IMAGES_BUCKET_NAME;

    const s3 = new AWS.S3({
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
        region: process.env.NEXT_PUBLIC_AWS_REGION,
    });

    const props = {
        name: "file",
        multiple: true,
        customRequest: async ({ file, onSuccess, onError }) => {
            const formData = new FormData();
            formData.append("file", file);
            setFileList((pre) => {
                return [
                    {
                        uid: file?.uid,
                        name: file?.name,
                        status: 'uploading',
                        url: '',
                    }
                ]
            })

            try {
                // check if folder is available
                if (!folderName) {
                    throw new Error("Company storage not found, Contact Admin.");
                }
                // check if folder exists
                const folderExists = await s3.listObjectsV2({
                    Bucket: bucket,
                    Prefix: folderName,
                    MaxKeys: 1
                }).promise();

                let folderExistance = folderExists.$response.data.Contents.length > 0;

                if (!folderExistance) {
                    // create folder
                    await s3.putObject({
                        Bucket: bucket,
                        Key: folderName + '/'
                    }).promise();
                }

                const uploadParams = {
                    Bucket: bucket,
                    Key: `${folderName}/${file.name}`,
                    Body: file,
                    ACL: "public-read-write"
                };

                const uploaded = s3.upload(uploadParams);
                uploaded.on("httpUploadProgress", (p) => {
                    setProgress(Math.round((p.loaded / p.total) * 100));
                });
                setUpload(uploaded);

                const res = await uploaded.promise();
                if (res) {
                    // console.log("res", res);
                    setFileList((pre) => {
                        return [
                            {
                                uid: file?.uid,
                                name: file?.name,
                                status: 'done',
                                url: res?.Location,
                            }
                        ]
                    })
                    setFilePreview(res?.Location);
                    message.success(`File uploaded successfuly.`);
                    onSuccess(res);

                    // delete the previous object
                    if (data?.existingFile) {
                        const objectKey = extractKeyFromUrl(bucket, process.env.NEXT_PUBLIC_AWS_REGION, data?.existingFile);
                        const deleteParams = {
                            Bucket: bucket,
                            Key: objectKey,
                        };
                        await s3.deleteObject(deleteParams).promise();
                    }
                }
                data?.setFileUrl(res?.Location)
            } catch (err) {
                // console.error("Upload error ==== ", err);
                setFileList((pre) => {
                    return [
                        {
                            uid: file?.uid,
                            name: file?.name,
                            status: 'error',
                            url: '',
                        }
                    ]
                })
                if (err.message === "Company storage not found, Contact Admin.") {
                    message.error(err.message);
                } else {
                    message.error("File Upload failed.");
                }
                onError();
            }
        },
        beforeUpload: (file) => {
            const isFile = file.type === "file/pdf" || file.type === "application/pdf";
            console.log("file", file.type)
            if (!isFile) {
                message.error("You can only upload PDF files!");
            }
            const isLt2M = file.size / 1024 / 1024 < 5;
            if (!isLt2M) {
                message.error("File must smaller than 5MB!");
            }
            return isFile && isLt2M;
        },
        iconRender: (file) => {
            if (file.status === 'uploading') {
                return <LoadingOutlined />;
            } else if (file.status === 'done') {
                return <CheckCircleOutlined />;
            } else if (file.status === 'error') {
                return <CloseCircleOutlined style={{ color: 'red' }} />;
            }
        }
    };

    return (
        <>
            <Dragger {...props}>
                <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                    {data?.uploadText ? data?.uploadText : "Click or drag single file in this area to upload your image"}
                </p>
                <p className="ant-upload-hint">(Preferably 500x500 px)</p>
            </Dragger>
        </>
    );
}

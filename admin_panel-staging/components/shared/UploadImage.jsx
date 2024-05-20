import { Upload, message } from "antd";
import {
    InboxOutlined,
    LoadingOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    PlusOutlined
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import AWS from "aws-sdk";
import ImgCrop from 'antd-img-crop';
import { extractKeyFromUrl } from "@/utils/s3Utils";

const Dragger = Upload.Dragger;

export default function UploadImage(data) {
    const [upload, setUpload] = useState(null);
    const [progress, setProgress] = useState(0);
    const [imagePreview, setImagePreview] = useState(null)
    const [fileList, setFileList] = useState([
        {
            uid: '',
            name: '',
            status: '',
            url: '',
        }])

    const folderName = process.env.NEXT_PUBLIC_AWS_COMPANY_IMAGE_STORAGE;
    const documentFolderName = process.env.NEXT_PUBLIC_AWS_COMPANY_DOCUMENT_STORAGE;
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
            formData.append("image", file);
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
                if (!folderName || !documentFolderName) {
                    throw new Error("Company storage not found, Contact Admin.");
                }
                // check if folder exists
                const folderExists = await s3.listObjectsV2({
                    Bucket: bucket,
                    Prefix: data?.isDoc ? documentFolderName : folderName,
                    MaxKeys: 1
                }).promise();

                let folderExistance = folderExists.$response.data.Contents.length > 0;

                if (!folderExistance) {
                    // create folder
                    await s3.putObject({
                        Bucket: bucket,
                        Key: data?.isDoc ? documentFolderName : folderName + '/'
                    }).promise();
                }

                const uploadParams = {
                    Bucket: bucket,
                    Key: `${data?.isDoc ? documentFolderName : folderName}/${file.name}`,
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
                    setImagePreview(res?.Location);
                    message.success(`File uploaded successfuly.`);
                    onSuccess(res);

                    // delete the previous object
                    if (data?.existingImage) {
                        const objectKey = extractKeyFromUrl(bucket, process.env.NEXT_PUBLIC_AWS_REGION, data?.existingImage);
                        const deleteParams = {
                            Bucket: bucket,
                            Key: objectKey,
                        };
                        await s3.deleteObject(deleteParams).promise();
                    }
                }
                data?.setImageUrl(res?.Location)
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
            const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
            const isPdfOrJpg = file.type === "application/pdf" || file.type === "image/jpeg";
            if (data?.isDoc === true && !isPdfOrJpg) {
                message.error("You can only upload PDF or JPG files!");
            }
            else if (!data?.isDoc && !isJpgOrPng) {
                message.error("You can only upload JPG or PNG files!");
            }

            const isLt2M = file.size / 1024 / 1024 < 2;
            if (!isLt2M) {
                message.error("Image must smaller than 2MB!");
            }
            return data?.isDoc ? isPdfOrJpg : isJpgOrPng && isLt2M;
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

    const uploadButton = (
        <button className="border-0 bg-none"
            type="button"
        >
            <PlusOutlined />
            <div className="mt-2"
            >
                Upload
            </div>
        </button>
    );

    // To render the existing image
    useEffect(() => {
        if (data.existingImage) {
            setImagePreview(data.existingImage)
        }
    }, []);


    return (
        <>
            {data?.picture ? (
                <ImgCrop
                    modalTitle="Crop Image"
                    modalOk="Crop"
                    modalCancel="Cancel"
                    modalProps={{
                        okButtonProps: {
                            className: 'bg-primary'
                        }
                    }}
                    cropShape="round"
                    className="w-full h-full"
                    cropperOptions={{
                        cropBoxResizable: false,
                        cropBoxMovable: false,
                        toggleDragModeOnDblclick: false,
                        autoCrop: true,
                        autoCropArea: 1,
                    }}
                >

                    <Upload
                        {...props}
                        name="avatar"
                        listType="picture-circle"
                        className="w-full h-full"
                        showUploadList={false}
                        alt="avatar"
                        fileList={fileList}
                    // onPreview={onPreview}
                    >
                        {imagePreview ? (
                            <img
                                src={imagePreview}
                                alt="avatar"
                                className="w-full h-full bg-primary rounded-full"
                            />
                        ) : (
                            uploadButton
                        )}
                    </Upload>
                </ImgCrop>
            ) : (

                <Dragger {...props}>
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">
                        {data?.uploadText ? data?.uploadText : "Click or drag single file in this area to upload your image"}
                    </p>
                    <p className="ant-upload-hint">{data?.hint ? data?.hint : 'Preferably 500x500 px'}</p>
                </Dragger>
            )}
        </>
    );
}

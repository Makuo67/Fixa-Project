import { Tooltip, Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { message } from "antd";
import AWS from "aws-sdk";

const Dragger = Upload.Dragger;

const DynamicDragger = ({
  rename_to,
  setFields,
  tooltip_warning,
  hint,
  text,
  draggerProps,
  extraUploadParams,
  isCertificate
}) => {
  const customRequest = async (options) => {
    const { onSuccess, onError, file, onProgress } = options;
    let file_ = file;
    const bucketName = isCertificate
        ? process.env.NEXT_PUBLIC_AWS_INVOICE_CERTIFICATE_BUCKET_NAME
        : process.env. NEXT_PUBLIC_AWS_IMAGES_BUCKET_NAME;

    if (rename_to) {
      file_ = new File([file], rename_to, { type: file.type });
    }

    const uploadParams = {
      Bucket: bucketName,
      Key: `${file_.name}.${file_.type.split("/")[1]}`,
      Body: file_,
      ...extraUploadParams,
    };
    // console.log("Upload Params:", uploadParams);

    const s3 = new AWS.S3({
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
      region: process.env.NEXT_PUBLIC_AWS_REGION,
    });
    try {
      const uploaded = s3.upload(uploadParams);

      uploaded.on("httpUploadProgress", (event) => {
        const percent = Math.floor((event.loaded / event.total) * 100);
        setProgress(percent);
        if (percent === 100) {
          setTimeout(() => setProgress(0), 1000);
        }
        onProgress({ percent: (event.loaded / event.total) * 100 });
      });

      const res = await uploaded.promise();
      // console.log("AWS S3 RES", res)
      if (res) {
        message.success(`file uploaded successfuly.`);
        setFields(res);
        onSuccess("Ok");
      }
    } catch (err) {
      console.log(err);
      message.error("Something went wrong. Please try again later.");
      onError({ err });
    }
  };

  return (
    <Tooltip title={draggerProps?.disabled && tooltip_warning}>
      <div>
        <Dragger customRequest={customRequest} name="file" {...draggerProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">{text}</p>
          <p className="ant-upload-hint">{hint}</p>
        </Dragger>
      </div>
    </Tooltip>
  );
};

export default DynamicDragger;

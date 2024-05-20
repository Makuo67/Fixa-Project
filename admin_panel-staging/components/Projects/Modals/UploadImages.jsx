import { Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useState } from "react";
import { message } from "antd";
import AWS from "aws-sdk";
import { StyledAddClient } from "./StyledAddClient.styled";

const Dragger = Upload.Dragger;
export default function UploadImages(data) {
  const [upload, setUpload] = useState(null);
  const [progress, setProgress] = useState(0);

  const props = {
    name: "file",
    multiple: true,
    customRequest: async ({ file, onSuccess, onError }) => {
      const formData = new FormData();
      formData.append("image", file);

      // Modify the upload parameters here
      const uploadParams = {
        Bucket: process.env.NEXT_PUBLIC_AWS_IMAGES_BUCKET_NAME,
        Key: `${file.name}`,
        Body: file,
        ACL: "public-read-write",
      };

      const s3 = new AWS.S3({
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
        region: process.env.NEXT_PUBLIC_AWS_REGION,
      });
      try {
        const uploaded = s3.upload(uploadParams);
        uploaded.on("httpUploadProgress", (p) => {
          setProgress(Math.round((p.loaded / p.total) * 100));
        });
        setUpload(uploaded);
        const res = await uploaded.promise();
        if (res && data.project) {
          console.log("file uploaded successfully", res);
          message.success(` file uploaded successfuly.`);
          data.type === "new" || data.type === "edit"
            ? data.handler((pre) => {
              return {
                ...pre,
                project_profile_url: res?.Location,
              };
            })
            : console.log("nothing to do");
        }
        // console.log(`File uploaded successfully: ${file.name}`);
      } catch (err) {
        console.error(err);
        message.error("Something went wrong. Please try again later.");
      }
    },
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
      if (!isJpgOrPng) {
        message.error("You can only upload JPG or PNG files!");
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error("Image must smaller than 2MB!");
      }
      return isJpgOrPng && isLt2M;
    },
  };

  return (
    <StyledAddClient progress={progress}>
      <Dragger {...props}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Click or drag single file in this area to upload</p>
        <p className="ant-upload-hint">{data.hint ? data.hint : "(Preferably 500x500 px)"} </p>
      </Dragger>
    </StyledAddClient>
  );
}

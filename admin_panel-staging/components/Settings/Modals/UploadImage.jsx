import { Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useState } from "react";
import { message } from "antd";
import AWS from "aws-sdk";
import { StyledAddClient } from "../../Projects/Modals/StyledAddClient.styled";

const Dragger = Upload.Dragger;
export default function UploadImage(data) {
  const [upload, setUpload] = useState(null);
  const [progress, setProgress] = useState(0);

  const props = {
    name: "file",
    multiple: true,
    customRequest: async ({ file, onSuccess, onError }) => {
      const formData = new FormData();
      formData.append("image", file);

      const uploadParams = {
        Bucket: process.env.NEXT_PUBLIC_AWS_IMAGES_BUCKET_NAME,
        Key: `${file.name}`,
        Body: file,
        ACL: "public-read-write"
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
        data.infoUpdated();
        if (res) {
          message.success(` file uploaded successfuly.`);
        }
        data?.setCompanyData((pre) => {
          return {
            ...pre,
            img_url: res?.Location,
          };
        });
        // console.log(`File uploaded successfully: ${file.name}`);
      } catch (err) {
        console.error(err);
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
        <p className="ant-upload-text">
          Click or drag single file in this area to upload
        </p>
        <p className="ant-upload-hint">(Preferably 500x500 px)</p>
      </Dragger>
    </StyledAddClient>
  );
}

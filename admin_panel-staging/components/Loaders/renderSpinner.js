import React from 'react';
import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";

export const RenderSpinner = () => (
    <>
        <div className="flex justify-center items-center !h-40">
            <LoadingOutlined />
        </div>
    </>
);
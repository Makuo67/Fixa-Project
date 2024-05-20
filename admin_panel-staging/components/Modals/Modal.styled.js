import { Modal } from "antd";
import styled from "styled-components";

export const StyledModal = styled(Modal)`
    top: 0;
    width: 70%;
    height: 100%;
    
    .ant-modal-header{
        padding: 20px 40px;
    }
    .ant-modal-body{
        padding-left: 40px;
        padding-right: 40px;
        height: 770px;
    }
    .ant-modal-close{
        right: 20px;
        top: 5px;
    }
`
import { notification } from "antd";
import { capitalizeAll } from "../capitalize";

export const handleError = (code, message) => {
    switch (code) {
        case 400:
            notification.error({
                message: "Failed",
                description: `${capitalizeAll(message)}`,
            });
            break;
        default:
            notification.success({
                message: "Success",
                description: `${capitalizeAll(message)}`,
            });
    }
}
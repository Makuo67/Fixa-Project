
import { Icon } from "@iconify/react";
import React from "react"
import styled from "styled-components"

const StyledStatus = styled.div`
    display: flex;
    align-items: center;
    padding: 1px 5px;
    gap: 5px;
    height: 22px;

    border-radius: 10px;
    color: ${(prop) => prop.color};
    background: ${(prop) => prop.background_color};

    font-size: 12px;

    svg {
        margin-bottom:1px ;
    }
    `;

const getComponent = (status) => {

    switch (status) {
        case "not_started":
            return {
                icon: <Icon icon="mdi:clock-outline" color="#2C3336" />,
                text: "Not Started",
                color: "#2C3336",
                background_color: "#DCEBF1"
            }
        case "ongoing":
            return {
                icon: <Icon icon="mdi:clock-outline" color="#faad14" />,
                text: "Ongoing",
                color: "#FAAD14",
                background_color: "#FFF7E6"
            }
        case "onhold":
            return {
                icon: <Icon icon="material-symbols:pause-rounded" color="#f5222d" />,
                text: "On Hold",
                color: "#F5222D",
                background_color: "#FFF1F0",
            }
        case "completed":
            return {
                icon: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.69531 7.96875C5.4375 8.22656 5.03906 8.22656 4.78125 7.96875L3.28125 6.46875C3.02344 6.21094 3.02344 5.8125 3.28125 5.55469C3.53906 5.29688 3.9375 5.29688 4.19531 5.55469L5.25 6.58594L7.78125 4.05469C8.03906 3.79688 8.4375 3.79688 8.69531 4.05469C8.95312 4.3125 8.95312 4.71094 8.69531 4.96875L5.69531 7.96875ZM12 6C12 9.32812 9.30469 12 6 12C2.67188 12 0 9.32812 0 6C0 2.69531 2.67188 0 6 0C9.30469 0 12 2.69531 12 6ZM6 1.125C3.30469 1.125 1.125 3.32812 1.125 6C1.125 8.69531 3.30469 10.875 6 10.875C8.67188 10.875 10.875 8.69531 10.875 6C10.875 3.32812 8.67188 1.125 6 1.125Z" fill="#389E0D" />
                </svg>
                ,
                text: "Completed",
                color: "#389E0D",
                background_color: "#F6FFED"
            }
        default:
            return { icon: undefined, text: undefined, color: undefined, background_color: undefined };
    }
}


const ProjectStatus = ({ status, showArrow }) => {
    const info = getComponent(status)
    return <StyledStatus color={info.color} background_color={info.background_color}>
        {info.icon}
        {info.text}
        {showArrow && <Icon
            icon="material-symbols:keyboard-arrow-down-rounded"
            className="arrow"
            style={{ marginTop: 2 }}
        />}
    </StyledStatus>
}

export default ProjectStatus
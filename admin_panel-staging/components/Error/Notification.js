import React from 'react';
import { Alert } from 'antd';

/* How to use :
Import it from components and add the props as below
<Notification message={'hello'} type={'success'} showIcon />
*/

const Notification = ({ message, type, showIcon }) => {
    if (showIcon) {

        return (
            <Alert
                message={message}
                type={type}
                showIcon
            />
        )
    }

    return (
        <Alert
            message={message}
            type={type}
            style={{
                flexWrap: 'nowrap'
            }}
        />
    )
}

export default Notification;
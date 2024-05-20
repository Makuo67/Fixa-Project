import { Skeleton } from 'antd'

import { DrawerStyles } from './Drawer.styled';

const AttendanceStatSkeleton = () => {
    return (
        <DrawerStyles>
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '4px',
                justifyContent: 'space-between'
            }}>
                {[1, 2, 3, 4].map((item, index) => (

                    <Skeleton.Button className="buttonAggregatesSkeleton"
                        active
                        size="large"
                        key={index}
                    />
                ))}

            </div>
        </DrawerStyles>
    )
}

export default AttendanceStatSkeleton;
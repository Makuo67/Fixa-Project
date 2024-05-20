import { Skeleton } from 'antd'

const PayoutStatsSkeleton = () => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingLeft: '5px',
        }}>
            {[1, 2, 3, 4].map((item, index) => (

                <Skeleton.Button style={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '5px',
                    right: '5px',
                    width: '250px',
                    height: '80px',
                    minWidth: '140px',
                }}
                    active
                    size="default"
                    key={index}
                />
            ))}

        </div>
    )
}

export default PayoutStatsSkeleton;
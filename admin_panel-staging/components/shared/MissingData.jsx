import { ApiOutlined } from "@ant-design/icons";

const MissingData = ({ index }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            width: '100%',
            gap: '20px'
        }}
            key={index}
        >
            <ApiOutlined style={{ fontSize: '100px', color: '#171832' }} />
            <h2 style={{ color: '#171832', padding: '0', margin: '0' }}>Data Not Found!</h2>
        </div>
    )
}

export default MissingData;
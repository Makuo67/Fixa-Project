import { Card } from 'antd';
import MissingData from '../../shared/MissingData';

const ProjectSkeletonCard = ({ loading, error, index }) => {
    return loading ? (
        <Card
            style={{
                width: '100%',
            }}
            loading={loading}
            key={index}
        >
        </Card >
    ) : (

        <Card
            style={{
                width: '100%',
            }}
            loading={false}
            key={index}
        >
            <MissingData index={index} />
        </Card >
    )
}

export default ProjectSkeletonCard;

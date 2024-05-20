import { useState, useEffect } from 'react';
import { Radio, Tooltip } from 'antd';
import { capitalizeAll } from '../../utils/capitalizeAll';

const AccessCard = ({ title, accessLevels, setAccessSelected, resetState, setResetState, accessId, resetStateCount, view }) => {
    const [selectedAccess, setSelectedAccess] = useState(null);
   

    const handleAccessChange = (e) => {
        setSelectedAccess(e.target.value);
        setAccessSelected(e.target.value);
    };

    useEffect(()=>{
        if(view === 'settings'){
            setSelectedAccess(accessId)
        }
    },[resetStateCount])

    // resetting the radio selection
    useEffect(() => {
        if (resetState && view === 'onboarding') {
            setSelectedAccess(null);
        }
        return () => {
            setResetState(false);
        }
    }, [resetState]);
    
    // accessId the radio selection
    // useEffect(() => {
    //     if (accessId) {
    //         setSelectedAccess(accessId);
    //     }
    // }, [accessId]);

    return (
        <div className='w-full h-[100px] flex flex-col gap-2 bg-secondary text-primary rounded-md border border-solid border-primary p-2'>
            <p className='text-sm font-bold'>{capitalizeAll(title)}</p>
            <hr className='bg-primary w-full h-[1px]' />
            <div className='w-full'>
                <Radio.Group onChange={handleAccessChange} value={selectedAccess ? selectedAccess : null}>
                    {accessLevels.map((level) => (
                       
                        <Radio key={level.id}
                            value={level.id}
                        >
                            <Tooltip title={level.description}>
                                {capitalizeAll(level.title)}
                            </Tooltip>
                        </Radio>
                    ))}
                </Radio.Group>
            </div>
        </div>
    );
};

export default AccessCard;

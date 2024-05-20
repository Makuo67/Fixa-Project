import { Skeleton, } from 'antd';

const CustomSkeletonBtn = ({ height, width }) => (
    <Skeleton.Button active={true} size='large'
        style={{ height: `${height}`, width: `${width}` }}
        block
    />
)

const OnboardingSkeleton = ({ steps, form, photo }) => {

    return (
        <>
            {steps && (

                <div className="w-full flex flex-col gap-8 h-full justify-start">
                    <div className='w-full flex flex-col gap-2'>
                        <CustomSkeletonBtn height={'30px'} width={'200px'} />
                        <CustomSkeletonBtn height={'30px'} width={'300px'} />
                    </div>
                    <div className='w-5/6 h-full flex gap-4 flex-col pr-5'>
                        <CustomSkeletonBtn height={'70px'} width={'100%'} />
                        <CustomSkeletonBtn height={'70px'} width={'100%'} />
                        <CustomSkeletonBtn height={'70px'} width={'100%'} />
                    </div>
                </div>
            )}

            {form && (
                <div className="w-full flex flex-col gap-8 h-full justify-center">
                    <div className='w-full flex flex-col gap-2'>
                        <CustomSkeletonBtn height={'30px'} width={'200px'} />
                        <CustomSkeletonBtn height={'30px'} width={'300px'} />
                    </div>
                    <div className='w-5/6 h-full flex gap-4 flex-col pr-5'>
                        <CustomSkeletonBtn height={'150px'} width={'100%'} />
                        <CustomSkeletonBtn height={'60px'} width={'100%'} />
                        <CustomSkeletonBtn height={'60px'} width={'100%'} />
                        <div className='flex gap-2'>

                            <CustomSkeletonBtn height={'60px'} width={'100%'} />
                            <CustomSkeletonBtn height={'60px'} width={'100%'} />
                        </div>
                        <CustomSkeletonBtn height={'60px'} width={'100%'} />
                    </div>

                </div>
            )}

            {photo && (
                <div className="w-full flex flex-col h-full">
                        <CustomSkeletonBtn height={'610px'} width={'100%'} />
                </div>
            )}
        </>
    )
}

export default OnboardingSkeleton;
import { Icon } from '@iconify/react';
import { Button } from 'antd';

const ContinueSkipBtn = ({ btnText, skip, onClick, onSkip, disable, loading }) => {
  return (
    <div className='flex flex-col w-full gap-2'>
      <Button
        onClick={onClick}
        className="primaryBtnBlock" 
        // type="primary"
        htmlType="submit"
        disabled={disable}
        block
        loading={loading}
      >
        <span className="text-white text-base">{btnText}</span>
        <Icon icon="iconamoon:arrow-right-2-light" width="25" height="25" className='text-secondary justify-self-end' />
      </Button>
      {skip && (
        <h2
          className='flex flex-row w-full justify-center items-center text-primary cursor-pointer'
          onClick={onSkip}
        >
          Skip this
        </h2>
      )}
    </div>
  )
}

export default ContinueSkipBtn
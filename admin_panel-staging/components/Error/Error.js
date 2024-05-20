import { Button, Result } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const ErrorComponent = (props) => {

  const router = useRouter();
  const [subtitle, setSubtitle] = useState('');

  useEffect(() => {
    switch (props.status) {
      case 400:
        return setSubtitle('Oops... Something went wrong. Contact Fixa for support.');
      case 401:
        return setSubtitle('Unauthorized access. Please log in.');
      case 403:
        return setSubtitle('Oops... You do not have permission to access this page');
      case 404:
        // return setSubtitle('Oops... Page not found.');
        return setSubtitle(props.message)
      case 500:
        return setSubtitle('Sorry, something went wrong on the server. Try again in a while.');
      default:
        return setSubtitle('Oops... Something went wrong. Contact Fixa for support.');
    }
  }, [props.status]);

  return (
    <>
      <Result
        status={props?.status}
        title={props?.status}
        subTitle={subtitle}
        icon={props?.icon}
        extra={
          <div className='flex items-center justify-center'>
            {props.backHome && (
              <Button type="primary" className='primaryBtn' onClick={() => router.push('/')}>
                Back Home
              </Button>
            )}
            {props?.back && (
              <Button type="primary" className='primaryBtn' onClick={() => router.reload()}>
              Back
            </Button>
            )}
          </div>
        }
      />
    </>
  );
};

export default ErrorComponent;

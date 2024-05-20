import Image from "next/image";
import { Button } from "antd";
import { useRouter } from 'next/router';

import { Error500 } from "../components/Error/ExcelErrors.styled";

export default function Custom500() {

  const router = useRouter();
  return (
    <Error500>
      <div className='container'>
        {/* Message container */}
        <div className="message-container">
          <h1>500</h1>
          <h2>Oops! Server Error</h2>
          <p>Sorry for the inconvenience. Please try again later.</p>
          <Button
            type="primary"
            shape="round"
            size="large"
            style={{
              width: '200px',
              height: '50px',
              fontSize: '20px',
              lineHeight: '30px',
              fontWeight: '300',
              margin: '0px',
            }}
            onClick={() =>
              router.push('/')
            }
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Image container */}
        <div className="image-container">
          <Image src='/images/500.png' width='500' height='500' layout='responsive' objectFit='contain' objectPosition='center' quality='100' placeholder='blur' blurDataURL='/images/500.png' alt="500_page_image" />
        </div>
      </div>
    </Error500>
  )
}
import Image from "next/image";
const CompanyLogo = ({url}) => {
    const imageLoader = ({ width, quality})=>{
        return `${url}?w=${width}&q=${quality || 75}`
    }
    return (
        <Image
            loader={imageLoader}
            src={'url'}
            width={50}
            height={50}
            alt="Company Logo"
            style={{
                borderRadius: "50%",
            }}
        />
    )
};

export default CompanyLogo;

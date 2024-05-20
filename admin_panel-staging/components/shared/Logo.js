import Image from "next/image";

export const changeplatform = () => {
  const platform = process.env.NEXT_PUBLIC_COMPANY_TITLE
  switch (platform) {
    case "RCL LTD":
      return "rcl"
    default:
      return "default";
  }
}
const Logo = ({ color }) => {
  const companyLogo = process.env.NEXT_PUBLIC_LOGO;
  const platform = changeplatform()

  return (
    <div style={{ position: 'relative', width: '130px', height: '70px' }}>
      <Image
        src={companyLogo}
        alt="Logo"
        sizes="500px"
        layout="fill"
        style={{
          objectFit: 'contain',
        }}
        priority={true}
      />
    </div>
  )
};

export default Logo;

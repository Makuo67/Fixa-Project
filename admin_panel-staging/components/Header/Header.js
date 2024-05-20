import { ArrowLeftOutlined } from "@ant-design/icons";
import { PageHeader } from '@ant-design/pro-layout';
import Avatar from "antd/lib/avatar/avatar";
import { useRouter } from "next/router";
import { Skeleton } from 'antd';
import Image from "next/image";

import { StyledHeader } from "./Header.styled";
import Logo from "../shared/Logo";
import { capitalize, capitalizeAll } from "../../helpers/capitalize";
import { useUserAccess } from "../Layouts/DashboardLayout/AuthProvider";
// import { storeAuthTokenInLocalStorage } from "@/helpers/auth";

const Header = ({ title }) => {
  const { userProfile } = useUserAccess();

  const router = useRouter();

  return (
    <StyledHeader>
      <PageHeader
        className="site-page-header"
        onBack={() => router.back()}
        title={title ? title : <Logo color="white" />}
        backIcon={title ? <ArrowLeftOutlined /> : false}
        ghost={false}
        extra={[
          <div
            key={"1"}
            className="profile"
            onClick={() => router.push(`/[${userProfile.username}?user_id=${userProfile.id}`)}
          >
            {userProfile.userProfileLoading ? (
              <div className='flex flex-col'>
                <Skeleton.Button active={true} block />
              </div>
            ) : (
              <div className="profile-1">
                {userProfile.username}
                <span>{userProfile.title ? capitalize(userProfile.title) : "-"}</span>
              </div>
            )}

            <div className="profile-2">
              {userProfile.profile_image ?
                <Image
                  className="object-cover rounded-full"
                  src={userProfile?.profile_image}
                  alt="User Avatar"
                  width={50}
                  height={50}
                  priority
                />
                : <Avatar
                  key={"2"}
                  style={{
                    color: "#f56a00",
                    height: "50px",
                    width: "50px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textTransform: "capitalize"
                  }}
                >
                  {userProfile.username ? `${capitalizeAll(userProfile.username).split(" ")[0]?.charAt(0)} ${capitalizeAll(userProfile.username).split(" ")[1]?.charAt(0)}` : "--"}
                </Avatar>}
            </div>
          </div>,
        ]}
      />
    </StyledHeader>
  );
};

export default Header;

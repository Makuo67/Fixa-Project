import { Icon } from "@iconify/react";
import { Input } from "antd";


 export const SearchField = ({ value, defaultValue, handleSearch}) => {
        return (
            <div style={{ display: "flex" }}>
                <Input size="large"
                    placeholder="Search worker by Name"
                    suffix={
                        <Icon
                            icon="material-symbols:search"
                            color="#A8BEC5"
                            height="20px"
                        />
                    }
                    onPressEnter={(e) => handleSearch(e.target.value)}
                    onChange={(e) => {
                        if (e.target.value === "") {
                            handleSearch("");
                        }
                    }}
                    defaultValue={defaultValue}
                    // value={value}
                    name='search'
                    allowClear
                    style={{
                        width: "350px",
                        height: "40px",
                        fontSize: "1rem",
                        border: "1px solid #A8BEC5",
                        borderRadius: "5px",
                    }}
                />
            </div>
        )
    };
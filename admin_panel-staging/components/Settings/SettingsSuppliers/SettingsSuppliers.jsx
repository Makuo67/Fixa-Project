
import { Button, Empty, Input } from "antd";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { constructPayeeColDataObj } from "@/utils/transformObject";

import DynamicTable from "@/components/Tables/DynamicTable";
import { getAllSuppliers } from "@/helpers/projects/supervisors";
import AddPayee from "@/components/Projects/Modals/AddPayee";

import { SettingsPayeesTableColumns } from "@/components/Columns/SettingsPayeesTableColumns";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import { accessSubEntityRetrieval } from "@/utils/accessLevels";

export const SettingsSuppliers = () => {
    const [addPayee, setAddPayee] = useState(false);
    const [allPayees, setAllPayees] = useState([]);
    const [searchValue, setSearchValue] = useState("");
    const [loading, setLoading] = useState(true);


    const router = useRouter();
    const { userProfile } = useUserAccess();
    const { id } = router.query;

    useEffect(() => {
        getAllSuppliers().then((res) => {
            if (res === undefined) {
                setLoading(true);
                return;
            }
            setAllPayees(constructPayeeColDataObj(res));
            setLoading(false)
        }).finally(() => {
            setLoading(false);
        })
    }, [loading]);

    const handleTableChange = (pagination) => {
        console.log(pagination);
    };

    const openPayeeModal = () => {
        setAddPayee(true);
    };

    const closePayeeModal = () => {
        setAddPayee(false);
    };

    const onSearch = (input) => {
        if (String(input).length > 0) {
            const filteredData = allPayees.filter((item) => {
                return item.names?.toLowerCase().includes(input.toLowerCase()) || item.payment_methods?.some((method) => method?.account_number.includes(input)) || item.email?.includes(input)
            })
            setAllPayees(filteredData)
        } else {
            setLoading(true);
        }
    }

    return (
        <div>

            <AddPayee
                addPayee={addPayee}
                closePayeeModal={closePayeeModal}
                setLoading={setLoading}
            />

            <DynamicTable
                rowKey={`id`}
                columns={SettingsPayeesTableColumns(setLoading, userProfile)}
                data={allPayees}
                isSettings={true}
                extra_left={[
                    <div className="users" key={0}>
                        <span>{allPayees?.length}</span>
                        <span>Suppliers</span>
                    </div>,
                ]}
                extra_middle={[
                    <Input
                        key={0}
                        size="large"
                        placeholder="Search by Name, Phone number or Email"
                        className="search"
                        onChange={(e) => onSearch(e.target.value)}
                        prefix={
                            <Icon
                                icon="material-symbols:search"
                                color="#A8BEC5"
                                height="20px"
                            />
                        }
                        allowClear
                    />,
                ]}
                extra_right={userProfile && accessSubEntityRetrieval(userProfile?.user_access, 'settings', 'supplier', 'add supplier') && [
                    <Button
                        key={0}
                        type="primary"
                        className="primaryBtn"
                        onClick={openPayeeModal}>
                        <Icon icon="material-symbols:add" />
                        <span>Add New Supplier</span>
                    </Button>
                ]}
                loading={loading}
                pagination={{
                    total: allPayees?.length,
                }}
                onChange={(value) => handleTableChange(value)}
            />


        </div>
    );
};

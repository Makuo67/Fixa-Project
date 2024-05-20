import DynamicTable from "../../Tables/Projects/ProjectsDynamicTable";
import { Button, Empty, Input } from "antd";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { getAllProjectDeductions, getAllProjectPayees } from "../../../helpers/projects/supervisors";
import { Icon } from "@iconify/react";
import { LoadingOutlined } from "@ant-design/icons";
import { PusherContext } from "../../../context/PusherContext";
import { ProjectPayeesTableColumns } from "../../Columns/ProjectPayeesTableColumns";
import { StyledProjectSupervisors } from "../ProjectSupervisors/StyledProjectSupervisors.styled";
import AddPayee from "../Modals/AddPayee";
import { constructPayeeColDataObj } from "@/utils/transformObject";
import AddSupervisor from "../Modals/AddSupervisor";
import { checkUserAccessToEntity, checkUserAccessToSubEntity } from "@/utils/accessLevels";
import { useUserAccess } from "@/components/Layouts/DashboardLayout/AuthProvider";
import ErrorComponent from "@/components/Error/Error";

export const ProjectPayees = () => {
    const [addPayee, setAddPayee] = useState(false);
    const [allPayees, setAllPayees] = useState([]);
    const [searchValue, setSearchValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [openExistingPayee, setOpenExistingPayee] = useState(false)

    const [suppliersAccess, setSuppliersAccess] = useState(false)
    const [deleteSupplierAccess, setDeleteSupplierAccess] = useState(false)
    const [linkSupplierAccess, setLinkSupplierAccess] = useState(false)

    const { loadPayee, setLoadPayee } = useContext(PusherContext);
    const { userProfile } = useUserAccess();
    const { user_access, user_level } = userProfile

    const router = useRouter();
    const { id } = router.query;

    useEffect(() => {
        if (id) {
            getAllProjectPayees(id).then((res) => {
                if (res === undefined) {
                    setLoading(true);
                    setLoadPayee(true);
                    return;
                }
                setAllPayees(constructPayeeColDataObj(res?.payee_names));
                setLoadPayee(false);
            }).finally(() => {
                setLoading(false);
            })
        }
    }, [id, loading, loadPayee]);

    useEffect(() => {
        if (user_access) {
            setSuppliersAccess(checkUserAccessToEntity("project", "suppliers", user_access))
            setDeleteSupplierAccess(checkUserAccessToSubEntity("project", "suppliers", "delete", user_access))
            setLinkSupplierAccess(checkUserAccessToSubEntity("project", "suppliers", "link existing", user_access))
        }
    }, [user_access]);

    const handleTableChange = (pagination) => {
        console.log(pagination);
    };

    const openExistingPayeeModal = () => {
        setOpenExistingPayee(true);
    }

    const closeExistingPayeeModal = () => {
        setOpenExistingPayee(false);
    }

    const openPayeeModal = () => {
        setAddPayee(true);
    };

    // const closePayeeModal = () => {
    //     setAddPayee(false);
    // };

    const onSearch = (value) => {
        if (String(value)?.length > 0) {

            const results = allPayees.filter(item => item?.names?.toLowerCase()?.includes(value.toLowerCase()) || item?.email?.toLowerCase()?.includes(value.toLowerCase()) || item?.phone_number?.toString()?.includes(value))

            setAllPayees(results);
        } else {
            setLoading(true);
        }
    };
    // (loading || loadPayee)
    if (loading ) {
        return (
            <div className="w-full flex items-center justify-center">
                <LoadingOutlined />
            </div>
        )
    }
    // else if (!suppliersAccess) {
    //     return <ErrorComponent status={403} backHome={true} />
    // }
    return (
        <StyledProjectSupervisors>
            <div className="supervisor-contianer">
                <DynamicTable
                    rowKey={`id`}
                    columns={ProjectPayeesTableColumns(deleteSupplierAccess)}
                    data={allPayees}
                    supervisors={true}
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
                    extra_right={linkSupplierAccess ? [
                        <Button
                            key={1}
                            type="primary"
                            className="primaryBtn"
                            onClick={openExistingPayeeModal}>
                            <Icon icon="material-symbols:add" />
                            <span>Existing Suppliers</span>
                        </Button>
                    ] : []}
                    loading={loading || loadPayee}
                    pagination={{
                        total: allPayees?.length,
                    }}
                    onChange={(value) => handleTableChange(value)}
                    emptyStateText="No Supliers found, please add Supliers."
                />
            </div>

            {linkSupplierAccess && (<AddSupervisor
                addSupervisor={openExistingPayee}
                isSuppliers={true}
                closeSupervisorModal={closeExistingPayeeModal}
                setLoading={setLoading}
            />)}
        </StyledProjectSupervisors>
    );
};

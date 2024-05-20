import { StyledProjectInvoice } from "./StyledProjectInvoice.styled";
import DynamicTable from "../../Tables/Projects/ProjectsDynamicTable";
import { ProjectsInvoiceTableColumns } from "../../Columns/ProjectsInvoiceTableColumns";
import { Button, notification } from "antd";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { getAllInvoices } from "../../../helpers/projects/invoices";
import InvoiceFilters from "../../Filters/InvoiceFilters";
import { PusherContext } from "../../../context/PusherContext";
import { getSingleProjectDetails } from "../../../helpers/projects/projects";

export const ProjectInvoice = () => {
  const [allInvoices, setAllInvoices] = useState([]);
  const router = useRouter();

  const { id, name } = router.query;

  const { envoiceLoading, setEnvoiceLoading, canCreateInvoice, client } =
    useContext(PusherContext);

  const handleTableChange = (pagination) => {
    console.log("pagination", pagination);
  };
  const createInvoice = () => {
    if (client === "" || client === undefined || client === null) {
      notification.error({
        message: "Can not create an invoice for a project with no manager",
      });
    } else {
      router.push({
        pathname: `/projects/[${name}]/invoice`,
        query: {
          id: id,
          form: "create",
        },
      });
    }
  };

  useEffect(() => {
    if (id) {
      getAllInvoices(id, router.query).then((res) => {
        setAllInvoices(res.data?.invoices);
        setEnvoiceLoading(false);
      });
    }
  }, [id, router.query, envoiceLoading]);

  return (
    <StyledProjectInvoice>
      <div className="invoice-header-right">
        <h2>Invoices</h2>
        <Button
          className="new-invoice-button"
          onClick={createInvoice}
          disabled={!canCreateInvoice}
        >
          <span>New Invoice</span>
        </Button>
      </div>
      <InvoiceFilters
        isExpandable
        showAdvancedFilters
        hasPagination
        filter_fields={["invoice_status", "invoice_added_on"]}
      />
      <div className="invoice-contaner">
        <DynamicTable
          rowKey={`id`}
          columns={ProjectsInvoiceTableColumns}
          data={allInvoices}
          loading={envoiceLoading}
          pagination={{
            total: allInvoices?.length,
          }}
          onChange={(value) => handleTableChange(value)}
        />
      </div>
    </StyledProjectInvoice>
  );
};

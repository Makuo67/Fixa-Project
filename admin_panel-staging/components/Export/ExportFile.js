import { CSVLink } from "react-csv";
import { Button, Spin } from "antd";
import { Icon } from "@iconify/react";
import { StyledExportStyled } from "./StyledExport.styled";
import { Exportcolumns } from "./Exportcolumns";


const ExportFile = (props) => {

  return (
    <StyledExportStyled>
      <Button
        type="primary"
        className="primaryBtn"
        icon={<Icon icon="uil:file-export" height={18} />}
        loading={props?.loading}
        onMouseOver={(e) => { e.target.style.color = 'var(--button-color)' }}
      >
        <CSVLink
          data={props.data}
          headers={Exportcolumns}
          filename={`Workforce List.csv`}
        > Export
        </CSVLink>
      </Button>
    </StyledExportStyled>
  )
}
export default ExportFile

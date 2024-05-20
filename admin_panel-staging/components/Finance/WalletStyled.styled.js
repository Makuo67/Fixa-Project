import styled from "styled-components";

export const WalletStyled = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

  .sub-title {
    font-size: 20px;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
  }

  .card-wrapper {
    display: flex;
    flex-direction: row;
    gap: 10px;
    width: 100%;
    .card-item {
      flex: 1;
    }
  }
`

export const WalletSectionStyled = styled.div`
display: flex;
width: 100%;
background: var(--secondary);

.wallet-wrapper {
    border-radius: 10px;
    border: 1px solid var(--primary);
    width: 100%;
    padding: 10px;
}

.upload-section {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 10px;
    padding: 20px;
    align-items: center;
    // background-color: #ff1;
}

.upload-pads {
    padding:0 35px;
}

.title {
    text-align: center;
}
`

export const ContactUsStyled = styled.div`
  display: flex;
  width: 100%;
  
  .contact-wrapper {
      border-radius: 10px;
      ${props => props.border && 'border: 1px solid var(--primary);'}
      background: var(--secondary);
      width: 100%;
      padding: 10px;
    }

  .card-title {
    display: flex;
    flex-direction: row;
    gap: 8px;

  }
  .title {
    color: var(--primary);
    font-size: 20px;
    font-style: normal;
    margin: 0;
}

.card-details {
    display: flex;
    flex-direction: row;
    align-items: space-between;
    padding-right: 10px;
    ${props => !props.showWalletIcon ? 'margin-left:0px;': 'margin-left: 35px;'}
}

.details-names {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

.details-names span {
    ${props => !props.showCopy && 'display: none;'}
}
`
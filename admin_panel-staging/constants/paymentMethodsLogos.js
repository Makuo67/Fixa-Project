const paymentMethodsLogos = [
    {
        imgURL: '/logos/paymentLogos/MTN_MObile_money.svg',
        label: "mtn mobile money"
    },
    {
        imgURL: '/logos/paymentLogos/airtel.svg',
        label: 'airtel money'
    },
    {
        imgURL: '/logos/paymentLogos/I&M_bank.svg',
        label: 'INVESTMENT AND MORTGAGE BANK'
    },
    {
        imgURL: '/logos/paymentLogos/Bank_of_kigali.svg',
        label: 'BANQUE DE KIGALI'
    },
    {
        imgURL: '/logos/paymentLogos/GT_bank.svg',
        label: 'GUARANTY TRUST BANK (RWANDA)'
    },
    {
        imgURL: '/logos/paymentLogos/Ecobank.svg',
        label: 'ECOBANK RWANDA'
    },
    {
        imgURL: '/logos/paymentLogos/Access_bank.svg',
        label: 'ACCESS BANK RWANDA'
    },
    {
        imgURL: '/logos/paymentLogos/Cogebank.svg',
        label: 'COMPAGNIE GENERALE DE BANQUES'
    },
    {
        imgURL: '/logos/paymentLogos/Urwego_Bank_Rwanda.svg',
        label: 'URWEGO OPPORTUNITY BANK'
    },
    {
        imgURL: '/logos/paymentLogos/KCB_Bank.svg',
        label: 'KENYA COMMERCIAL BANK'
    },
    {
        imgURL: '/logos/paymentLogos/Equity.svg',
        label: 'EQUITY BANK'
    },
    {
        imgURL: '/logos/paymentLogos/bpr.svg',
        label: 'BANQUE POPULAIRE DU RWANDA'
    },
    {
        // imgURL: '/logos/paymentLogos/Urwego_Bank_Rwanda.svg',
        // TODO: adding proper logo
        label: 'BANQUE RWANDAISE DE DEVELOPEMENT'
    },
    {
        imgURL: '/logos/paymentLogos/Zigama_css.svg',
        label: 'ZIGAMA CREDIT AND SAVINGS SCHEME'
    },
    {
        imgURL: '/logos/paymentLogos/Bank_of_rwanda.svg',
        label: 'BANK OF AFRICA RWANDA'
    },
    {
        imgURL: '/logos/paymentLogos/unguka_bank.svg',
        label: 'UNGUKA BANK'
    },
    {
        // imgURL: '/logos/paymentLogos/Urwego_Bank_Rwanda.svg',
        // TODO: adding proper logo
        label: 'BANQUE NATIONALE DU RWANDA'
    },
    {
        imgURL: '/logos/paymentLogos/bankIcon.svg',
        label: 'Bank Account'
    },


]

export const findPaymentMethodLogo = (option) => {
    const foundMethod = paymentMethodsLogos.find(method => method.label.trim().toLowerCase() === option.label.trim().toLowerCase());
    return foundMethod && foundMethod.imgURL !== undefined && foundMethod.imgURL !== null && foundMethod.imgURL !== '' ? foundMethod.imgURL : '/logos/paymentLogos/bankIcon.svg';
}

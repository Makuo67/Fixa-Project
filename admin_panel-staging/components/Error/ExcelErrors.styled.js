import styled from 'styled-components';

const ErrorWrapper = styled.div`
.wrapper{
    display: flex;
    gap: 10px;
    border: medium solid red;
    border-width: 2px;
    height: 50px;
    border-radius: 5px;
    margin-top: 5px;
    padding: 5px 5px 6px 10px;
    justify-content: space-around;
    background: #F6FFFE;
    flex-direction: row;
}
.errorNumber{
    display:flex;
    justify-content: center;
    align-items: center;
}
.errorCount{
    margin-top: 9px;
    color: red;
}
`
export default ErrorWrapper;

export const Error500 = styled.div`
.container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 20px 50px;
    width: 100%;
    height: 100vh;
}

.message-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    height: 80%;
}

.message-container h1 {
    font-weight: 500;
    font-size: 150px;
    line-height: 40px;
    color: #003447;
    margin: 20px;
}

.message-container h2 {
    font-weight: 300;
    font-size: 30px;
    line-height: 40px;
    margin: 0px;
}
.message-container p {
    font-weight: 300;
    font-size: 18px;
    margin: 0px;
}

.image-container {
    width: 100%;
    height: 100%;
}
`
import styled from "styled-components";
const DashboardStyledLayout = styled.div`
  .dashboardContainer {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    gap: 20px;
  }
  .dashboardFlexLayout {
    display: flex;
    justify-content: flex-start;
    flex-direction: row;
    width: 100%;
    gap: 20px;
    align-items: center;
  }

  .dashboardFlexLayout h1 {
    color: #171832;
    font-style: normal;
    font-weight: 500;
    font-size: 32px;
  }

  .dashboardDonutSection {
    display: flex;
    flex-direction: row;
    padding: 0px;
    gap: 35px;
    width: 100%;
    height: 350px;
  }

  .dashboardDonutChart {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 12px 0px;
    width: 50%;
    height: 100%;
    background: #ffffff;
    box-shadow: 0px 4px 24px rgba(40, 62, 70, 0.1);
    border-radius: 15px;
  }

  .dashboardDonutChart h2 {
    padding-left: 30px;
    color: #171832;
    font-weight: 500;
    font-size: 20px;
  }

  .dashboardLineSection {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 17px 19px;
    gap: 17px;
    width: 100%;
    height: 306px;
    background: #ffffff;
    box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
    border-radius: 6px;
  }

  .lineChartHead {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 0px 12px;
    gap: 12px;
    width: 100%;
    height: 23px;
  }

  .lineChartHead h2 {
    font-weight: 500;
    font-size: 18px;
    line-height: 23px;
    color: #171832;
  }

  .lineChartHead h3 {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: 2px 8px;
    gap: 2px;
    width: 110px;
    height: 25px;
    background: #f2fafd;
    border-radius: 5px;
    color: #798c9a;
  }

  .lineChartHead h3 span {
    color: #1c2123;
  }

  .lineChart {
    width: 100%;
    height: 100%;
  }

  .chartLoading {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
  }
`;

export default DashboardStyledLayout;

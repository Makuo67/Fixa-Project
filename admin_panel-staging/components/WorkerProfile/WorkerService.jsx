import React from "react";
import { StyledProfile } from "./WorkerProfile.styled";
import { toMoney } from "../../helpers/excelRegister";

export default function WorkerService(props) {
  return (
    <div>
      <StyledProfile>
        <div className="worker-services">
          <div className="trades">
            <div className="worker-trade-container">
              <div className="worker-trades-card">
                {props.services?.current?.service_name ? (
                  <p className="trade">{`${props.services?.current?.service_name}`}</p>
                ) : (
                  <p className="text-sm text-center !not-sr-onlycursor-pointer">No Service</p>
                )}
              </div>
              <p className="daily_rate space-x-1">
                <span>Daily Rate:</span>
                <span>{`${props.services?.current?.value
                    ? toMoney(props.services?.current?.value)
                    : 0
                  }`}
                  {" "}Rwf</span>
              </p>
            </div>
          </div>
        </div>
      </StyledProfile>
    </div>
  );
}

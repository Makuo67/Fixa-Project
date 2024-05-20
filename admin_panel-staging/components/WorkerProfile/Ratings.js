import { StyledProfile } from "./WorkerProfile.styled";
const Ratings = ({ rank_type, metric_name, is_available }) => {
  var rate_1,
    rate_2,
    rate_3,
    rate_4,
    rate_5,
    rate_5 = false;
  if (metric_name === "Skill") {
    if (rank_type === "Beginner") {
      rate_1 = 1;
    } else if (rank_type === "Intermediate") {
      rate_1 = 2;
    } else if (rank_type === "Advanced") {
      rate_1 = 3;
    } else {
      rate_2 = 0;
    }
  }

  if (metric_name === "Knowledge") {
    if (rank_type === "Beginner") {
      rate_2 = 1;
    } else if (rank_type === "Intermediate") {
      rate_2 = 2;
    } else if (rank_type === "Advanced") {
      rate_2 = 3;
    } else {
      rate_2 = 0;
    }
  }
  if (metric_name === "Attitude") {
    if (rank_type === "Beginner") {
      rate_3 = 1;
    } else if (rank_type === "Intermediate") {
      rate_3 = 2;
    } else if (rank_type === "Advanced") {
      rate_3 = 3;
    } else {
      rate_3 = 0;
    }
  }
  if (rank_type === 4) rate_4 = true;
  if (rank_type === 5) rate_5 = true;
  return (
    <StyledProfile>
      <div className="ratings">
        {is_available ? (
          <div>
            <p id="rating-1" style={{ background: "#ff8a33" }}>
              {rate_1}
            </p>
          </div>
        ) : (
          <div>
            <p id="rating-1"></p>
          </div>
        )}
        {rate_2 ? (
          <div>
            <p id="rating-2" style={{ background: "#ff8a33" }}>
              2
            </p>
          </div>
        ) : (
          <div>
            <p id="rating-2"></p>
          </div>
        )}
        {rate_3 ? (
          <div>
            <p id="rating-3" style={{ background: "#ff8a33" }}>
              3
            </p>
          </div>
        ) : (
          <div>
            <p id="rating-3"></p>
          </div>
        )}
        {rate_4 ? (
          <div>
            <p id="rating-4" style={{ background: "#ff8a33" }}>
              4
            </p>
          </div>
        ) : (
          <div>
            <p id="rating-4"></p>
          </div>
        )}
        {rate_5 ? (
          <div>
            <p id="rating-5" style={{ background: "#ff8a33" }}>
              5
            </p>
          </div>
        ) : (
          <div>
            <p id="rating-5"></p>
          </div>
        )}
      </div>
    </StyledProfile>
  );
};

export default Ratings;

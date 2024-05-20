import React, { useState, useEffect } from "react";
import Icon from "@ant-design/icons";
import { RatingSvg, RatingApprovedSvg } from "../Icons/CustomIcons";

const RatingIcon = (props) => <Icon component={RatingSvg} {...props} />;

const RatingApprovedIcon = (props) => (
  <Icon component={RatingApprovedSvg} {...props} />
);

export default function WorkerAssessment(props) {
  const [meanScore, setMeanScore] = useState(null);

  useEffect(() => { 
    if (
      typeof props.worker?.worker_information?.assessments === "undefined" ||
      props.worker?.worker_information?.assessments.length === 0
    ) {
      setMeanScore(null);
    }
    else {
      setMeanScore(props.worker.worker_information.assessments[0].mean_score);
    }
  }, [props.worker])


  let assessment;
  if (
    typeof props.worker?.worker_information?.assessments === "undefined" ||
    props.worker?.worker_information?.assessments.length === 0
  ) {
    assessment = (
      <div className="rate-stars">
        <RatingIcon />
        <RatingIcon />
        <RatingIcon />
      </div>
    );
  } else {
    const recent_assessment =
      props.worker?.worker_information?.assessments[
      props.worker.worker_information?.assessments.length - 1
      ];

    if (recent_assessment?.rate === "advanced") {
      assessment = (
        <div className="rate-stars">
          <RatingApprovedIcon />
          <RatingApprovedIcon />
          <RatingApprovedIcon />
        </div>
      );
    } else if (recent_assessment?.rate === "intermediate") {
      assessment = (
        <div className="rate-stars">
          <RatingApprovedIcon />
          <RatingApprovedIcon />
          <RatingIcon />
        </div>
      );
    } else if (recent_assessment?.rate === "beginner") {
      assessment = (
        <div className="rate-stars">
          <RatingApprovedIcon />
          <RatingIcon />
          <RatingIcon />
        </div>
      );
    } else {
      assessment = (
        <div className="rate-stars">
          <RatingIcon />
          <RatingIcon />
          <RatingIcon />
        </div>
      );
    }
  }

  return (
    <div>
      <div className="worker-assessment">
        <div className="worker-ranking">
          <p className="ranking-title">Rating</p>
          {assessment}
        </div>
      </div>

      <div>
        <p className="text-lg">Assessment Score : <span className="text-primary">{meanScore ? meanScore : '-'}</span></p>
      </div>
    </div>
  );
}

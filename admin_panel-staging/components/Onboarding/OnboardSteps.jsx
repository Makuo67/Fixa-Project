"use client"
import { Steps } from "antd";
const customDot = (dot, { status }) => (
  <>
    {status === "finish" ? (
      <div className="w-[10px] h-[10px] bg-primary rounded-full">
        {dot}
      </div>
    ) : (
      <div className=" w-[10px] h-[10px] bg-tertiary rounded-full">
        {dot}
      </div>
    )}
  </>
);

const OnboardSteps = ({ steps, currentStep, onChange }) => {

  return (
    <div>
      <Steps
        className="flex flex-row py-4 lg:py-8"
        current={currentStep}
        items={steps}
        progressDot={customDot}
        // onChange={onChange}
      />
    </div>
  )
}

export default OnboardSteps;
export const CompanyProfile = ({ current, steps }) => {
    return (
        <div className="flex flex-col gap-10">
            {steps[current].content}
        </div>
    )
}
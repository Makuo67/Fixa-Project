import { Button, Modal } from "antd";
import { RightOutlined } from '@ant-design/icons';
import { Icon } from "@iconify/react";

export const TermsConditionsModal = (props) => {
    return (
        <>
            <Modal
                title={<h1 className="text-2xl text-gray-2 leading-10 tracking-wide font-bold">Terms and Conditions</h1>}
                open={props.isModalOpen}
                onOk={props.handleOk}
                onCancel={props.handleCancel}
                footer={null}
                bodyStyle={{
                    padding: 0,
                    height: 500,
                    overflowY: "scroll",
                    scrollbarColor: "#007 #bada55",
                    scrollbarGutter: "stable",
                    scrollbarWidth: "thin",
                }}
            >
                <div className="w-full space-y-11 flex flex-col items-center justify-center">
                    <div id="terms">
                        <h1 className="text-xl text-gray-2 font-bold leading-10 tracking-wide">Terms</h1>
                    <p className="text-[14px] text-gray-1 font-thin">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus vel
                            vulputate augue. Aliquam erat volutpat. Suspendisse potenti. Donec
                            in neque sit amet urna aliquam consectetur non sit amet diam.
                            Phasellus malesuada accumsan tellus, in auctor dolor elementum
                            quis. Maecenas orci tellus, aliquam ut elementum a, ultrices non
                            velit. Aliquam consequat sagittis laoreet. Suspendisse potenti. Donec
                            quis risus pulvinar, dapibus libero vel, molestie tellus. Nullam
                            ornare, dui mollis volutpat facilisis, ligula nibh vulputate mauris,
                            quis aliquam neque quam id nibh. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus vel
                            vulputate augue. Aliquam erat volutpat. Suspendisse potenti. Donec
                            in neque sit amet urna aliquam consectetur non sit amet diam.
                            Phasellus malesuada accumsan tellus, in auctor dolor elementum
                            quis. Maecenas orci tellus, aliquam ut elementum a, ultrices non
                            velit. Aliquam consequat sagittis laoreet. Suspendisse potenti. Donec
                            quis risus pulvinar, dapibus libero vel, molestie tellus. Nullam
                            ornare, dui mollis volutpat facilisis, ligula nibh vulputate mauris,
                            quis aliquam neque quam id nibh.
                        </p>
                    </div>
                    <div id="conditions">
                        <h1 className="text-xl text-gray-2 font-bold leading-10 tracking-wide">Conditions</h1>
                        <p className="text-[14px] text-gray-1 font-thin">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus vel
                            vulputate augue. Aliquam erat volutpat. Suspendisse potenti. Donec
                            in neque sit amet urna aliquam consectetur non sit amet diam.
                            Phasellus malesuada accumsan tellus, in auctor dolor elementum
                            quis. Maecenas orci tellus, aliquam ut elementum a, ultrices non
                            velit. Aliquam consequat sagittis laoreet. Suspendisse potenti. Donec
                            quis risus pulvinar, dapibus libero vel, molestie tellus. Nullam
                            ornare, dui mollis volutpat facilisis, ligula nibh vulputate mauris,
                            quis aliquam neque quam id nibh.
                        </p>
                    </div>
                    <Button
                        onClick={props.handleOk}
                        className="primaryBtn" 
                        // type="primary"
                        htmlType="submit" 
                        loading={props.loadingBtn}
                        // block
                        >
                        <span className="text-white">Accept</span>
                        <Icon icon="icon-park-outline:right" width="20" height="20" className='text-secondary justify-self-end' />
                    </Button>
                </div>
            </Modal>
        </>
    )
}
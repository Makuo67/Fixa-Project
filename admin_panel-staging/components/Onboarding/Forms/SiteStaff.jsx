"use client"
import { Button, Form, Input, Select } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import ContinueSkipBtn from '../../Buttons/ContinueSkipBtn';

const SiteStaff = ({ handleNextStep }) => {
    const [form] = Form.useForm();

    const onFinish = (values) => {
        console.log('Received values of form:', values);
    };
    const onChange = (value) => {
        console.log(`selected ${value}`);
    };
    const onSearch = (value) => {
        console.log('search:', value);
    };

    return (
        <div className='flex gap-2 flex-col'>

            <div>
                <p className='formDescription'>Assign staff with roles such as project managers and HR to this site.</p>
            </div>

            <Form
                onFinish={onFinish}
                layout='vertical'
                style={{
                    maxWidth: 600,
                }}
                className='overflow-y-scroll h-[400px] no-scrollbar'
            >
                <Form.List
                    name="staff"
                >
                    {(fields, { add, remove }, { errors }) => (
                        <>
                            {fields.map((field, index) => (
                                <Form.Item
                                    required={false}
                                    key={field.key}
                                >
                                    <div className='flex gap-1'>
                                        <Form.Item label="Role" className='formItem'>
                                            <Select
                                                placeholder="Select a role"
                                                optionFilterProp="children"
                                                onChange={onChange}
                                                // onSearch={onSearch}
                                                className='formInput'
                                                options={[
                                                    {
                                                        value: 'project manager',
                                                        label: 'Project Manager',
                                                    },
                                                    {
                                                        value: 'supervisor',
                                                        label: 'Supervisor',
                                                    }
                                                ]}
                                            />
                                        </Form.Item>
                                        <Form.Item label="Choose staff" className='formItem'>
                                            <Select
                                                showSearch
                                                placeholder="Select a staff"
                                                optionFilterProp="children"
                                                onChange={onChange}
                                                onSearch={onSearch}
                                                className='formInput'
                                                options={[
                                                    {
                                                        value: 'clement',
                                                        label: 'Clement',
                                                    },
                                                    {
                                                        value: 'kenny',
                                                        label: 'Kenny',
                                                    }
                                                ]}
                                            /> </Form.Item>

                                    </div>
                                    {fields.length > 1 ? (
                                        <MinusCircleOutlined
                                            className="dynamic-delete-button"
                                            onClick={() => remove(field.name)}
                                        />
                                    ) : null}
                                </Form.Item>
                            ))}

                            <Form.Item>
                                <Button
                                    className='formInput'
                                    onClick={() => {
                                        add(0);
                                    }}

                                    icon={<PlusOutlined />}
                                >
                                    Add another
                                </Button>
                                <Form.ErrorList errors={errors} />
                            </Form.Item>
                        </>
                    )}
                </Form.List>
                <Form.Item className='formItem'>
                <ContinueSkipBtn 
                skip={true} 
                onClick={handleNextStep} 
                btnText={"Continue"}
                />
                </Form.Item>

            </Form>
        </div>
    )
}

export default SiteStaff;

import { Button, Form, Input, InputNumber, Popconfirm, Select, Space, message, notification } from 'antd';
import { Icon } from '@iconify/react';
import { PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import ContinueSkipBtn from '@/components/Buttons/ContinueSkipBtn';
import { useEffect, useRef, useState } from 'react';
import { transformRatesObject } from '@/utils/transformObject';
import { getCurrentToken } from '@/helpers/getCurrentToken';
import { useRouter } from 'next/router';
import { clearSteps } from '@/utils/clearSteps';
import { useDispatch } from 'react-redux';
import { addService } from '@/redux/actions/services.actions';
import moment from 'moment';
import { capitalizeAll } from '@/helpers/capitalize';

export const NotFoundContent = ({ handleCancel, serviceModal, serviceNameRef, serviceLoading, onSaveService, handleAddService }) => {
    return (
        <Popconfirm
            title={<p
                style={{
                    fontSize: "16px",
                }}
            >
                Are you sure you want to create new service:
                <span style={{
                    fontSize: "18px",
                    fontWeight: "800",
                }}>{serviceNameRef?.current}</span>
            </p>
            }
            onConfirm={() => handleAddService()}
            onCancel={handleCancel}
            okText="Yes"
            cancelText="No"
            open={serviceModal}
            okButtonProps={{
                loading: serviceLoading,
                style: {
                    width: "fit-content",
                    height: "30px",
                    fontSize: "16px",
                    borderRadius: "4px",
                    border: "none",
                    fontWeight: "800",
                    color: "white",
                    backgroundColor: "var(--primary)",
                },
            }}
            cancelButtonProps={{
                style: {
                    width: "fit-content",
                    height: "30px",
                    fontSize: "16px",
                    borderRadius: "4px",
                    border: "1px solid var(--primary)",
                    // fontWeight: "800",
                    color: "var(--black)",
                    backgroundColor: "var(--white)",
                }
            }}
        >
            <Button onClick={onSaveService}
                style={{
                    width: "fit-content",
                    height: "40px",
                    fontSize: "16px",
                    borderRadius: "4px",
                    border: "none",
                    fontWeight: "800",
                    color: "var(--black",
                    // backgroundColor: "var(--primary)",
                }}>
                <PlusOutlined style={{ marginRight: "5px" }} />
                <span>
                    Add new
                </span>
            </Button>
        </Popconfirm>

    )
}
const WorkerRates = ({ handleNextStep, handleShow }) => {
    const [form] = Form.useForm();
    const [trades, setTrades] = useState([]);
    const [allTrades, setallTrades] = useState([]);
    const [selectedValues, setSelectedValues] = useState([]);
    const [filteredTrades, setFilteredTrades] = useState([]);
    const [token, setToken] = useState("");
    const [btnLoading, setBtnLoading] = useState(false);
    const [isCreate, setIsCreate] = useState(false);
    const [serviceLoading, setServiceLoading] = useState(false);
    const [serviceName, setServiceName] = useState(null);
    const [serviceModal, setServiceModal] = useState(false);
    const serviceNameRef = useRef(null);

    const dispatch = useDispatch();
    const router = useRouter()
    const { pathname } = router


    let newRates = [];
    let singleRate;
    let finalRates;

    const onChange = (value, option, key, name) => {
        // console.log(`selected ${value} ,option ${option}`,option,key, name);
        if (selectedValues.length > 0 && selectedValues[name]) {
            const oldTrade = allTrades.filter(option => option.id.toString() === selectedValues[name].toString());
            // console.log('old trade -->',oldTrade);
            selectedValues[name] = option.value
            if (oldTrade.length > 0) {
                setSelectedValues([...selectedValues, ...oldTrade]);
            } else {
                setSelectedValues(selectedValues);
            }
        } else {
            setSelectedValues([...selectedValues, option.value]);

        }
        // handleTrades(value)
    };
    function isValueInAlltrades(value) {
        return allTrades.some(obj => obj.name.toLowerCase() === value.toLowerCase());
    }
    const onSearch = (value) => {
        setIsCreate(false);
        if (value && value.length > 0 && isValueInAlltrades(value) === false) {
            // console.log('not in');
            setIsCreate(true);
        } else {
            setIsCreate(false);
        }
        setServiceName(value);

        // console.log('isCreate',isCreate,isValueInAlltrades(value),value);

    };

    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

    const filterSort = (optionA, optionB) => optionA.label.localeCompare(optionB.label);

    const handleCancel = () => {
        setServiceModal(false);
    };

    const onSaveService = () => {
        serviceNameRef.current = serviceName;
        setServiceModal(true)
    }



    useEffect(() => {
        router.asPath !== "/onboarding" && getCurrentToken().then(data => {
            setToken(data)
        })
        // if(serviceLoading){
        async function getTrades() {
            const res = await fetch('/api/global/trades')
            if (!res.ok) {
                // throw new Error('Failed to fetch data')
                notification.error({
                    message: "Failed",
                    description: data.message,
                    placement: "bottomRight",
                })
            }
            const data = await res.json();
            if (allTrades.length === 0) {
                setTrades(data?.data);
                setallTrades(data?.data);
            } else {
                const updatedTrades = data?.data.filter(option => !selectedValues.includes(option.id));
                let tradesFormated = updatedTrades.map((item) => { return { 'value': item.id, 'label': item.name } })
                // console.log('updatedTrades ',tradesFormated,filteredTrades);
                setTrades(data?.data);
                setallTrades(data?.data);
                setFilteredTrades(tradesFormated)
            }
            setServiceLoading(false);
        }
        getTrades()
        // }
    }, [serviceLoading])

    const handleAddService = () => {
        // TODO: Check if the service already exists
        // console.log(serviceNameRef.current);
        const isServiceExists = allTrades.some(obj => obj.name.toLowerCase() === serviceNameRef.current.toLowerCase());
        if (isServiceExists) {
            message.error(`Service ${serviceNameRef.current} already exists`);
            return
        }
        const payload = {
            "name": serviceNameRef.current,
            "icon_class": null,
            "service_status": "on",
            "locale": "en",
            "published_at": moment(),
            "created_at": moment(),
            "updated_at": moment(),
            "localizations": []
        }
        dispatch(addService(payload)).then(() => {
            setServiceLoading(true)
            message.success(`Created service ${serviceNameRef.current} successfully`);
        })
        setServiceModal(false);
    };

    const onFinish = async (values) => {
        setBtnLoading(true);
        const { rates, ...rest } = values
        newRates = transformRatesObject(rest)

        // console.log(rates,newRates);

        if (typeof values.rates !== "undefined" && newRates) {
            values.rates.map((item) => {
                singleRate = {
                    service_id: item.service_id,
                    maximum_rate: item.maximum_rate
                }
                newRates.push(singleRate)
            });
            finalRates = newRates
        } else {
            finalRates = newRates
        }

        const response = await fetch('/api/workerRates', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(finalRates),
        })

        const data = await response.json()
        if (data?.status === "success") {
            setBtnLoading(false);
            // pathname === "/onboarding" ? "" : setCompanyStatusLoading(true)
            if (pathname === "/projects" || pathname === "/") {
                // router.replace("/projects");
                handleShow();
            } else {
                handleNextStep()
            }
            await clearSteps();

            notification.success({
                message: "Success",
                description: "Rates added successfully",
                placement: "bottomRight",
            })
        } else {
            setBtnLoading(false);
            // console.log("returned data", data.data)
            notification.error({
                message: "Failed",
                description: data.data.error,
                placement: "bottomRight",
            })
        }
    };

    const onRemove = (removedValue) => {
        // Remove the value from selectedValues
        const updatedSelectedValues = selectedValues.filter(value => value !== removedValue);
        setSelectedValues(updatedSelectedValues);

        // Update filteredTrades to include the removed value
        const updatedTrades = allTrades
            .filter((item) => !updatedSelectedValues.includes(item.id))
            .map((item) => ({ value: item.id, label: capitalizeAll(item.name) }));
        setFilteredTrades(updatedTrades);
    };

    useEffect(() => {
        const updatedTrades = allTrades
            .filter((item) => !selectedValues.includes(item.id))
            .map((item) => ({ value: item.id, label: capitalizeAll(item.name) }));
        setFilteredTrades(updatedTrades);
        // console.log('-----> updated',updatedTrades.length,selectedValues);

    }, [allTrades, selectedValues]);


    //    console.log('filtered trades length ',filteredTrades.length);

    return (
        <div className='flex gap-2 flex-col items-center justify-center'>
            <p className='formDescription'>
                Worker rates are set here per trade, making these
                rates standard would set the maximum rate per
                trade when negotiating with workers onsite.
            </p>
            <Form
                onFinish={onFinish}
                layout='vertical'
                autoComplete="off"
                className="w-full space-y-8"
            >
                <Form.List
                    name="rates"
                    initialValue={[{ service_id: '' }]}
                >
                    {(fields, { add, remove }, { errors }) => (
                        <div className='flex flex-col gap-8'>
                            {fields.map(({ key, name, ...restField }) => (
                                <div
                                    key={key}
                                >
                                    {/* =====  ===== */}
                                    <div className='bg-formBg flex flex-col rounded-lg h-[220px] px-2'>
                                        <div
                                            className='flex items-center text-bder-color cursor-pointer justify-end px-2 h-12'
                                            onClick={() => {
                                                remove(name);
                                                onRemove(selectedValues[name]);
                                            }}
                                        >
                                            <Icon icon="charm:cross" width={20} height={20} />
                                            <span>Delete</span>
                                        </div>
                                        <div className={"space-y-11"}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, "service_id"]}
                                                label="Trade"
                                                className='formItem'
                                            >
                                                <Select
                                                    showSearch
                                                    placeholder="Select a trade"
                                                    optionFilterProp="children"
                                                    onChange={(value, option) => onChange(value, option, key, name)}
                                                    onSearch={onSearch}
                                                    filterOption={filterOption}
                                                    filterSort={filterSort}
                                                    className='formInput capitalize !h-[40px]'
                                                    options={filteredTrades}
                                                    //     options={trades.map((item) => ({
                                                    //         value: item.id,
                                                    //         label: capitalizeAll(item.name),
                                                    //     }))
                                                    // }
                                                    // defaultValue={trades[0]?.id}
                                                    notFoundContent={
                                                        //    isCreate ?  
                                                        <NotFoundContent
                                                            handleCancel={handleCancel}
                                                            serviceModal={serviceModal}
                                                            serviceNameRef={serviceNameRef}
                                                            serviceLoading={serviceLoading}
                                                            handleAddService={handleAddService}
                                                            onSaveService={onSaveService} />
                                                        // :false
                                                    }
                                                />
                                            </Form.Item>
                                            <Form.Item
                                                {...restField}
                                                name={[name, "maximum_rate"]}
                                                label="Maximum Rate (RWF)"
                                                className='formItem'
                                            >
                                                <InputNumber
                                                    // type='number'
                                                    placeholder='Enter a rate'
                                                    size='large'
                                                    className='formInput'
                                                    disabled={false}
                                                    keyboard={false}
                                                    controls={false}
                                                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                    parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                                                />
                                            </Form.Item>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <Form.Item>
                                <Form.ErrorList errors={errors} />
                                <Button
                                    className='secondaryCustomBtn space-x-3'
                                    onClick={() => {
                                        add(0);
                                    }}
                                    block
                                >
                                    <Icon icon="charm:plus" width={20} height={20} />
                                    <span className="text-base">
                                        Add another
                                    </span>
                                </Button>
                            </Form.Item>
                        </div>
                    )}
                </Form.List>
                <Form.Item className='formItem'>
                    <ContinueSkipBtn
                        loading={btnLoading}
                        skip={pathname === "/onboarding" ? true : false}
                        // onClick={onFinish}
                        onSkip={handleNextStep}
                        btnText={"Continue"}
                    />
                </Form.Item>

            </Form>
        </div>
    )
}

export default WorkerRates;
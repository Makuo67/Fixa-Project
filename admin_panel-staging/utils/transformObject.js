export const transformRatesObject = (input) => {
    if (typeof input !== 'object') {
        return {};
    }
    const output = [];
    for (let i = 0; i < Object.keys(input).length / 2; i++) {
        output.push({
            service_id: input[`service_id_${i}`],
            maximum_rate: input[`maximum_rate_${i}`],
        });
    }
    return output;
};
export const transformEmergencyInfoObject = (input) => {
    if (typeof input !== 'object') {
        return {};
    }
    const output = [];
    for (let i = 0; i < Object.keys(input).length / 4; i++) {
        if (!input[`emergency_name_${i}`] || !input[`emergency_relation_${i}`] || !input[`emergency_phone_number_${i}`]) continue
        output.push({
            name: input[`emergency_name_${i}`],
            relation: input[`emergency_relation_${i}`],
            phone_number: input[`emergency_phone_number_${i}`],
        });
    }
    return output;
};
export const transformPaymentsInfoObject = (input) => {
    if (typeof input !== 'object') {
        return {};
    }
    const output = [];
    for (let i = 0; i < Object.keys(input).length / 2; i++) {
        if (!input[`payment_method_${i}`] || !input[`account_number_${i}`]) continue
        output.push({
            payment_method: input[`payment_method_${i}`],
            account_number: input[`account_number_${i}`],
            is_active: input[`is_active_${i}`] || true,
        });
    }
    return output;
};

export const changeKey = (array, oldKey, newKey) => {
    return array.map(item => {
        let newItem = { [newKey]: item[oldKey] };
        // delete item[oldKey];
        return { ...item, ...newItem };
    });
}

export function updateKeys(data, expectedData, oldKey, currentKey) {
    // console.log("updateKeys ---->", oldKey, currentKey);
    let response = [];
    const keysData = data.map((item) => { return { [currentKey]: item[oldKey], "id": item.id } });
    // console.log("keysData ---->", keysData);
    if (expectedData.length > 0) {
        for (let index = 0; index < expectedData.length; index++) {
            const item = expectedData[index];
            const keyFound = keysData.find((key) => key.id === item.id);
            // console.log("keysFound ---->", keyFound);
            item[currentKey] = keyFound[currentKey];
            // console.log("item ---->", item);
            response.push(item);
        }
        // expectedData = expectedData.map((item)=>{return {...item,[oldKey]:item[currentKey]}})
    } else {
        response = keysData
    }
    return response
}

/**
 * [
    {
        "payment_method_id": "3_950",
        "account_name": "jordan",
        "account_number": "0394040394"
    }
]
 * {
  "payment_methods": [
    {
      "payment_method_id": 1,
      "payment_method_adjacent_id": null,
      "account_number": "0785485889",
      "account_name": "worker names",
      "is_active": true
    },
    {
      "payment_method_id": 2,
      "payment_method_adjacent_id": 2,
      "account_number": "121-32125-445-15",
      "account_name": "worker names"
    },
    {
      "payment_method_id": 3,
      "payment_method_adjacent_id": null,
      "account_number": "0734858958",
      "account_name": "worker names"
    }
  ]
}
 * Extracts payment methods from the given data excluding 'kremit'.
 * @param {Array} data - The array of payment data.
 * @returns {Array} - The array of extracted payment methods.
 */
export const extractPaymentMethods = (data) => {
    const payments = data.filter(item => item.name.toLowerCase() !== 'kremit');
    const kremit = data.find(item => item.name && item.name.toLowerCase() === 'kremit' && item.is_active === true);
    if (!kremit) return payments;

    if (!kremit.adjacents) return payments;
    if (!kremit.adjacents.length) return payments;

    const kremitID = kremit.adjacents.map(item => item);

    const kremitData = kremitID.map(item => {
        return { id: `${kremit?.id}_${item.bankid}`, name: item.full_name, is_bank: true }
    })

    const allPayments = [...payments, ...kremitData];
    return allPayments;
}

/**
 * Extracts adjacent payment methods from the given data excluding 'kremit'.
 * @param {Array} data - The array of payment data.
 * @returns {Array} - The array of extracted adjacent payment methods.
 */
export const extractAdjacentPaymentMethods = (data) => {
    const kremit = data.find(item => item.name && item.name.toLowerCase() === 'kremit' && item.is_active === true);
    if (!kremit || !kremit.adjacents || !kremit.adjacents.length) return [];

    const kremitID = kremit.adjacents.map(item => item);

    const kremitData = kremitID.map(item => {
        return { id: `${item.bankid}`, name: item.full_name, is_bank: true }
    })

    const allPayments = [...kremitData];
    return allPayments;
}

/*
 * Extracts payment methods from the given data excluding Changing Kremit name to be bank account.
 * @param {Array} data - The array of payment data.
 * @returns {Array} - The array of extracted payment methods.
 */
export const extractPrimaryPaymentMethods = (data) => {
    const payments = data.filter(item => item.name.toLowerCase() !== 'kremit');
    const kremit = data.find(item => item.name && item.name.toLowerCase() === 'kremit' && item.is_active === true);
    if (!kremit) return payments;

    const allPayments = [...payments, { ...kremit, name: 'Bank Account', is_bank: true }];
    return allPayments;
}

/**
 * Retrieves the bank ID based on the input short name.
 * @param {Array} payments - The array of payments.
 * @param {string} input - The short name to search for.
 * @returns {string|null} - The bank ID if found, otherwise null.
 */
export const retrieveAdjacentBankId = (payments, input) => {
    const paymentAdjacent = payments.find(payment => payment.adjacents !== null && payment.adjacents?.length > 0);
    const adjacent = paymentAdjacent.adjacents.find(adjacent => adjacent.short_name === input);
    if (adjacent === undefined) return null;
    const bankId = adjacent.bankid;
    return bankId;
}

/**
 * Retrieves the active payment method details from the input data.
 * @param {Object} input - The input data containing payment methods.
 * @returns {Object} - An object containing payment method details.
 */
export const retrieveActivePaymentMethod = (input) => {
    // console.log("input ===>", input)
    let output = {
        payment_method: '',
        payment_provider: '',
        payment_account_number: '',
        is_bank: false,
    }

    const activePaymentMethod = input?.payment_methods?.find(item => item.is_active === true);
    if (activePaymentMethod) {
        output.payment_method = activePaymentMethod.payment_method.id;
        // add provider if available else put other
        if (activePaymentMethod.provider && activePaymentMethod.provider !== '' && activePaymentMethod?.payment_method?.adjacents && activePaymentMethod.payment_method.adjacents.length > 0) {
            const bankId = activePaymentMethod.payment_method?.adjacents?.find(item => item.short_name === activePaymentMethod.provider)?.bankid;
            output.payment_provider = bankId;
        } else {
            output.payment_provider = activePaymentMethod.payment_method.name;
        }
        output.payment_account_number = activePaymentMethod.account_number;
        if (activePaymentMethod.payment_method.name.toLowerCase() === 'kremit') {
            output.is_bank = true;
        }
    }
    return output;
}

/**
 * 
 * @param {*} data 
 * @returns {Array} 
 */

export const extractPaymentMethodsValues = (inpuData) => {
    let output = [];
    let obj = {}
    inpuData.map((item) => {
        if (typeof item.payment_method_id === "string") {
            let paymentMethodId = item.payment_method_id.split("_")[0];
            let adjacentMethodId = item.payment_method_id.split("_")[1];
            obj = {
                payment_method_id: parseInt(paymentMethodId),
                payment_method_adjacent_id: adjacentMethodId ? adjacentMethodId : null,
                account_number: item.account_number,
                account_name: item.account_name,
                is_active: item.is_active ?? false
            }
        } else {
            obj = {
                payment_method_id: item?.payment_method_id,
                payment_method_adjacent_id: null,
                account_number: item.account_number,
                account_name: item.account_name || "",
                is_active: item.is_active ?? false
            }
        }
        output.push(obj);
    })
    return output;

}

export const extractDefaultWorkerPaymentValues = (inputData) => {
    let output = [];
    let obj = {}
    inputData.map((item) => {
        if (item?.payment_method?.adjacents && item?.payment_method?.adjacents?.length > 0) {
            const providerId = item?.payment_method?.adjacents?.find(item1 => item1.short_name === item.provider)?.bankid

            obj = {
                "account_number": item.account_number,
                "account_name": item.account_name,
                "payment_method_id": `${item?.payment_method?.id}_${providerId}`,
                "is_active": item?.is_active ?? false,
            }
        } else {
            obj = {
                "account_number": item.account_number,
                "account_name": item.account_name,
                "payment_method_id": parseInt(item?.payment_method?.id),
                "is_active": item?.is_active ?? false,
            }
        }
        output.push(obj);
    })
    return output;

}

/**
 * Retrieves payment information based on the active payment methods.
 * @param {Array} payment_methods - The array of payment methods.
 * @returns {Object} - The object containing account number, payment method verification description, 
 * is payment method, and payment method.
 */
export const retrievePaymentInfo = (payment_methods) => {
    let neededOutputObj = {
        account_number: '',
        payment_method_verification_desc: '',
        is_payment_method: '',
        payment_method: '',
    };

    const activePaymentMethod = payment_methods.find(payment => payment.is_active);
    if (activePaymentMethod) {
        neededOutputObj.account_number = activePaymentMethod.account_number;
        neededOutputObj.payment_method_verification_desc = activePaymentMethod.account_verified_desc;
        neededOutputObj.is_payment_method = activePaymentMethod.is_verified;
        neededOutputObj.payment_method = activePaymentMethod.provider;
    }

    return neededOutputObj;
}

/**
 * Constructs an array of payee data objects based on the input array.
 * @param {Array} input - The input array containing payee data.
 * @returns {Array} - An array of payee data objects.
 */
export const constructPayeeColDataObj = (input) => {
    let output = [];
    for (let i = 0; i < input.length; i++) {
        // Create needed output object
        let neededOutputObj = {
            "id": input[i].id,
            "names": input[i].names,
            "phone_number": input[i].phone_number,
            "payee_type_id": input[i].payee_type_id,
            "email": input[i].email,
            "isActive": input[i].isActive,
            "deduction_types": input[i].deduction_types,
            "payment_methods": input[i].payment_methods,
            "projects": input[i].projects
        }

        const { payment_methods } = input[i];
        // Find active payment methods
        const activePaymentMethods = payment_methods.filter(payment => payment.is_active);
        let { account_number, payment_method, payment_method_verification_desc, is_payment_method } = retrievePaymentInfo(activePaymentMethods);
        neededOutputObj.account_number = account_number;
        neededOutputObj.payment_method_verification_desc = payment_method_verification_desc;
        neededOutputObj.is_payment_method = is_payment_method;
        neededOutputObj.payment_method = payment_method;
        output.push(neededOutputObj);
    }
    return output;
}

/**
 * Transforms columns from ExportPayrollColumns format to CustomExportModal format for select options.
 * @param {Array} columns - The array of columns to transform.
 * @returns {Array} - The transformed array of columns.
 */
export const transformColumns = (columns) => {
    return columns.map(column => {
        return {
            label: column.label,
            value: column.key,
        };
    });
}
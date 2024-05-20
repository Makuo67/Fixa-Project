'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
    async clientInvoiceCalculations(invoices) {
        /**
         * @invoices object
         */
        if (typeof invoices !== 'object') {
            console.error(`Function invoiceCalculations() expected object but got ${typeof invoices}`);
            return [];
        }
        let totalAmountDue = 0;
        let totalExpectedAmount = 0;
        let totalOutstandingAmount = 0;
        let totalAmountPaid = 0;
        let statusCounts = {};
        for (const invoice of invoices) {
            totalAmountDue += invoice.amount_due;
            totalExpectedAmount += invoice.expected_amount;
            totalOutstandingAmount += invoice.outstanding_amount;
            totalAmountPaid += invoice.amount_paid;

            if (statusCounts[invoice.status]) {
                statusCounts[invoice.status]++;
            } else {
                statusCounts[invoice.status] = 1;
            }
        }

        return {
            totalAmountDue,
            totalExpectedAmount,
            totalOutstandingAmount,
            totalAmountPaid,
            statusCounts
        };
    },
    async handleInvoiceUpdateEvents(event_type, invoice_id, invoice, ctx, amount_paid, outstanding_amount, status) {
        /**
         * 
         * Handles invoice events.
         * @param {string} event_type - The type of the event.
         * @param {string} invoice_id - The ID of the invoice.
         * @param {Object} invoice_data - The data related to the invoice.
         * @param {Object} ctx - The context object.
         * @param {String} amount_paid - The amount paid on that particular day.
         * @param {String} status - The status of the invoice.
         * @returns {Array} - The updated history array.
         * */

        let updated_history = invoice.history;
        //user object for History
        const userObj = {
            userID: ctx.state.user.id,
            first_name: ctx.state.user.first_name,
            last_name: ctx.state.user.last_name,
            email: ctx.state.user.email,
            is_active: ctx.state.user.is_active,
        }
        // construct event object for history
        let eventObj = {
            event_type: `${event_type}`,
            timestamp: new Date().toISOString(),
            event_data: {
                invoice_id: invoice_id,
                amount_paid: parseFloat(amount_paid),
                expected_amount: invoice.expected_amount,
                outstanding_amount: outstanding_amount,
                status: `${status}`,
            },
            user: userObj,
        }

        if (Array.isArray(updated_history)) {
            // if it is array
            updated_history.push(eventObj);
        } else {
            // change it to array and then push
            updated_history = updated_history ? [updated_history] : []; //check for null.
            updated_history.push(eventObj);
        }

        return updated_history;


    }
};

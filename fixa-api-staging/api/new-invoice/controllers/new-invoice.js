"use strict";
let Validator = require("validatorjs");
const { handleInvoiceUpdateEvents } = require("../services/new-invoice");
var api_key = process.env.MAILGUN_API_KEY;
var domain = process.env.MAILGUN_DOMAIN;
var mailgun = require("mailgun-js")({ apiKey: api_key, domain: domain });

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

function getMonthName(monthNumber) {
  const date = new Date();
  date.setMonth(monthNumber - 1);

  return date.toLocaleString("en-US", { month: "long" });
}

function getProject(project_id, projects) {
  let project_name = "";
  const project = projects.filter((item) => item.id === project_id);
  if (project.length === 1) {
    project_name = project[0].name;
  }
  return project_name;
}

function getProjectInfo(project_id, projects) {
  let project;
  const projectInfo = projects.filter((item) => item.id === project_id);
  if (projectInfo.length === 1) {
    project = projectInfo[0];
  }
  return project;
}

module.exports = {
  async updateInvoice(ctx) {
    let response;
    try {
      let rules = {
        invoice_id: "required|integer",
        amount: "required|string"
      };
      let validation = new Validator(ctx.request.body, rules);
      if (validation.passes()) {
        const { invoice_id, amount } = ctx.request.body;

        let invoice = await strapi.query("new-invoice").findOne({ id: invoice_id });
        if (invoice) {
          let amount_paid = parseFloat(invoice.amount_paid.toString()) + parseFloat(amount);
          if (parseFloat(amount_paid.toString()) <= parseFloat(invoice.expected_amount.toString())) {

            if (amount_paid.toString() === invoice.expected_amount.toString()) {
              // update the history.
              const updatedHistory = await handleInvoiceUpdateEvents("invoice_update", invoice_id, invoice, ctx, amount, 0, "paid");

              let invoice_update = await strapi.query("new-invoice").update({ id: invoice_id }, { status: "paid", amount_paid: invoice.expected_amount, "outstanding_amount": 0, history: updatedHistory });
              ctx.response.status = 200;
              response = {
                status: "success",
                data: invoice_update,
                error: "",
                meta: "",
              };
            } else {
              let outstanding_amount = parseFloat(invoice.expected_amount.toString()) - parseFloat(amount_paid.toString());
              // update the history.
              const updatedHistory = await handleInvoiceUpdateEvents("invoice_update", invoice_id, invoice, ctx, amount, outstanding_amount, "paid_partially")
              let invoice_update = await strapi.query("new-invoice").update({ id: invoice_id }, { amount_paid: amount_paid, outstanding_amount: outstanding_amount, status: "paid_partially", history: updatedHistory });
              ctx.response.status = 200;
              response = {
                status: "success",
                data: invoice_update,
                error: "",
                meta: "",
              };
            }
          } else {
            ctx.response.status = 404;
            response = {
              status: "failed",
              data: "",
              error: "Invalid amount",
              meta: "",
            };
          }
        } else {
          ctx.response.status = 404;
          response = {
            status: "failed",
            data: "",
            error: "Invalid data",
            meta: "",
          };
        }
      } else {
        ctx.response.status = 404;
        response = {
          status: "failed",
          data: validation.data,
          error: validation.failedRules,
          meta: validation.rules,
        };
      }
    } catch (error) {
      ctx.response.status = 500;
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
  async updateDraftInvoice(ctx) {
    let response;
    try {
      const { id } = ctx.params;
      // let rules = {
      //   status: "required|string",
      // };
      // let validation = new Validator(ctx.request.body, rules);
      let request_body = ctx.request.body;
      if (request_body.status) {
        let invoice = await strapi.query("new-invoice").findOne({ id: id });
        if (invoice) {
          if (request_body.status === "unpaid" && invoice.status === 'draft') {
            let project = await strapi
              .query("projects")
              .findOne({ id: invoice.project_id });
            if (project) {
              // get client_project_manager
              var client_project_manager_user = await strapi.query("client-users").findOne({ id: project.client_project_manager });
              let platformUrl = await strapi.services[
                "platform-settings"
              ].findOne({
                identifier: "business-platform-url",
              });
              if (client_project_manager_user) {
                var projectName = project.name.toUpperCase();

                // send email
                const emailData = {
                  from: "info@fixarwanda.com",
                  to: [`${client_project_manager_user.email}`],
                  subject: `${projectName} INVOICE`,
                  template: "invoice_billing",
                  "v:project_name": `${projectName}`,
                  "v:client_name": `${project.client_id.name.toUpperCase()}`,
                  "v:client_username": `${client_project_manager_user.full_name}`,
                  "v:month_name": `${getMonthName(3)}`,
                  "v:amount_due": invoice.amount_due,
                  "v:expected_amount": invoice.expected_amount,
                  "v:platform_link": `${platformUrl.value}`,
                  "v:note": invoice.note,
                  "v:join_link": `${platformUrl.value}/billing`,
                  "v:twitter_page_link": "#",
                  "v:linkedin_page_link": "#",
                  "v:instagram_page_link": "#",
                };
                mailgun.messages().send(emailData);
                await strapi
                  .query("new-invoice").update({ id: id }, request_body);
                ctx.response.status = 200;
                response = {
                  status: "success",
                  data: "Invoice updated",
                  error: "",
                  meta: "",
                };
              } else {
                ctx.response.status = 400;
                response = {
                  status: "failed",
                  data: "",
                  error: "Client Project Manager Not Found",
                  meta: "",
                };
              }

            } else {
              ctx.response.status = 400;
              response = {
                status: "failed",
                data: "Project assign to Invoice not found",
                error: "",
                meta: "",
              };
            }
          } else {
            await strapi
              .query("new-invoice")
              .update({ id: id }, request_body);
            ctx.response.status = 200;
            response = {
              status: "success",
              data: "Invoice updated",
              error: "",
              meta: "",
            };
          }
        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: `Invoice with id ${id} not found`,
            error: "",
            meta: "",
          };
        }
      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: '',
          error: "status is missing",
          meta: '',
        };
      }
    } catch (error) {
      ctx.response.status = 500;
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
  async createInvoice(ctx) {
    let response;
    try {
      let rules = {
        amount_due: "required|string",
        project_id: "required|integer",
        year: "required|integer",
        month: "required|integer",
        expected_amount: "required|string",
        note: "required|string",
        status: "required|string"
        // certificate_url: "required|string",
        // certificate_name: "required|string",
        // ebm_url: "required|string",
        // ebm_name: "required|string",
      };
      let validation = new Validator(ctx.request.body, rules);
      let request_body = ctx.request.body;
      if (validation.passes()) {
        let project = await strapi
          .query("projects")
          .findOne({ id: request_body.project_id });
        if (project) {
          // get client_project_manager
          var client_project_manager_user = await strapi.query("client-users").findOne({ id: project.client_project_manager });
          if (client_project_manager_user) {
            var date = new Date(request_body.year, request_body.month, 0);
            let invoice_obj = {
              amount_due: parseFloat(request_body.amount_due),
              date: date,
              expected_amount: parseFloat(request_body.expected_amount),
              outstanding_amount: parseFloat(request_body.expected_amount),
              amount_paid: 0,
              project_id: request_body.project_id,
              note: request_body.note,
              status: request_body.status,
              certificate_url: request_body.certificate_url ?? '',
              certificate_name: request_body.certificate_name ?? '',
              ebm_url: request_body.ebm_url ?? '',
              ebm_name: request_body.ebm_name ?? '',
            };
            if (request_body.status === "draft") {
              await strapi.query("new-invoice").create(invoice_obj);
              ctx.response.status = 200;
              response = {
                status: "success",
                data: "Invoice successfully saved",
                error: "",
                meta: "",
              };
            } else {
              let newInvoice = await strapi
                .query("new-invoice")
                .create(invoice_obj);
              //TO-DO (Send email to client project manager)

              let platformUrl = await strapi.services[
                "platform-settings"
              ].findOne({
                identifier: "business-platform-url",
              });
              var projectName = project.name.toUpperCase();
              // send email
              const emailData = {
                from: "info@fixarwanda.com",
                to: [`${client_project_manager_user.email}`],
                subject: `${projectName} Invoice`,
                template: "invoice_billing",
                "v:project_name": `${projectName}`,
                "v:client_name": `${project.client_id.name.toUpperCase()}`,
                "v:client_username": `${client_project_manager_user.full_name}`,
                "v:month_name": `${getMonthName(request_body.month)}`,
                "v:amount_due": newInvoice.amount_due,
                "v:expected_amount": newInvoice.expected_amount,
                "v:note": newInvoice.note,
                "v:platform_link": `${platformUrl.value}`,
                "v:join_link": `${platformUrl.value}/billing`,
                "v:twitter_page_link": "#",
                "v:linkedin_page_link": "#",
                "v:instagram_page_link": "#",
              };
              mailgun.messages().send(emailData);
              ctx.response.status = 200;
              response = {
                status: "success",
                data: "Invoice successfully created",
                error: "",
                meta: "",
              };
            }
          } else {
            ctx.response.status = 400;
            response = {
              status: "failed",
              data: "Client Project Manager Not Found",
              error: "",
              meta: "",
            };
          }

        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: "Project assign to Invoice not found",
            error: "",
            meta: "",
          };
        }
      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: validation.data,
          error: validation.failedRules,
          meta: validation.rules,
        };
      }
    } catch (error) {
      console.log("Error invoice ", error);
      ctx.response.status = 500;
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
  async findOneInvoice(ctx) {
    let response;
    try {
      const { id } = ctx.params;
      let projects = await strapi.query("projects").find({ _limit: -1 });
      let invoice = await strapi.query("new-invoice").findOne({ id: id });
      if (invoice) {
        invoice.invoice_id = `Invoice#${invoice.id}`;
        invoice.project_name = getProject(invoice.project_id, projects);
        delete invoice.updated_by;
        invoice.client =
          getProjectInfo(invoice.project_id, projects).client_id ?? {};
        ctx.response.status = 200;
        response = {
          status: "success",
          data: invoice,
          error: "",
          meta: "",
        };
      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: `Invoice with id ${id} not found`,
          error: "",
          meta: "",
        };
      }
    } catch (error) {
      ctx.response.status = 500;
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
  async findInvoice(ctx) {
    let response;
    try {
      let queries = ctx.query;
      let projects = await strapi.query("projects").find({ _limit: -1 });
      let invoices_all = await strapi.query("new-invoice").find(queries);
      let invoices_all_paid = invoices_all.filter(
        (item) => item.status === "paid"
      );
      let invoices_all_unpaid = invoices_all.filter(
        (item) => item.status === "unpaid"
      );

      let total_amount = invoices_all.reduce((sum, item) => {
        return sum + item.expected_amount;
      }, 0);
      let total_amount_paid = invoices_all_paid.reduce((sum, item) => {
        return sum + item.expected_amount;
      }, 0);
      let total_amount_unpaid = invoices_all_unpaid.reduce((sum, item) => {
        return sum + item.expected_amount;
      }, 0);
      let invoices = invoices_all.map((item) => {
        delete item.updated_by;
        return {
          ...item,
          invoice_id: `Invoice#${item.id}`,
          project_name: getProject(item.project_id, projects),
        };
      });
      ctx.response.status = 200;
      response = {
        status: "success",
        data: {
          invoices: invoices,
          aggregates: {
            total_invoice: invoices_all.length,
            total_invoice_paid: invoices_all_paid.length,
            total_invoice_unpaid: invoices_all_unpaid.length,
            total_amount: total_amount,
            total_amount_paid: total_amount_paid,
            total_amount_unpaid: total_amount_unpaid,
          },
        },
        error: "",
        meta: "",
      };
    } catch (error) {
      ctx.response.status = 500;
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
  async findInvoiceClient(ctx) {
    let response;
    try {
      // let user_client = await strapi.query("user", "users-permissions").findOne({id:ctx.state.user.id});
      let user_client = await strapi.query("client-users").findOne({ user_id: ctx.state.user.id });
      if (user_client.client_projects.length === 0) {
        ctx.response.status = 200;
        response = {
          status: "success",
          data: {
            invoices: [],
            aggregates: {
              total_invoice: 0,
              total_invoice_paid: 0,
              total_invoice_unpaid: 0,
              total_amount: 0,
              total_amount_paid: 0,
              total_amount_unpaid: 0,
            },
          },
          error: "",
          meta: "",
        };
      } else {
        let projects_id = user_client.client_projects.map((item) => item.id);

        let queries = ctx.query;

        // INVOICE For a project
        if (queries.hasOwnProperty("project_id")) {
          let projects = await strapi.query("projects").find({ _limit: -1 });
          let invoices_all = await strapi.query("new-invoice").find(queries);
          console.log("invoices_all", invoices_all);
          let invoices_all_paid = invoices_all.filter(
            (item) => item.status === "paid"
          );
          let invoices_all_unpaid = invoices_all.filter(
            (item) => item.status === "unpaid"
          );
          let invoices_all_paid_partially = invoices_all.filter(
            (item) => item.status === "paid_partially"
          );

          const invoiceTotals = await strapi.services['new-invoice'].clientInvoiceCalculations(invoices_all)

          let invoices = invoices_all.map((item) => {
            delete item.updated_by;
            return {
              ...item,
              invoice_id: `Invoice#${item.id}`,
              project_name: getProject(item.project_id, projects),
            };
          });
          ctx.response.status = 200;
          response = {
            status: "success",
            data: {
              invoices: invoices,
              aggregates: {
                total_invoice: invoices_all.length,
                total_invoice_paid: invoices_all_paid.length,
                total_invoice_unpaid: invoices_all_unpaid.length,
                total_invoice_paid_partially: invoices_all_paid_partially.length,
                total_amount: invoiceTotals.totalExpectedAmount,
                total_amount_paid: invoiceTotals.totalAmountPaid,
                total_amount_unpaid: invoiceTotals.totalOutstandingAmount,
              },
            },
            error: "",
            meta: "",
          };
        } else {
          // INVOICES For all projects
          let projects = await strapi.query("projects").find({ id: projects_id });
          queries.project_id = projects_id;
          let invoices_all = await strapi.query("new-invoice").find(queries);
          let invoices_all_paid = invoices_all.filter(
            (item) => item.status === "paid"
          );
          let invoices_all_unpaid = invoices_all.filter(
            (item) => item.status === "unpaid"
          );
          let invoices_all_paid_partially = invoices_all.filter(
            (item) => item.status === "paid_partially"
          );

          const invoiceTotals = await strapi.services['new-invoice'].clientInvoiceCalculations(invoices_all)

          let invoices = invoices_all.map((item) => {
            delete item.updated_by;
            return {
              ...item,
              invoice_id: `Invoice#${item.id}`,
              project_name: getProject(item.project_id, projects),
            };
          });
          ctx.response.status = 200;
          response = {
            status: "success",
            data: {
              invoices: invoices,
              aggregates: {
                total_invoice: invoices_all.length,
                total_invoice_paid: invoices_all_paid.length,
                total_invoice_unpaid: invoices_all_unpaid.length,
                total_invoice_paid_partially: invoices_all_paid_partially.length,
                total_amount: invoiceTotals.totalExpectedAmount,
                total_amount_paid: invoiceTotals.totalAmountPaid,
                total_amount_unpaid: invoiceTotals.totalOutstandingAmount,
              },
            },
            error: "",
            meta: "",
          };
        }
      }


    } catch (error) {
      ctx.response.status = 500;
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
};

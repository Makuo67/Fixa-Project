"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    async afterCreate(data) {
      try {
        if (data.email && data.email !== null) {
          strapi.services.email.send(
            data.email,
            "FIXA <info@fixarwanda.com>",
            "Added as a contact",
            "fixa-new-created-contact",
            [
              {
                name: "username",
                value: data.last_name,
              },
              {
                name: "company_name",
                value: data.company.company_name,
              },
              {
                name: "contact_id",
                value: data.id,
              },
            ]
          );
          const updateContact = await strapi.query("contact").update(
            { id: data.id },
            {
              password_set_link: `${process.env.FRONTEND_URL}/profile/contact/?id=${data.id}`,
            }
          );
          return;
        }
      } catch (error) {
        console.log("error in afterCreate", error.message);
      }
    },
  },
};

'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::contact-history.contact-history', ({ strapi }) => ({
  async create(ctx) {
    const response = await super.create(ctx)

    return response
  },
}))

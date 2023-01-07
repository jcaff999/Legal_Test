'use strict'

/**
 *  email-receiver controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::email-receiver.email-receiver')

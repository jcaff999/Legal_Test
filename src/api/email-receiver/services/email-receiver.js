'use strict'

/**
 * email-receiver service.
 */

const { createCoreService } = require('@strapi/strapi').factories

module.exports = createCoreService('api::email-receiver.email-receiver')

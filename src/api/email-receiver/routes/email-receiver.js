'use strict'

/**
 * email-receiver router.
 */

const { createCoreRouter } = require('@strapi/strapi').factories

module.exports = createCoreRouter('api::email-receiver.email-receiver')

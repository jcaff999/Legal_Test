'use strict'

/**
 * regions-served router.
 */

const { createCoreRouter } = require('@strapi/strapi').factories

module.exports = createCoreRouter('api::regions-served.regions-served')

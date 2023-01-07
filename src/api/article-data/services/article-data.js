'use strict'

/**
 * article-data service.
 */

const { createCoreService } = require('@strapi/strapi').factories

module.exports = createCoreService('api::article-data.article-data')

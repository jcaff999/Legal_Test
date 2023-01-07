'use strict'

/**
 * subject-matter service
 */

const { createCoreService } = require('@strapi/strapi').factories

module.exports = createCoreService('api::subject-matter.subject-matter')

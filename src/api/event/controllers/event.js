'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { ElasticSearchService } = require('../../../shared')
const { uniq } = require('lodash')

const DEFAULT_LIMIT = 20

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::event.event', ({ strapi }) => ({
  async search(ctx) {
    const elsService = new ElasticSearchService()
    const { offset, limit, ...params } = ctx.query

    const eventsSearchParams = {
      ...params,
      limit: limit || DEFAULT_LIMIT,
      offset: offset || 0,
    }

    const searchResult = await elsService.searchEvents(eventsSearchParams)
    const events = await strapi.service('api::event.event').getEventsFromElsResult(searchResult, 'search')

    return {
      success: true,
      data: {
        total: searchResult.body.hits.total.value,
        events,
      },
    }
  },

  async organization(ctx) {
    const events = await strapi.entityService.findMany('api::event.event', { limit: -1, publicationState: 'live' })
    return uniq(events.map((item) => item.organizer).sort())
  },

  async location(ctx) {
    const events = await strapi.entityService.findMany('api::event.event', { limit: -1, publicationState: 'live' })
    const location = events.map((item) => {
      if (item.city) {
        return item.country + ', ' + item.city
      } else {
        return item.country
      }
    })

    return uniq(location.sort())
  },
}))

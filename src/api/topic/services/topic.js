'use strict'

const { sampleSize } = require('lodash')
const { v4: uuid } = require('uuid')
const { getVendorDisplayName } = require('../../../shared/utils/getVendorDisplayName')

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories

module.exports = createCoreService('api::topic.topic', ({ strapi }) => ({
  async createAutoSuggest(elsService, topic) {
    const id = uuid()
    const body = {
      suggestKeyword: topic.name,
      type: 'Solutions',
      data: {
        keyword: topic.name,
        id: topic.id,
        model: 'Topics',
        slug: topic.slug,
      },
    }
    return await elsService.client.create({
      id,
      index: process.env.OPENSEARCH_INDEX_AUTOSUGGEST,
      body,
    })
  },
  async deleteAutoSuggest(elsService, topic) {
    const query = `
      {
        "query": {
          "bool": {
            "must": [
              { "term": { "type": "Solutions" } },
              {
                "nested": {
                  "path": "data",
                  "query": {
                    "match": { "data.id": ${topic.id} }
                  }
                }
              },
              {
                "nested": {
                  "path": "data",
                  "query": {
                    "match": { "data.model": "Topics" }
                  }
                }
              }
            ]
          }
        }
      }
    `

    try {
      await elsService.client.deleteByQuery({
        index: process.env.OPENSEARCH_INDEX_AUTOSUGGEST,
        body: query,
      })
    } catch (err) {
      console.error('topic deleteAutoSuggest', err)
    }
  },

  async updateAutoSuggest(elsService, topic) {
    await this.deleteAutoSuggest(elsService, topic)
    await this.createAutoSuggest(elsService, topic)
  },

  /**
   * Returns the randomized featured listings by topic
   */
  async getPopularListingsByTopic(topic, limit) {
    let listings = []

    if (topic.name === 'Consultants') {
      listings = await strapi.entityService.findMany('api::consulting.consulting', {
        limit: -1,
        populate: '*',
        publicationState: 'live',
      })
    }
    if (topic.name === 'Alternative Legal Services') {
      listings = await strapi.entityService.findMany('api::alternative-legal-service.alternative-legal-service', {
        limit: -1,
        populate: '*',
        publicationState: 'live',
      })
    } else {
      listings = await strapi.entityService.findMany('api::vendor.vendor', {
        limit: -1,
        filters: { topics: topic.id },
        publicationState: 'live',
      })
      listings.forEach((listing) => {
        listing.name = getVendorDisplayName(listing)
      })
    }
    if (listings.length < limit) {
      return listings
    }

    const enhanced = listings.filter((listing) => listing.featuredOnHome)
    const normal = listings.filter((listing) => !listing.featuredOnHome)

    const enhancedRandom = sampleSize(enhanced, limit)
    const normalRandom = sampleSize(normal, limit - enhancedRandom.length)

    return enhancedRandom.concat(normalRandom)
  },
}))

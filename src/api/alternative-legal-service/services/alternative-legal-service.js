'use strict'

const { v4: uuid } = require('uuid')
const { getVendorDisplayName } = require('../../../shared/utils/getVendorDisplayName')

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories

module.exports = createCoreService('api::alternative-legal-service.alternative-legal-service', ({ strapi }) => ({
  async getElsBodyFromModel(alsp) {
    const hqNames = alsp.hqs.map((item) => item.name).join(', ')
    const officeNames = alsp.offices.map((item) => item.name).join(', ')
    const practiceAreaNames = alsp.practiceAreas.map((item) => item.name).join(', ')
    const languageNames = alsp.languages.map((item) => item.name).join(', ')
    const audienceNames = alsp.audiences.map((item) => item.name).join(', ')
    const featureNames = alsp.features.map((item) => item.name).join(', ')
    const deploymentNames = alsp.deployments.map((item) => item.name).join(', ')
    const regionsServedNames = alsp.regionsServed.map((item) => item.name).join(', ')
    const subTopicNames = alsp.serviceOfferings.map((item) => item.name).join(', ')
    const topic = await strapi.db.query('api::topic.topic').findOne({ where: { name: 'Alternative Legal Services' } })
    const featured = alsp.featured ? 'Featured' : null
    const enhancedListingEnabled = alsp.enhancedListingEnabled
    const reviews = alsp.reviews.filter((review) => review.publishedAt != null)

    return {
      id: alsp.id,
      type: 'default',
      model: 'ALSPs',
      name: alsp.name,
      description: alsp.shortDescription,
      website: alsp.url,
      logo: alsp.logo ? alsp.logo.url : null,
      slug: alsp.slug,
      hq: hqNames,
      hqs: alsp.hqs.map((item) => item.id),
      office: officeNames,
      offices: alsp.offices.map((item) => item.id),
      practiceArea: practiceAreaNames,
      practiceAreas: alsp.practiceAreas.map((item) => item.id),
      language: languageNames,
      languages: alsp.languages.map((item) => item.id),
      audience: audienceNames,
      audiences: alsp.audiences.map((item) => item.id),
      deployment: deploymentNames,
      deployments: alsp.deployments.map((item) => item.id),
      feature: featureNames,
      features: alsp.features.map((item) => item.id),
      topic: 'Alternative Legal Services, ' + topic.description,
      topics: [topic.id],
      subTopic: subTopicNames,
      subTopics: alsp.serviceOfferings.map((item) => item.id),
      regionServed: regionsServedNames,
      regionsServed: alsp.regionsServed.map((item) => item.id),
      featured,
      enhancedListingEnabled,
      userIds: alsp.followedUsers.map((item) => item.id),
      rating: alsp.rating ? alsp.rating : -1,
      reviewCnt: reviews.length,
    }
  },

  async createAutoSuggest(elsService, alsp) {
    const id = uuid()
    const body = {
      suggestKeyword: getVendorDisplayName(alsp, false),
      type: 'Vendors',
      data: {
        keyword: getVendorDisplayName(alsp),
        id: alsp.id,
        logo: alsp.logo ? alsp.logo.url : null,
        model: 'ALSPs',
        slug: alsp.slug,
      },
    }
    return await elsService.client.create({
      id,
      index: process.env.OPENSEARCH_INDEX_AUTOSUGGEST,
      body,
    })
  },

  async deleteAutoSuggest(elsService, alsp) {
    const query = `
      {
        "query": {
          "bool": {
            "must": [
              { "term": { "type": "Vendors" } },
              {
                "nested": {
                  "path": "data",
                  "query": {
                    "match": { "data.id": ${alsp.id} }
                  }
                }
              },
              {
                "nested": {
                  "path": "data",
                  "query": {
                    "match": { "data.model": "ALSPs" }
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
      console.error('alsp deleteAutoSuggest', err)
    }
  },

  async updateAutoSuggest(elsService, alsp) {
    await this.deleteAutoSuggest(elsService, alsp)
    await this.createAutoSuggest(elsService, alsp)
  },

  async createElsDocument(elsService, alsp) {
    await elsService.client.create({
      id: uuid(),
      index: process.env.OPENSEARCH_INDEX_VENDOR,
      body: await this.getElsBodyFromModel(alsp),
    })
  },

  async updateElsDocument(elsService, alsp) {
    await this.deleteElsDocument(elsService, alsp)
    await this.createElsDocument(elsService, alsp)
  },

  async deleteElsDocument(elsService, alsp) {
    const query = `
      {
        "query": {
          "bool": {
            "must": [
              {
                "match": { "id": ${alsp.id} }
              },
              {
                "match": { "model": "ALSPs" } 
              }
            ]
          }
        }
      }
    `

    try {
      await elsService.client.deleteByQuery({
        index: process.env.OPENSEARCH_INDEX_VENDOR,
        body: query,
      })
    } catch (err) {
      console.error('alsp deleteElsDocument', err)
    }
  },
}))

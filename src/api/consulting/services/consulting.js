'use strict'

const { v4: uuid } = require('uuid')
const { getConsultancyDisplayName } = require('../../../shared/utils/getVendorDisplayName')

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories

module.exports = createCoreService('api::consulting.consulting', ({ strapi }) => ({
  async getElsBodyFromModel(consultancy) {
    const hqNames = consultancy.hqs.map((item) => item.name).join(', ')
    const officeNames = consultancy.offices.map((item) => item.name).join(', ')
    const practiceAreaNames = consultancy.practiceAreas.map((item) => item.name).join(', ')
    const languageNames = consultancy.languages.map((item) => item.name).join(', ')
    const audienceNames = consultancy.audiences.map((item) => item.name).join(', ')
    const featureNames = consultancy.features.map((item) => item.name).join(', ')
    const deploymentNames = consultancy.deployments.map((item) => item.name).join(', ')
    const regionsServedNames = consultancy.regionsServed.map((item) => item.name).join(', ')
    const subTopicNames = consultancy.serviceOfferings.map((item) => item.name).join(', ')
    const topic = await strapi.db.query('api::topic.topic').findOne({ where: { name: 'Consultants' } })
    const featured = consultancy.featured ? 'Featured' : null
    const enhancedListingEnabled = consultancy.enhancedListingEnabled
    const reviews = consultancy.reviews.filter((review) => review.publishedAt != null)

    return {
      id: consultancy.id,
      type: 'default',
      model: 'Consultants',
      name: consultancy.name,
      tool: consultancy.serviceName,
      description: consultancy.shortDescription,
      website: consultancy.url,
      logo: consultancy.logo ? consultancy.logo.url : null,
      slug: consultancy.slug,
      hq: hqNames,
      hqs: consultancy.hqs.map((item) => item.id),
      office: officeNames,
      offices: consultancy.offices.map((item) => item.id),
      practiceArea: practiceAreaNames,
      practiceAreas: consultancy.practiceAreas.map((item) => item.id),
      language: languageNames,
      languages: consultancy.languages.map((item) => item.id),
      audience: audienceNames,
      audiences: consultancy.audiences.map((item) => item.id),
      deployment: deploymentNames,
      deployments: consultancy.deployments.map((item) => item.id),
      feature: featureNames,
      features: consultancy.features.map((item) => item.id),
      topic: 'Consultants, ' + topic.description,
      topics: [topic.id],
      subTopic: subTopicNames,
      subTopics: consultancy.serviceOfferings.map((item) => item.id),
      regionServed: regionsServedNames,
      regionsServed: consultancy.regionsServed.map((item) => item.id),
      featured,
      enhancedListingEnabled,
      userIds: consultancy.followedUsers.map((item) => item.id),
      rating: consultancy.rating ? consultancy.rating : -1,
      reviewCnt: reviews.length,
    }
  },

  async createAutoSuggest(elsService, consultancy) {
    const id = uuid()
    const body = {
      suggestKeyword: getConsultancyDisplayName(consultancy, false),
      type: 'Vendors',
      data: {
        keyword: getConsultancyDisplayName(consultancy),
        id: consultancy.id,
        logo: consultancy.logo ? consultancy.logo.url : null,
        model: 'Consultants',
        slug: consultancy.slug,
      },
    }
    return await elsService.client.create({
      id,
      index: process.env.OPENSEARCH_INDEX_AUTOSUGGEST,
      body,
    })
  },

  async deleteAutoSuggest(elsService, consultancy) {
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
                    "match": { "data.id": ${consultancy.id} }
                  }
                }
              },
              {
                "nested": {
                  "path": "data",
                  "query": {
                    "match": { "data.model": "Consultants" }
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
      console.error('consultancy deleteAutoSuggest', err)
    }
  },

  async updateAutoSuggest(elsService, consultancy) {
    await this.deleteAutoSuggest(elsService, consultancy)
    await this.createAutoSuggest(elsService, consultancy)
  },

  async createElsDocument(elsService, consultancy) {
    await elsService.client.create({
      id: uuid(),
      index: process.env.OPENSEARCH_INDEX_VENDOR,
      body: await this.getElsBodyFromModel(consultancy),
    })
  },

  async updateElsDocument(elsService, consultancy) {
    await this.deleteElsDocument(elsService, consultancy)
    await this.createElsDocument(elsService, consultancy)
  },

  async deleteElsDocument(elsService, consultancy) {
    const query = `
      {
        "query": {
          "bool": {
            "must": [
              {
                "match": { "id": ${consultancy.id} }
              },
              {
                "match": { "model": "Consultants" } 
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
      console.error('consultancy deleteElsDocument', err)
    }
  },
}))

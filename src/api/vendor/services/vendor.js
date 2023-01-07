'use strict'

const { v4: uuid } = require('uuid')
const { getVendorDisplayName } = require('../../../shared/utils/getVendorDisplayName')

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories

module.exports = createCoreService('api::vendor.vendor', ({ strapi }) => ({
  getElsBodyFromModel(vendor) {
    const hqNames = vendor.hqs.map((item) => item.name).join(', ')
    const officeNames = vendor.offices.map((item) => item.name).join(', ')
    const practiceAreaNames = vendor.practiceAreas.map((item) => item.name).join(', ')
    const languageNames = vendor.languages.map((item) => item.name).join(', ')
    const audienceNames = vendor.audiences.map((item) => item.name).join(', ')
    const featureNames = vendor.features.map((item) => item.name).join(', ')
    const deploymentNames = vendor.deployments.map((item) => item.name).join(', ')
    const integrationNames = vendor.integrations.map((item) => item.name).join(', ')
    const existingCustomersNames = vendor.existingCustomers.map((item) => item.name).join(', ')
    const featured = vendor.featured ? 'Featured' : null
    const enhancedListingEnabled = vendor.enhancedListingEnabled
    const regionsServedNames = vendor.regionsServed.map((item) => item.name).join(', ')
    const topicNames = vendor.topics.map((item) => item.name).join(', ')
    const topicDescriptionNames = vendor.topics.map((item) => item.description).join(', ')
    const subTopicNames = vendor.subTopics.map((item) => item.name).join(', ')
    const company = vendor.company
    const reviews = vendor.reviews.filter((review) => review.publishedAt != null)
    const isPremium = vendor.isPremium

    return {
      id: vendor.id,
      model: 'Vendors',
      name: vendor.name,
      tool: vendor.tool,
      description: vendor.description,
      website: vendor.website,
      logo: vendor.logo ? vendor.logo.url : null,
      slug: vendor.slug,
      type: vendor.type || 'default',
      consolidationEnabled: vendor.consolidationEnabled,
      graveyardEnabled: vendor.graveyardEnabled,
      consolidationData: vendor.consolidationData,
      consolidationVisibility: !(
        vendor.consolidationEnabled &&
        vendor.consolidationData &&
        !vendor.consolidationData.enableInActiveDir
      ),
      graveyardData: vendor.graveyardData,
      hq: hqNames,
      hqs: vendor.hqs.map((item) => item.id),
      office: officeNames,
      offices: vendor.offices.map((item) => item.id),
      practiceArea: practiceAreaNames,
      practiceAreas: vendor.practiceAreas.map((item) => item.id),
      language: languageNames,
      languages: vendor.languages.map((item) => item.id),
      audience: audienceNames,
      audiences: vendor.audiences.map((item) => item.id),
      deployment: deploymentNames,
      deployments: vendor.deployments.map((item) => item.id),
      integration: integrationNames,
      integrations: vendor.integrations.map((item) => item.id),
      existingCustomer: existingCustomersNames,
      existingCustomers: vendor.existingCustomers.map((item) => item.id),
      feature: featureNames,
      features: vendor.features.map((item) => item.id),
      featured,
      enhancedListingEnabled,
      topic: topicNames + ', ' + topicDescriptionNames,
      topics: vendor.topics.map((item) => item.id),
      subTopic: subTopicNames,
      subTopics: vendor.subTopics.map((item) => item.id),
      regionServed: regionsServedNames,
      regionsServed: vendor.regionsServed.map((item) => item.id),
      company: company ? company.id : null,
      userIds: vendor.followedUsers.map((item) => item.id),
      rating: vendor.rating ? vendor.rating : -1,
      reviewCnt: reviews.length,
      isPremium,
    }
  },

  async createAutoSuggest(elsService, vendor) {
    const id = uuid()
    const body = {
      suggestKeyword: getVendorDisplayName(vendor, false),
      type: 'Vendors',
      data: {
        keyword: getVendorDisplayName(vendor),
        id: vendor.id,
        logo: vendor.logo ? vendor.logo.url : null,
        model: 'Vendors',
        slug: vendor.slug,
        consolidationEnabled: vendor.consolidationEnabled,
        consolidationVisibility: !(vendor.consolidationData && !vendor.consolidationData.enableInActiveDir),
        graveyardEnabled: vendor.graveyardEnabled,
      },
    }
    return await elsService.client.create({
      id,
      index: process.env.OPENSEARCH_INDEX_AUTOSUGGEST,
      body,
    })
  },

  async deleteAutoSuggest(elsService, vendor) {
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
                    "match": { "data.id": ${vendor.id} }
                  }
                }
              },
              {
                "nested": {
                  "path": "data",
                  "query": {
                    "match": { "data.model": "Vendors" }
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
      console.error('vendor deleteAutoSuggest', err)
    }
  },

  async updateAutoSuggest(elsService, vendor) {
    await this.deleteAutoSuggest(elsService, vendor)
    await this.createAutoSuggest(elsService, vendor)
  },

  async createElsDocument(elsService, vendor) {
    await elsService.client.create({
      id: uuid(),
      index: process.env.OPENSEARCH_INDEX_VENDOR,
      body: this.getElsBodyFromModel(vendor),
    })
  },

  async updateElsDocument(elsService, vendor) {
    await this.deleteElsDocument(elsService, vendor)
    await this.createElsDocument(elsService, vendor)
  },

  async deleteElsDocument(elsService, vendor) {
    const query = `
      {
        "query": {
          "bool": {
            "must": [
              {
                "match": { "id": ${vendor.id} }
              },
              {
                "match": { "model": "Vendors" } 
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
      console.error('vendor deleteElsDocument', err)
    }
  },
}))

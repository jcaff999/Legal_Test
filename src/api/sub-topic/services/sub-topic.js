'use strict'

const { v4: uuid } = require('uuid')

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories

module.exports = createCoreService('api::sub-topic.sub-topic', ({ strapi }) => ({
  async createAutoSuggest(elsService, subTopic) {
    const id = uuid()
    const body = {
      suggestKeyword: subTopic.name,
      type: 'Solutions',
      data: {
        keyword: subTopic.name,
        id: subTopic.id,
        model: 'SubTopics',
        slug: subTopic.slug,
      },
    }
    return await elsService.client.create({
      id,
      index: process.env.OPENSEARCH_INDEX_AUTOSUGGEST,
      body,
    })
  },
  async deleteAutoSuggest(elsService, subTopic) {
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
                    "match": { "data.id": ${subTopic.id} }
                  }
                }
              },
              {
                "nested": {
                  "path": "data",
                  "query": {
                    "match": { "data.model": "SubTopics" }
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
      console.error('subTopic deleteAutoSuggest', err)
    }
  },

  async updateAutoSuggest(elsService, subTopic) {
    await this.deleteAutoSuggest(elsService, subTopic)
    await this.createAutoSuggest(elsService, subTopic)
  },
}))

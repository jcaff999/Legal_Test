'use strict'

const { v4: uuid } = require('uuid')

/**
 * company service.
 */

const { createCoreService } = require('@strapi/strapi').factories

module.exports = createCoreService('api::company.company')
module.exports = createCoreService('api::event.event', ({ strapi }) => ({
  async createAutoSuggest(elsService, company) {
    const { id, logo, slug } = company
    return await elsService.client.create({
      id: uuid(),
      index: process.env.OPENSEARCH_INDEX_AUTOSUGGEST,
      body: {
        suggestKeyword: company.name,
        type: 'Companies',
        data: {
          keyword: company.name,
          id,
          logo: logo ? logo.url : null,
          model: 'Companies',
          slug,
        },
      },
    })
  },
  async deleteAutoSuggest(elsService, company) {
    const query = `
            {
              "query": {
                "bool": {
                  "must": [
                    { "term": { "type": "Companies" } },
                    {
                      "nested": {
                        "path": "data",
                        "query": {
                          "match": { "data.id": ${company.id} }
                        }
                      }
                    },
                    {
                      "nested": {
                        "path": "data",
                        "query": {
                          "match": { "data.model": "Companies" }
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
      console.error('company deleteAutoSuggest', err)
    }
  },

  async updateAutoSuggest(elsService, company) {
    await this.deleteAutoSuggest(elsService, company)
    await this.createAutoSuggest(elsService, company)
  },
}))

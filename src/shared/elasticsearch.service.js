const OpenSearch = require('@opensearch-project/opensearch')

module.exports = class ElasticSearchService {
  constructor() {
    this.client = new OpenSearch.Client({
      node: process.env.OPENSEARCH_URL,
      maxRetries: 5,
      requestTimeout: 60000,
    })
  }

  async bulkInsert(params) {
    return await this.client.bulk(params)
  }

  async insert(params) {
    return await this.client.create(params)
  }

  async search(params) {
    return await this.client.search(params)
  }

  getElsQueryBodyFromVendorsSearchParams(query) {
    const mustOptions = []
    let mustNotOptions = []

    const {
      keyword,
      audiences,
      existingCustomers,
      features,
      hqs,
      deployments,
      integrations,
      offices,
      languages,
      practiceAreas,
      sort,
      topic,
      subTopic,
      regionsServed,
      company,
      followOnly,
      userId,
      type,
    } = query

    if (keyword) {
      mustOptions.push({
        multi_match: {
          query: query.keyword,
          fields: [
            'name^50',
            'tool^60',
            'description^1.2',
            'office',
            'practiceArea',
            'language',
            'audience',
            'deployment',
            'regionServed',
            'topic^40',
            'subTopic^40',
          ],
          operator: 'and',
          type: 'most_fields',
        },
      })
    }

    const parseIds = (vals) => {
      const ids = vals
        .split(',')
        .map((val) => parseInt(val, 10))
        .filter((val) => !isNaN(val))
      if (ids.length === 0) {
        return null
      }
      return ids
    }

    if (audiences) {
      mustOptions.push({
        bool: {
          should: parseIds(audiences).map((id) => ({ match: { audiences: id } })),
        },
      })
    }

    if (existingCustomers) {
      mustOptions.push({
        bool: {
          should: parseIds(existingCustomers).map((id) => ({ match: { existingCustomers: id } })),
        },
      })
    }

    if (features) {
      mustOptions.push({
        bool: {
          should: parseIds(features).map((id) => ({ match: { features: id } })),
        },
      })
    }

    if (hqs) {
      mustOptions.push({
        bool: {
          should: parseIds(hqs).map((id) => ({ match: { hqs: id } })),
        },
      })
    }

    if (deployments) {
      mustOptions.push({
        bool: {
          should: parseIds(deployments).map((id) => ({ match: { deployments: id } })),
        },
      })
    }

    if (integrations) {
      mustOptions.push({
        bool: {
          should: parseIds(integrations).map((id) => ({ match: { integrations: id } })),
        },
      })
    }

    if (offices) {
      mustOptions.push({
        bool: {
          should: parseIds(offices).map((id) => ({ match: { offices: id } })),
        },
      })
    }

    if (languages) {
      mustOptions.push({
        bool: {
          should: parseIds(languages).map((id) => ({ match: { languages: id } })),
        },
      })
    }

    if (practiceAreas) {
      mustOptions.push({
        bool: {
          should: parseIds(practiceAreas).map((id) => ({ match: { practiceAreas: id } })),
        },
      })
    }
    if (regionsServed) {
      mustOptions.push({
        bool: {
          should: parseIds(regionsServed).map((id) => ({ match: { regionsServed: id } })),
        },
      })
    }
    if (topic) {
      mustOptions.push({
        bool: {
          should: parseIds(topic).map((id) => ({ match: { topics: id } })),
        },
      })
    }
    if (subTopic) {
      mustOptions.push({
        bool: {
          should: parseIds(subTopic).map((id) => ({ match: { subTopics: id } })),
        },
      })
    }
    if (followOnly && userId) {
      mustOptions.push({
        bool: {
          should: [{ match: { userIds: userId } }],
        },
      })
    }
    if (company) {
      mustOptions.push({
        bool: {
          should: [{ match: { company } }],
        },
      })
    }

    if (type === 'Graveyard') {
      mustOptions.push({
        bool: {
          should: [{ match: { graveyardEnabled: true } }],
        },
      })
    } else if (type === 'Consolidation') {
      mustOptions.push({
        bool: {
          should: [{ match: { consolidationEnabled: true } }],
        },
      })
    } else {
      mustNotOptions = mustNotOptions.concat([
        {
          match: {
            consolidationVisibility: {
              query: false,
            },
          },
        },
        {
          match: {
            graveyardEnabled: {
              query: true,
            },
          },
        },
      ])
    }
    const mainQuery = {}

    if (mustOptions.length > 0) {
      mainQuery.must = mustOptions
    }
    const sortQuery = []
    if (sort === 'Default') {
      if (type === 'Graveyard') {
        sortQuery.push({
          'graveyardData.date': {
            order: 'desc',
          },
        })
      } else {
        sortQuery.push({
          _score: {
            order: 'desc',
          },
        })
      }
    } else if (sort === 'Rating') {
      sortQuery.push({
        rating: {
          order: 'desc',
        },
      })
    }
    sortQuery.push({
      'tool.raw': {
        order: 'asc',
      },
    })
    sortQuery.push({
      'name.raw': {
        order: 'asc',
      },
    })

    if (Object.keys(mainQuery).length > 0) {
      return {
        sort: sortQuery,
        query: {
          bool: {
            must_not: mustNotOptions,
            should: [
              {
                match: {
                  enhancedListingEnabled: {
                    query: true,
                    boost: 10,
                  },
                },
              },
              {
                match: {
                  featured: {
                    query: 'Featured',
                    boost: 5,
                  },
                },
              },
            ],
            must: [{ bool: mainQuery }],
          },
        },
      }
    }

    return {
      sort: sortQuery,
      query: {
        bool: {
          must_not: [
            {
              match: {
                consolidationVisibility: {
                  query: false,
                },
              },
            },
            {
              match: {
                graveyardEnabled: {
                  query: true,
                },
              },
            },
          ],
          should: [
            {
              match: {
                enhancedListingEnabled: {
                  query: true,
                  boost: 10,
                },
              },
            },
            {
              match: {
                featured: {
                  query: 'Featured',
                  boost: 5,
                },
              },
            },
            {
              bool: {
                must_not: [
                  {
                    match: {
                      enhancedListingEnabled: {
                        query: true,
                      },
                    },
                  },
                ],
                boost: 0.0001,
              },
            },
          ],
        },
      },
    }
  }

  async searchVendors(params) {
    const queryBody = this.getElsQueryBodyFromVendorsSearchParams(params)
    const searchResult = await this.client.search({
      index: process.env.OPENSEARCH_INDEX_VENDOR,
      body: queryBody,
      from: params.offset,
      size: params.limit,
    })
    return searchResult
  }

  getElsQueryBodyFromContentsSearchParams(query) {
    const mustOptions = []

    const { keyword, contentType, isPremium, audiences, documentType, subjectMatter } = query

    if (keyword) {
      mustOptions.push({
        multi_match: {
          query: query.keyword,
          fields: [
            'title^50',
            'snippet^60',
            'author^1.2',
            'expertName',
            'expertTitle',
            'expertAvatar',
            'taxonomy',
            'contentType',
            'content',
            'isPremium',
            'phase',
            'audience',
            'documentType',
          ],
          operator: 'and',
          type: 'most_fields',
        },
      })
    }

    const parseIds = (vals) => {
      const ids = vals
        .split(',')
        .map((val) => parseInt(val, 10))
        .filter((val) => !isNaN(val))
      if (ids.length === 0) {
        return null
      }
      return ids
    }

    if (audiences) {
      mustOptions.push({
        bool: {
          should: parseIds(audiences).map((id) => ({ match: { audiences: id } })),
        },
      })
    }

    if (contentType) {
      mustOptions.push({
        bool: {
          should: [{ match: { contentType } }],
        },
      })
    }

    if (documentType) {
      mustOptions.push({
        bool: {
          should: [{ match: { contentType: documentType } }],
        },
      })
    }
    if (subjectMatter) {
      mustOptions.push({
        bool: {
          should: parseIds(subjectMatter).map((id) => ({ match: { subjectMatter: id } })),
        },
      })
    }

    if (isPremium) {
      mustOptions.push({
        bool: {
          should: [{ match: { isPremium: true } }],
        },
      })
    }
    const mainQuery = {}

    if (mustOptions.length > 0) {
      mainQuery.must = mustOptions
    }
    if (Object.keys(mainQuery).length > 0) {
      return {
        // sort: [
        //   {
        //     _score: {
        //       order: 'desc'
        //     }
        //   },
        //   {
        //     date: {
        //       order: 'asc'
        //     }
        //   },
        //   {
        //     'organizer.raw': {
        //       order: 'asc'
        //     }
        //   }
        // ],
        query: {
          bool: {
            should: [
              {
                match: {
                  isPremium: {
                    query: true,
                    boost: 10,
                  },
                },
              },
            ],
            must: [{ bool: mainQuery }],
          },
        },
      }
    }
    return {
      query: {
        bool: {
          should: [
            {
              match: {
                isPremium: {
                  query: true,
                  boost: 10,
                },
              },
            },
            {
              exists: {
                field: 'title',
              },
            },
          ],
        },
      },
    }
  }

  async searchContents(params) {
    const queryBody = this.getElsQueryBodyFromContentsSearchParams(params)
    const searchResult = await this.client.search({
      index: process.env.OPENSEARCH_INDEX_CONTENT,
      body: queryBody,
      from: params.offset,
      size: params.limit,
    })
    return searchResult
  }

  async searchSimilarVendor(params) {
    const { ids, limit, subTopics, from } = params
    const shouldOptions = []
    const mustNotOptions = []
    // if (subTopics.length > 0) {
    //   shouldOptions.push({
    //     match: { subTopic: { query: subTopics.map(({ name }) => name).join(', '), boost: 25 } }
    //   })
    // }
    subTopics.map(({ name }) =>
      shouldOptions.push({
        match_phrase: { subTopic: { query: name, boost: 10 } },
      }),
    )

    if (from) {
      shouldOptions.push({
        match_phrase: { subTopic: { query: from, boost: 5 } },
      })
    }
    if (ids.length > 0) {
      ids.map((id) => mustNotOptions.push({ match: { id: { query: id } } }))
    }
    mustNotOptions.push({
      match: {
        consolidationVisibility: {
          query: false,
        },
      },
    })
    mustNotOptions.push({
      match: {
        graveyardEnabled: {
          query: true,
        },
      },
    })

    const boolQuery = {
      filter: {
        term: {
          type: 'default',
        },
      },
      should: shouldOptions,
      minimum_should_match: 1,
      must_not: mustNotOptions,
    }

    const queryBody = {
      sort: [
        {
          _score: {
            order: 'desc',
          },
        },
        {
          'tool.raw': {
            order: 'asc',
          },
        },
        {
          'name.raw': {
            order: 'asc',
          },
        },
      ],
      query: { bool: boolQuery },
    }
    const searchResult = await this.client.search({
      index: process.env.OPENSEARCH_INDEX_VENDOR,
      body: queryBody,
      from: 0,
      size: limit,
    })
    return searchResult
  }

  /**
   * Query "autosuggest" index by type
   * type could be:
   * - Vendors
   * - Events
   * - Solutions
   * - Companies
   * - Contents
   */
  async searchAutosuggestByType(params, type) {
    const { keyword, limit, offset } = params

    const queryBody = {
      query: {
        bool: {
          must: [
            { term: { type } },
            {
              multi_match: {
                query: keyword,
                type: 'bool_prefix',
                fields: ['suggestKeyword', 'suggestKeyword._2gram', 'suggestKeyword._3gram', 'suggestKeyword._4gram'],
              },
            },
          ],
          must_not: [
            {
              nested: {
                path: 'data',
                query: {
                  match: { 'data.consolidationVisibility': false },
                },
              },
            },
            {
              nested: {
                path: 'data',
                query: {
                  match: { 'data.graveyardEnabled': true },
                },
              },
            },
          ],
        },
      },
    }

    const searchResult = await this.client.search({
      index: process.env.OPENSEARCH_INDEX_AUTOSUGGEST,
      body: queryBody,
      from: offset,
      size: limit,
    })

    return searchResult
  }

  getElsQueryBodyFromEventsSearchParams(query) {
    const mustOptions = []
    const shouldOptions = []

    const { keyword, audiences, date, months, durations, formats, countries, organizers, features } = query

    if (keyword) {
      mustOptions.push({
        multi_match: {
          query: query.keyword,
          fields: [
            'organizer^5',
            'title^6',
            'description',
            'country',
            'city',
            'audience',
            'duration',
            'feature',
            'format',
          ],
          operator: 'and',
          type: 'most_fields',
        },
      })
    }

    if (organizers) {
      mustOptions.push({
        bool: {
          should: organizers.map((organizer) => ({ match: { 'organizer.raw': organizer } })),
        },
      })
    }

    if (countries) {
      mustOptions.push({
        bool: {
          should: countries.map((location) => ({ match: { location: { query: location, operator: 'and' } } })),
        },
      })
    }

    if (months) {
      mustOptions.push({
        bool: {
          should: months.map((month) => ({ match: { month } })),
        },
      })
    }

    if (date) {
      mustOptions.push({ match: { date } })
    }

    const parseIds = (vals) => {
      const ids = vals
        .split(',')
        .map((val) => parseInt(val, 10))
        .filter((val) => !isNaN(val))
      if (ids.length === 0) {
        return null
      }
      return ids
    }

    if (audiences) {
      mustOptions.push({
        bool: {
          should: parseIds(audiences).map((id) => ({ match: { audiences: id } })),
        },
      })
    }

    if (durations) {
      mustOptions.push({
        bool: {
          should: parseIds(durations).map((id) => ({ match: { durations: id } })),
        },
      })
    }

    if (formats) {
      mustOptions.push({
        bool: {
          should: parseIds(formats).map((id) => ({ match: { formats: id } })),
        },
      })
    }

    if (features) {
      mustOptions.push({
        bool: {
          should: parseIds(features).map((id) => ({ match: { features: id } })),
        },
      })
    }

    const mainQuery = {}
    if (mustOptions.length > 0) {
      mainQuery.must = mustOptions
    }
    if (shouldOptions.length > 0) {
      mainQuery.should = shouldOptions
      mainQuery.minimum_should_match = 1
    }

    if (Object.keys(mainQuery).length > 0) {
      return {
        sort: [
          {
            _score: {
              order: 'desc',
            },
          },
          {
            date: {
              order: 'asc',
            },
          },
          {
            'organizer.raw': {
              order: 'asc',
            },
          },
        ],
        query: {
          bool: {
            should: [
              {
                match: {
                  featured: {
                    query: 'Featured',
                    boost: 10000,
                  },
                },
              },
            ],
            must: [{ bool: mainQuery }],
          },
        },
      }
    }

    return {
      sort: [
        {
          _score: {
            order: 'desc',
          },
        },
        {
          date: {
            order: 'asc',
          },
        },
        {
          'organizer.raw': {
            order: 'asc',
          },
        },
      ],
      query: {
        bool: {
          should: [
            {
              exists: {
                field: 'featured',
              },
            },
            {
              bool: {
                must_not: [
                  {
                    exists: {
                      field: 'featured',
                    },
                  },
                ],
                boost: 0.0001,
              },
            },
          ],
        },
      },
    }
  }

  async searchEvents(params) {
    const queryBody = this.getElsQueryBodyFromEventsSearchParams(params)
    const searchResult = await this.client.search({
      index: process.env.OPENSEARCH_INDEX_EVENT,
      body: queryBody,
      from: params.offset,
      size: params.limit,
    })
    return searchResult
  }
}

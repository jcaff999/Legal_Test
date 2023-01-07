module.exports = {
  definition: `
    type PopularTopicListingLogo {
      url: String
    }

    type PopularTopicListing {
      id: Int!
      name: String!
      logo: PopularTopicListingLogo
      slug: String!
    }

    type PopularTopic {
      id: Int!
      name: String!
      slug: String!
      vendors: [PopularTopicListing!]!
    }
  `,
  query: `
    popularTopics(vendorLimit: Int!): [PopularTopic!]!
  `,
  type: {
    PopularTopic: {
      _description: 'The popular topic',
      vendors: {
        description: 'Returns vendors for each popular topic',
        resolverOf: 'application::vendor.vendor.find',
      },
    },
  },
  resolver: {
    Query: {
      popularTopics: {
        description: 'Return a list of popular topics',
        resolverOf: 'application::topic.topic.find',
        resolver: async (obj, options, { context }) => {
          const topics = await strapi.query('topic').find(
            {
              featuredOnHome: true,
              _limit: -1,
            },
            ['id', 'name', 'slug'],
          )
          const result = await Promise.all(
            topics.map(async (topic) => {
              const vendors = await strapi
                .service('api::topic.topic')
                .getPopularListingsByTopic(topic, options.vendorLimit)
              return { ...topic, vendors }
            }),
          )
          return result
        },
      },
    },
  },
}

module.exports = {
  definition: `
    enum SuggestModel {
      Vendors
      ALSPs
      Consultants
      Events
      Topics
      SubTopics
      Companies
      Contents
    }

    type Suggest {
      keyword: String!
      model: SuggestModel!
      id: Int!
      logo: String
      slug: String!
    }

    type AutosuggestData {
      success: Boolean!
      vendors: [Suggest!]!
      events: [Suggest!]!
      solutions: [Suggest!]!
      companies: [Suggest!]!
      contents: [Suggest!]!
    }
  `,
  query: `
    autosuggest(keyword: String): AutosuggestData!
  `,
  type: {},
  resolver: {
    Query: {
      autosuggest: {
        description: 'Return a list of products by category',
        resolver: 'application::autosuggest.autosuggest.autosuggest',
      },
    },
  },
}

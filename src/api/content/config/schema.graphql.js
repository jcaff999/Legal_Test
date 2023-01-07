module.exports = {
  definition: `
      type ContentSearchResult {
        total: Int
        contents: [Content]
      }

      type ContentSearchReturnType {
        success: Boolean
        data: ContentSearchResult
      }
    `,

  // query: `
  //   contentResults(query: JSON): ContentSearchReturnType!
  //   organizations: [String!]!
  //   locations: [String!]!
  // `,
  query: `
      contentResults(query: JSON): ContentSearchReturnType!
    `,
  resolver: {
    Query: {
      contentResults: {
        description: 'Return filtered contents',
        resolver: 'application::content.content.search',
      },
      // organizations: {
      //   description: 'Return organizations for content filtering',
      //   resolver: 'application::content.content.organization'
      // },
      // locations: {
      //   description: 'Return locations for content filtering',
      //   resolver: 'application::content.content.location'
      // }
    },
  },
}

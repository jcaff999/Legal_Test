module.exports = {
  definition: `
        type EventSearchResult {
          total: Int
          events: [Event]
        }

        type EventSearchReturnType {
          success: Boolean
          data: EventSearchResult
        }
    `,

  query: `
      eventResults(query: JSON): EventSearchReturnType!
      organization: [String]
      location: [String]
    `,
  resolver: {
    Query: {
      eventResults: {
        description: 'Return filtered events',
        resolver: 'application::event.event.search',
      },
      organization: {
        description: 'Return organizations for event filtering',
        resolver: 'application::event.event.organization',
      },
      location: {
        description: 'Return locations for event filtering',
        resolver: 'application::event.event.location',
      },
    },
  },
}

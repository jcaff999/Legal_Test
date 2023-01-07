module.exports = {
  definition: `
    type SimilarVendorItem {
      model: String
      slug: String
      tool: String
      name: String
      logo: String
    }

    type SimilarVendorData {
      success: Boolean
      data: [SimilarVendorItem]
    }

    type VendorItem {
      name: String
      tool: String
      model: String
      description: String
      logo: String
      slug: String
      enhancedListingEnabled: Boolean
      subTopics: [String]
      isPremium: Boolean
    }
    
    type VendorSearchResult {
      total: Int
      vendors: [VendorItem]
    }

    type VendorSearchReturnType {
      success: Boolean
      data: VendorSearchResult
    }
  `,

  query: `
    vendorsCount(where: JSON): Int!
    vendorResults(query: JSON): VendorSearchReturnType!
    getSimilarVendors(id: Int, model: String, from: String): SimilarVendorData!
  `,

  resolver: {
    Query: {
      vendorsCount: {
        description: 'Return the count of vendors',
        resolverOf: 'application::vendor.vendor.count',
        resolver: async (obj, options, ctx) => {
          return await strapi.api.vendor.services.vendor.count(options.where || {})
        },
      },
      vendorResults: {
        description: 'Return filtered vendors',
        resolver: 'application::vendor.vendor.search',
      },
      getSimilarVendors: {
        description: 'Return similar vendors',
        resolver: 'application::vendor.vendor.getSimilarVendors',
      },
    },
  },
}

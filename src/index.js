'use strict'

const { checkBadRequest } = require('@strapi/plugin-users-permissions/server/graphql/utils')
const { toPlainObject } = require('lodash/fp')
const utils = require('@strapi/utils')
const { getService } = require('@strapi/plugin-users-permissions/server/utils')
const { ValidationError } = utils.errors

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi } */) {
    const extensionService = strapi.plugin('graphql').service('extension')

    extensionService.use(({ nexus }) => ({
      typeDefs: `
        enum SuggestModel {
          Vendors
          ALSPs
          Consultants
          Events
          Topics
          SubTopics
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

        type EventSearchResult {
          total: Int
          events: [Event]
        }

        type EventSearchReturnType {
          success: Boolean
          data: EventSearchResult
        }

        input Taxonomy {
          id: String
          name: String
        }
    
        input VendorListingRequest {
          companyName: String
          name: String
          email: String
          ceoName: String
          ceoEmail: String
          marketName: String
          marketEmail: String
          website: String
          hqs: [String]
          offices: [String]
          productName: String
          logo: Upload
          shortDescription: String
          longDescription: String
          audiences: [String]
          subTopics: [String]
          lanuages: [String]
          deployments: [String]
          practiceAreas: [String]
          integrations: [Taxonomy]
          existingCustomers: [Taxonomy]
          typeOfUsers: [String]
          isCreate: Boolean
          notes: String
          competitor: String
          yearFounded: Int
          isOpenJobPosition: Boolean
        }
  
        input ConsultantListingRequest {
          serviceName: String
          listingName: String
          userName: String
          userRole: String
          userEmail: String
          phone: String
          marketName: String
          marketEmail: String
          ceoName: String
          ceoEmail: String
          shortDescription: String
          longDescription: String
          logo: Upload
          website: String
          hqs: [String]
          offices: [String]
          lanuages: [String]
          regionsServed: [String]
          audiences: [String]
          serviceOfferings: [String]
          yearFounded: Int
          size: Int
          isCreate: Boolean
          notes: String
        }
  
        input DedicatedResource {
          count: Int
          type: ENUM_COMPONENTCONPROPSDEDICATEDRESOURCE_TYPE
        }
  
        input Member {
          avatar: Upload
          name: String
          role: String
          bio: String
        }
  
        input Video {
          title: String
          summary: String
          url: String
        }
  
        input ScreenShot {
          title: String
          summary: String
          image: Upload
        }
  
        input Author {
          avatar: Upload
          name: String
          role: String
          company: String
        }
  
        input Testimonial {
          description: String
          author: Author
        }
  
        input VendorResource {
          title: String
          summary: String
          link: String
          publishedDate: Date
          author: String
          type: ENUM_COMPONENTVENDORPROPSPOC_TYPE
        }
  
        input EnhancedConsultantListingRequest {
          callToActionUrl: String
          callToActionText: String
          serviceBreakdown: String
          engagementLen: Int
          valueProposition: String
          dedicatedResources: [DedicatedResource]
          technology: String
          founders: [Member]
          specialists: [Member]
          competitor: String
          productVideos: [Video]
          screenShots: [ScreenShot]
          pricingData: String
          testimonials: [Testimonial]
          vendorResources: [VendorResource]
        }
  
        input EnhancedVendorListingRequest {
          callToActionUrl: String
          callToActionText: String
          productVideos: [Video]
          screenShots: [ScreenShot]
          pricingData: String
          testimonials: [Testimonial]
          vendorResources: [VendorResource]
        }
  
        input ListingRequestData {
            listingType: ENUM_LISTINGREQUEST_LISTINGTYPE
            vendorReq: VendorListingRequest
            consultantReq: ConsultantListingRequest
            alspReq: ConsultantListingRequest
            enhancedVendorReq: ComponentRequestEnhancedVendorReqInput
            enhancedConsultantReq: ComponentRequestEnhancedListReqInput
            enhancedAlspReq: ComponentRequestEnhancedListReqInput
            gReCaptchaToken: String
        }

        type SimilarVendorItem {
          model: String
          slug: String
          tool: String
          name: String
          logo: String
          rating: Float
          reviewCnt: Int
        }
    
        type SimilarVendorData {
          success: Boolean
          data: [SimilarVendorItem]
        }
    
        type VendorItem {
          id: Int
          name: String
          tool: String
          model: String
          description: String
          logo: String
          slug: String
          enhancedListingEnabled: Boolean
          subTopics: [String]
          follow: Boolean
          rating: Float
          reviewCnt: Int
          consolidation: ComponentVendorPropsConsolidation
          graveyard: ComponentVendorPropsGraveyard
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

        type ContentItem {
          id: Int
          title: String
          snippet: String
          model: String
          author: String
          expertName: [String]
          expertTitle: [String]
          expertAvatar: [String]
          taxonomy: String
          contentType: String
          content: String
          isPremium: Boolean
          phase: [String]
          audience: [String]
          audiences: [String]
          documentType: String
        }

        type ContentSearchResult {
          total: Int
          contents: [ContentItem]
        }

        type ContentSearchReturnType {
          success: Boolean
          data: ContentSearchResult
        }

        type PopularTopicListingLogo {
          url: String
        }
    
        type PopularTopicListing {
          name: String!
          logo: UploadFileEntityResponse
          slug: String!
        }
    
        type PopularTopic {
          id: Int!
          name: String!
          slug: String!
          vendors: [Vendor!]!
        }

        type FollowingSubTopic {
          id: ID
          attributes: SubTopic
        }

        type FollowingSubTopicEntity {
          data: [FollowingSubTopic]
        }

        type FollowingTopic {
          name: String!
          slug: String!
          iconName: String
          description: String
          featuredOnHome: Boolean
          subTopics: FollowingSubTopicEntity
          createdAt: DateTime
          updatedAt: DateTime
          publishedAt: DateTime
        }

        type FollowingTopicEntity {
          id: ID
          attributes: FollowingTopic
        }

        input RegisterPremiumOrganizationInput {
          name: String!
          registrationContact: ComponentRegistrationContactRegistrationContactInput!
          billingAddress: ComponentBillingAddressBillingAddressInput!
          emailDomain: String!
          paymentOption: ENUM_PREMIUMORGANIZATION_PAYMENTOPTION!
          pricingPlan: ID!
          gReCaptchaToken: String!
        }

        extend type Query {
          autosuggest(keyword: String): AutosuggestData!
          eventResults(query: JSON): EventSearchReturnType!
          organization: [String]
          location: [String]
          vendorsCount(where: JSON): Int!
          vendorResults(query: JSON): VendorSearchReturnType!
          contentResults(query: JSON): ContentSearchReturnType!
          getSimilarVendors(id: Int, model: String, from: String): SimilarVendorData!
          popularTopics(vendorLimit: Int!): [PopularTopic!]!
          isFollow(model: String, id: Int): Boolean
          followingTopics: [FollowingTopicEntity]
          userInfo(token: String): UsersPermissionsUser
        }

        extend input ReviewInput {
          gReCaptchaToken: String
        }

        extend type Mutation {
          createListingRequestData(data: ListingRequestData): ListingRequest
          registerPremiumOrganization(data: RegisterPremiumOrganizationInput!): PremiumOrganization
          changeMyPassword(input: ChangePasswordRequest): ChangePasswordPayload
          followSolution(model: String, id: Int, follow:Boolean): Boolean
          submitReview(data: ReviewInput!): Boolean
        }

        input ChangePasswordRequest {
          identifier: String!,
          password: String!,
          newPassword: String!,
          confirmPassword: String!
        }

        type ChangePasswordPayload {
          jwt: String
          user: UsersPermissionsMe!
        }

        extend input UsersPermissionsRegisterInput {
          gReCaptchaToken: String
        }

        extend input UsersPermissionsUserInput {
          userToken: String
        }

        extend type UsersPermissionsMe {
          companyName: String
        }
      `,

      resolversConfig: {
        'Query.autosuggest': {
          auth: false,
        },
        'Query.eventResults': {
          auth: false,
        },
        'Query.organization': {
          auth: false,
        },
        'Query.location': {
          auth: false,
        },
        'Query.vendorsCount': {
          auth: false,
        },
        'Query.vendorResults': {
          auth: false,
        },
        'Query.contentResults': {
          auth: false,
        },
        'Query.getSimilarVendors': {
          auth: false,
        },
        'Query.popularTopics': {
          auth: false,
        },
        'Query.isFollow': {
          auth: false,
        },
        'Query.followingTopics': {
          auth: true,
        },
        'Query.userInfo': {
          auth: false,
          middlewares: [
            async (next, parent, args, context, info) => {
              const userToken = args.token
              if (!userToken) {
                throw new ValidationError('Invalid token')
              }
              try {
                const token = await getService('jwt').verify(userToken)
                if (!token || !token.id) {
                  throw new ValidationError('Invalid token')
                }
                args.id = token.id
              } catch {
                throw new ValidationError('Invalid token')
              }

              // call the next resolver
              const res = await next(parent, args, context)

              return res
            },
          ],
        },
        'Mutation.createListingRequestData': {
          auth: false,
        },
        'Mutation.registerPremiumOrganization': {
          auth: false,
        },
        'Mutation.changeMyPassword': {
          auth: false,
        },
        'Mutation.submitReview': {
          auth: true,
        },
        'Mutation.updateUsersPermissionsUser': {
          auth: false,
          middlewares: [
            async (next, parent, args, context, info) => {
              const data = args.data
              if (!data.userToken) {
                throw new ValidationError('Invalid token')
              }
              try {
                const token = await getService('jwt').verify(data.userToken)
                if (!token || !token.id) {
                  throw new ValidationError('Invalid token')
                }
                args.id = token.id
              } catch {
                throw new ValidationError('Invalid token')
              }

              // call the next resolver
              const res = await next(parent, args, context)

              return res
            },
          ],
        },
      },
      resolvers: {
        Query: {
          autosuggest: {
            resolve: async (parent, args, context) => {
              const { keyword } = args
              return await strapi.controller('api::autosuggest.autosuggest').autosuggest(keyword)
            },
          },
          eventResults: {
            description: 'Return filtered events',
            resolver: 'application::event.event.search',
            resolve: async (obj, options, ctx) => {
              return await strapi.controller('api::event.event').search(options)
            },
          },
          organization: {
            description: 'Return organizations for event filtering',
            resolver: 'application::event.event.organization',
            resolve: async (obj, options, ctx) => {
              return await strapi.controller('api::event.event').organization(options)
            },
          },
          location: {
            description: 'Return locations for event filtering',
            resolver: 'application::event.event.location',
            resolve: async (obj, options, ctx) => {
              return await strapi.controller('api::event.event').location(options)
            },
          },
          vendorsCount: {
            description: 'Return the count of vendors',
            resolverOf: 'application::vendor.vendor.count',
            resolve: async (obj, options, ctx) => {
              return await strapi.controller('api::vendor.vendor').count(options.where || {})
            },
          },
          vendorResults: {
            description: 'Return filtered vendors',
            resolver: 'application::vendor.vendor.search',
            resolve: async (obj, options, ctx) => {
              ctx.options = options
              return await strapi.controller('api::vendor.vendor').search(ctx)
            },
          },
          contentResults: {
            description: 'Return filtered content',
            resolver: 'application::content.content.search',
            resolve: async (obj, options, ctx) => {
              ctx.options = options
              return await strapi.controller('api::content.content').search(ctx)
            },
          },
          getSimilarVendors: {
            description: 'Return similar vendors',
            resolver: 'application::vendor.vendor.getSimilarVendors',
            resolve: async (obj, options, ctx) => {
              return await strapi.controller('api::vendor.vendor').getSimilarVendors(options)
            },
          },
          popularTopics: {
            description: 'Return a list of popular topics',
            resolverOf: 'application::topic.topic.find',
            resolve: async (obj, options, { context }) => {
              const topics = await strapi.entityService.findMany('api::topic.topic', {
                filters: { featuredOnHome: true },
                limit: -1,
                publicationState: 'live',
              })
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
          isFollow: {
            description: 'is following a vendor/alsp/consultant',
            resolve: async (obj, options, ctx) => {
              ctx.options = options
              const result = await strapi.controller('api::custom.custom').isFollow(ctx)
              return result
            },
          },
          followingTopics: {
            description: 'folloing topics',
            resolve: async (obj, options, ctx) => {
              const result = await strapi.controller('api::topic.topic').followingTopics(ctx)
              return result.data
            },
          },
          userInfo: {
            resolve: async (obj, options, ctx) => {
              ctx.params = options
              await strapi.controller('plugin::users-permissions.user').findOne(ctx)
              return ctx.body
            },
          },
        },
        Mutation: {
          createListingRequestData: {
            description: 'create listing request',
            resolver: 'application::listing-request.listing-request.createListingRequestData',
            resolve: async (obj, options, ctx) => {
              return await strapi.controller('api::listing-request.listing-request').createListingRequestData(options)
            },
          },
          registerPremiumOrganization: {
            description: 'Registers a new premium organization',
            resolver: 'application::premium-organization.premium-organization.registerPremiumOrganization',
            resolve: async (obj, options, ctx) => {
              return await strapi
                .controller('api::premium-organization.premium-organization')
                .registerPremiumOrganization(options)
            },
          },
          changeMyPassword: {
            description: 'change user password request',
            resolve: async (obj, options, ctx) => {
              const { koaContext } = ctx

              koaContext.params = { provider: options.input.provider }
              koaContext.request.body = toPlainObject(options.input)
              await strapi.controller('api::password.password').change(koaContext)

              const output = koaContext.body

              checkBadRequest(output)

              return {
                user: output.user || output,
                jwt: output.jwt,
              }
            },
          },
          followSolution: {
            description: 'follow a vendor/alsp/consultant',
            resolve: async (obj, options, ctx) => {
              ctx.options = options
              const result = await strapi.controller('api::custom.custom').follow(ctx)
              return result
            },
          },
          submitReview: {
            description: 'submit a vendor/alsp/consultant review',
            resolve: async (obj, options, ctx) => {
              const { koaContext } = ctx
              koaContext.request.body = toPlainObject(options)
              const result = await strapi.controller('api::review.review').create(koaContext)
              return result
            },
          },
        },
      },
    }))
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/* { strapi } */) {},
}

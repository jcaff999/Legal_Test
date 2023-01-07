'use strict'

/**
 * autosuggest router.
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/autosuggest',
      handler: 'autosuggest.autosuggest',
      config: {
        policies: [],
      },
    },
  ],
}

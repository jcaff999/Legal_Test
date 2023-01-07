'use strict'

/**
 * reimport-els router.
 */

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/reimport-els/vendors',
      handler: 'reimport-els.vendors',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/reimport-els/autosuggest',
      handler: 'reimport-els.autosuggest',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/reimport-els/events',
      handler: 'reimport-els.events',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/reimport-els/download',
      handler: 'reimport-els.download',
      config: {
        policies: [],
      },
    },
  ],
}

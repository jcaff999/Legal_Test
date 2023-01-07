module.exports = ({ env }) => [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        directives: {
          'script-src': ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
          'img-src': ["'self'", 'data:', 'blob:', 'cdn.jsdelivr.net', 'strapi.io', `${env('AWS_S3_DOMAIN')}`]
        }
      }
    }
  },
  {
    name: 'strapi::cors',
    config: {
      headers: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
      origin: [
        'http://localhost:1337',
        'http://localhost:3000',
        'https://develop.legaltechnologyhub.com',
        'https://develop-api.legaltechnologyhub.com',
        'https://uat.legaltechnologyhub.com',
        'https://uat-api.legaltechnologyhub.com',
        'https://legaltechnologyhub.com',
        'https://www.legaltechnologyhub.com',
        'https://api.legaltechnologyhub.com',
        'https://*-legaltechhub.vercel.app'
      ]
    }
  },
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::favicon',
  'strapi::public'
];

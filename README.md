# Strapi application

A quick description of your strapi application

## Dependencies

- Node 14
- OpenSearch (1.3.x)
  
  [Documentation](https://opensearch.org/docs/1.3/opensearch/install/docker/)

  ```ssh
  docker pull opensearchproject/opensearch:1.3.6
  docker pull opensearchproject/opensearch-dashboards:1.3.6

  docker compose up
  ```

# install packages

npm install

# run development server

npm run develop

# run build and start

npm run build  \
npm run start

# run production server
https://docs-v3.strapi.io/developer-docs/latest/setup-deployment-guides/deployment/hosting-guides/amazon-aws.html

cd ~  \
pm2 start ecosystem.config.js

# populate elastic search

Open postman and run below request.

POST /reimport-els/vendors  \
POST /reimport-els/events

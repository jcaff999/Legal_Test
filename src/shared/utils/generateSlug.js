const slugify = require('slugify')

module.exports = {
  generateSlug(title) {
    /* eslint-disable-next-line no-useless-escape */
    return slugify(title, { lower: true, remove: /[*+~.,\?()\/'"!:@]/gm })
  },
}

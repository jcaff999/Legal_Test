const user = require('./content-types/user')
const auth = require('./controllers/auth')
const userCtrler = require('./controllers/user')
const userService = require('./services/user')

module.exports = (plugin) => {
  // ...

  plugin.contentTypes.user = user
  plugin.controllers.auth = auth
  plugin.controllers.user = userCtrler
  plugin.services.user = userService

  // ...

  return plugin
}


'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./material-table-core.cjs.production.min.js')
} else {
  module.exports = require('./material-table-core.cjs.development.js')
}

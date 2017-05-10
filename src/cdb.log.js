var cdb = require('cdb');

module.exports = {
  error: function() {
    console.error.apply(console, arguments);
  },

  log: function() {
    console.log.apply(console, arguments);
  },

  info: function() {
    console.log.apply(console, arguments);
  },

  debug: function() {
    if (cdb.DEBUG) console.log.apply(console, arguments);
  }
}

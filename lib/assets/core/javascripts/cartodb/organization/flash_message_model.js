var cdb = require('cartodb.js-v3');

module.exports = cdb.core.Model.extend({

  defaults: {
    msg: '',
    display: false
  },

  shouldDisplay: function () {
    return this.get('display') && !!this.get('msg');
  },

  show: function (str) {
    return this.set({
      display: true,
      msg: str
    });
  },

  hide: function () {
    this.set('display', false);
  }

});

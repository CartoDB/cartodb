var cdb = require('cartodb.js-v3');

module.exports = cdb.core.Model.extend({

  defaults: {
    msg: '',
    type: 'error',
    display: false
  },

  shouldDisplay: function () {
    return this.get('display') && !!this.get('msg') && !!this.get('type');
  },

  show: function (str, type) {
    return this.set({
      display: true,
      msg: str,
      type: type
    });
  },

  hide: function () {
    this.set('display', false);
  }

});

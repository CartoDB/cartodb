const Backbone = require('backbone');

module.exports = Backbone.Model.extend({
  defaults: {
    msg: '',
    type: 'error',
    display: false
  },

  shouldDisplay: function () {
    return this.get('display') && !!this.get('msg') && !!this.get('type');
  },

  show: function (message, type) {
    return this.set({
      display: true,
      msg: message,
      type: type
    });
  },

  hide: function () {
    this.set('display', false);
  }
});

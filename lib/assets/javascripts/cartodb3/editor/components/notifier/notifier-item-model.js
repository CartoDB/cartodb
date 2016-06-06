var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

  /*
   * Notifier item model
   *
   * It can have the following states:
   *  - loading
   *  - success
   *  - error
   */

  defaults: {
    state: 'loading'
  },

  getState: function () {
    return this.get('state');
  },

  getInfo: function () {
    return this.get('info');
  },

  getMenu: function () {
    return this.get('menu');
  },

  createActionView: function () {
    return this.get('createActionView');
  }
});

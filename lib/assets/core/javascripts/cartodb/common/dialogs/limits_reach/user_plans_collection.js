var cdb = require('cartodb.js-v3');
var Backbone = require('backbone-cdb-v3');
var UserPlanModel = require('./user_plan_model');

/**
 *  User plans collection
 *
 *  - It will get the available plans per user
 */


module.exports = Backbone.Collection.extend({

  model: UserPlanModel,

  url: function() {
    return '//' + cdb.config.get('account_host') + '/account/' + this.user.get('username') + '.json'
  },

  initialize: function(models, opts) {
    if (!opts.user) {
      throw new Error('user model is needed')
    }
    this.user = opts.user;
  },

  sync: function(method, model, options) {
    var self = this;
    var params = _.extend({
      type: 'GET',
      dataType: 'jsonp',
      url: self.url(),
      processData: false
    }, options);

    return $.ajax(params);
  },

  parse: function(r) {
    return r.available_plans
  }

})
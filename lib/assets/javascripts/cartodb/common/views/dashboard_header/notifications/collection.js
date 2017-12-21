
var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');
var Backbone = require('backbone-cdb-v3');
var UserNotificationModel = require('./model');
var UserOrganizationNotificationModel = require('./organization-model');

/**
 *  User notification default collection, it will
 *  require the user notification model
 */

module.exports = Backbone.Collection.extend({

  model: function(attrs, options) {
    if (attrs.type === 'org_notification') {
      return new UserOrganizationNotificationModel(attrs, options);
    } else {
      return new UserNotificationModel(attrs);
    }
  }

});
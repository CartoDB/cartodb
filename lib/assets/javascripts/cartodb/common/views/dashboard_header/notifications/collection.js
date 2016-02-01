
var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');
var Backbone = require('backbone-cdb-v3');
var UserNotificationModel = require('./model');

/**
 *  User notification default collection, it will
 *  require the user notification model
 */

module.exports = Backbone.Collection.extend({

  model: UserNotificationModel

});
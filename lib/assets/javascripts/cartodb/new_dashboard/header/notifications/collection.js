
var cdb = require('cartodb.js');
var $ = require('jquery');
var Backbone = require('backbone');
var UserNotificationModel = require('./model');

/**
 *  User notification default collection, it will
 *  require the user notification model
 */

module.exports = Backbone.Collection.extend({

  model: UserNotificationModel

});
const _ = require('underscore');
const $ = require('jquery');
const Backbone = require('backbone');
const User = require('dashboard/data/user-model');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

/**
 * A collection representing a set of users in a group.
 */
module.exports = Backbone.Collection.extend({

  model: User,

  initialize: function (models, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    if (!opts.group) throw new Error('group is required');
    this.group = opts.group;
  },

  url: function () {
    return this.group.url.apply(this.group, arguments) + '/users';
  },

  parse: function (response) {
    this.total_entries = response.total_entries;
    this.total_user_entries = response.total_user_entries;

    return response.users;
  },

  /**
   * Batch add users
   * @param {Array} userIds
   * @return {Object} a deferred jqXHR object
   */
  addInBatch: function (userIds, password) {
    return this._batchAsyncProcessUsers('POST', userIds, password);
  },

  removeInBatch: function (userIds, password) {
    var self = this;
    return this._batchAsyncProcessUsers('DELETE', userIds, password)
      .done(function () {
        _.each(userIds, self.remove.bind(self));
      });
  },

  _batchAsyncProcessUsers: function (method, ids, password) {
    var self = this;

    // postpone relving promise since the fetch is requries for collection to have accurate state
    var deferred = $.Deferred();
    $.ajax({
      type: method,
      url: this._configModel.get('base_url') + this.url(),
      data: {
        users: ids,
        password_confirmation: password
      },
      success: function () {
        var args = arguments;

        // because add/remove don't return any data, so need to fetch to get accurate state
        self.fetch({
          success: function () {
            deferred.resolve.apply(deferred, args);
          },
          error: function () {
            // could not update state, but resolve anyway since batch operation worked
            // might have inconsistent state though
            deferred.resolve.apply(deferred, args);
          }
        });
      },
      error: function () {
        deferred.reject.apply(deferred, arguments);
      }
    });

    return deferred;
  },

  // @return {Number, undefined} may be undefined until a first fetch is done
  totalCount: function () {
    return this.total_user_entries;
  }

});

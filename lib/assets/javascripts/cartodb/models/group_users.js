/**
 * A collection representing a set of users in a group.
 */
cdb.admin.GroupUsers = Backbone.Collection.extend({

  model: cdb.admin.User,

  initialize: function(models, opts) {
    if (!opts.group) throw new Error('group is required');
    this.group = opts.group;
  },

  url: function() {
    return this.group.url.apply(this.group, arguments) + '/users';
  },

  parse: function(response) {
    this.total_entries = response.total_entries;
    this.total_user_entries = response.total_user_entries;

    return response.users;
  },

  /**
   * Batch add users
   * @param {Array} userIds
   * @return {Object} a deferred jqXHR object
   */
  addInBatch: function(userIds) {
    return this._batchAsyncProcessUsers('POST', userIds);
  },

  removeInBatch: function(userIds) {
    var self = this;
    return this._batchAsyncProcessUsers('DELETE', userIds)
      .done(function() {
        _.each(userIds, self.remove.bind(self));
      });
  },

  _batchAsyncProcessUsers: function(method, ids) {
    var self = this;

    // postpone relving promise since the fetch is requries for collection to have accurate state
    var deferred = $.Deferred();
    $.ajax({
      type: method,
      url: cdb.config.prefixUrl() + this.url(),
      data: {
        users: ids
      },
      success: function() {
        var args = arguments;

        // because add/remove don't return any data, so need to fetch to get accurate state
        self.fetch({
          success: function() {
            deferred.resolve.apply(deferred, args);
          },
          error: function() {
            // could not update state, but resolve anyway since batch operation worked
            // might have inconsistent state though
            deferred.resolve.apply(deferred, args);
          }
        })
      },
      error: function() {
        deferred.reject.apply(deferred, arguments);
      }
    });

    return deferred;
  },

  // @return {Number, undefined} may be undefined until a first fetch is done
  totalCount: function() {
    return this.total_user_entries;
  }

});

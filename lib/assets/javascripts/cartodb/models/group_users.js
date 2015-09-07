/**
 * A collection representing a set of users in a group.
 */
cdb.admin.GroupUsers = Backbone.Collection.extend({

  model: cdb.admin.User,

  url: function() {
    return this.group.url.apply(this.group, arguments) + '/users';
  },

  initialize: function(models, opts) {
    if (!opts.group) throw new Error('group is required');
    this.group = opts.group;
  },

  // Batch add users
  addUsers: function(userIds, callbacks) {
    var self = this;
    $.ajax({
      type: 'POST',
      url: cdb.config.prefixUrl() + this.url(),
      data: {
        users: userIds
      },
      success: callbacks && callbacks.success,
      error: callbacks && callbacks.error
    });
  }

});

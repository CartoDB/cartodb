/**
 * this model contains information about the organization for
 * the current user and the users who are inside the organizacion.
 *
 * Attributes:
 *
 * - users: collection with user instances whithin the organization (see cdb.admin.Organization.Users
 *
 *
 */

cdb.admin.Organization = cdb.core.Model.extend({

  url: '/api/v1/org/',

  initialize: function() {
    this.owner = new cdb.admin.User(this.get('owner'));
    this.users = new cdb.admin.Organization.Users(null, {
      organizationId: this.id,
      owner: this.owner
    });
    this.users.reset(this.get('users'));
    // make sure all the users have a reference to this organization
    var self = this;
    this.users.each(function (u) {
      u.organization = self;
    });
  },

  fetch: function() {
    throw new Error("organization should not be fetch, shouldbe static");
  },

  containsUser: function(user) {
    return !!this.users.find(function(u) {
      return u.id === user.id;
    })
  }

});

// helper to manage organization users
cdb.admin.Organization.Users = Backbone.Collection.extend({

  model: cdb.admin.User,

  parameters: {
    per_page: 3,
    page: 1,
    order: 'username',
    q: ''
  },

  url: function() {
    var version = 'v1_1'; // ???
    var u = '/api/' + version + '/organization/' + this.organizationId + '/users';
    u += "?" + this._createUrlParameters();
    return u;
  },

  initialize: function(users, opts) {
    this.elder('initialize');
    this.organizationId = opts.organizationId;
    this.currentUserId = opts.currentUserId;
  },

  comparator: function(mdl) {
    return mdl.get('username');
  },

  _createUrlParameters: function() {
    return _.compact(_(this.parameters).map(
      function(v, k) {
        return k + "=" + encodeURIComponent(v)
      }
    )).join('&');
  },

  parse: function(r) {
    this.total_user_entries = r.total_user_entries;
    this.total_entries = r.total_entries;
    return _.map(r.users, function(user) {
      return user;
    });
  },

  fetch: function(opts) {
    this.trigger('loading');
    this.elder('fetch');
  },

  // Helper functions
  setParameter: function(key, value) {
    this.parameters[key] = value;
    return this;
  },

  getParameter: function(key) {
    return this.parameters[key]
  },

  getTotalUsers: function() {
    return this.total_user_entries
  }

});

